import type { IdentitySnapshot, PersonProfile, PersonRelationship } from './types';
import { landmarksToDescriptor, matchFaceDescriptor } from './faceDescriptor';
import type { LandmarkPoint } from './faceDescriptor';
import {
  buildConsentPrompt,
  buildGreeting,
  buildRelationAnnouncement,
  buildUnknownGreeting,
  buildPersonalityContext,
} from './RelationEngine';
import { startVisit, endVisit } from './VisitorLogEngine';
import {
  deletePerson,
  getPerson,
  loadIdentityStore,
  upsertPerson,
} from './identityStore';

export type EnrollmentStep =
  | 'idle'
  | 'consent'
  | 'firstName'
  | 'lastName'
  | 'relationship'
  | 'capture'
  | 'done';

export interface EnrollmentDraft {
  step: EnrollmentStep;
  consentGiven: boolean;
  firstName: string;
  lastName: string;
  relationship: PersonRelationship;
  pendingDescriptor: number[] | null;
}

function uid() {
  return `person_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class IdentityEngine {
  private snapshot: IdentitySnapshot = {
    currentPersonId: null,
    currentPersonName: null,
    isKnown: false,
    isUnknown: false,
    greeting: null,
    enrollmentPrompt: null,
    activeVisitId: null,
    lastMatchConfidence: 0,
  };

  private enrollment: EnrollmentDraft = {
    step: 'idle',
    consentGiven: false,
    firstName: '',
    lastName: '',
    relationship: 'onbekend',
    pendingDescriptor: null,
  };

  private lastGreetedPersonId: string | null = null;
  private unknownFaceSince: number | null = null;
  private faceLostSince: number | null = null;
  private listeners = new Set<(s: IdentitySnapshot) => void>();

  subscribe(fn: (s: IdentitySnapshot) => void) {
    this.listeners.add(fn);
    fn(this.snapshot);
    return () => this.listeners.delete(fn);
  }

  getSnapshot() {
    return { ...this.snapshot };
  }

  getEnrollment() {
    return { ...this.enrollment };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  async tick(input: {
    faceDetected: boolean;
    landmarks: LandmarkPoint[] | null;
    enabled: boolean;
    autoGreet: boolean;
  }) {
    if (!input.enabled) {
      this.resetPresence();
      return;
    }

    if (!input.faceDetected || !input.landmarks?.length) {
      if (this.snapshot.activeVisitId && !this.faceLostSince) {
        this.faceLostSince = Date.now();
      }
      if (this.faceLostSince && Date.now() - this.faceLostSince > 2500) {
        await this.handleFaceLost();
      }
      this.unknownFaceSince = null;
      return;
    }

    this.faceLostSince = null;
    const descriptor = landmarksToDescriptor(input.landmarks);
    if (!descriptor.length) return;

    const store = await loadIdentityStore();
    const match = matchFaceDescriptor(
      descriptor,
      store.persons.map((p) => ({ id: p.id, descriptor: p.faceDescriptor }))
    );

    if (match) {
      const person = store.persons.find((p) => p.id === match.id);
      if (!person) return;

      await this.handleKnownPerson(person, match.confidence, input.autoGreet);
      this.enrollment.step = 'idle';
      this.snapshot.enrollmentPrompt = null;
    } else {
      await this.handleUnknownFace(descriptor, input.autoGreet);
    }

    this.emit();
  }

  private async handleKnownPerson(person: PersonProfile, confidence: number, autoGreet: boolean) {
    const wasUnknown = !this.snapshot.isKnown || this.snapshot.currentPersonId !== person.id;

    this.snapshot.currentPersonId = person.id;
    this.snapshot.currentPersonName = person.displayName;
    this.snapshot.isKnown = true;
    this.snapshot.isUnknown = false;
    this.snapshot.lastMatchConfidence = confidence;

    if (wasUnknown) {
      const visit = await startVisit(person);
      this.snapshot.activeVisitId = visit.id;

      person.lastVisitAt = Date.now();
      person.visitCount += 1;
      await upsertPerson(person);

      if (autoGreet && this.lastGreetedPersonId !== person.id) {
        this.snapshot.greeting = buildGreeting(person);
        this.lastGreetedPersonId = person.id;
      }
    }
  }

  private async handleUnknownFace(descriptor: number[], autoGreet: boolean) {
    this.snapshot.currentPersonId = null;
    this.snapshot.currentPersonName = null;
    this.snapshot.isKnown = false;
    this.snapshot.isUnknown = true;
    this.snapshot.lastMatchConfidence = 0;

    if (!this.unknownFaceSince) {
      this.unknownFaceSince = Date.now();
      if (!this.snapshot.activeVisitId) {
        const visit = await startVisit(null);
        this.snapshot.activeVisitId = visit.id;
      }
    }

    if (
      autoGreet &&
      this.enrollment.step === 'idle' &&
      Date.now() - (this.unknownFaceSince ?? 0) > 2000
    ) {
      this.snapshot.greeting = buildUnknownGreeting();
      this.snapshot.enrollmentPrompt = buildConsentPrompt();
      this.enrollment.step = 'consent';
      this.enrollment.pendingDescriptor = descriptor;
    }
  }

  private async handleFaceLost() {
    if (this.snapshot.activeVisitId) {
      await endVisit(this.snapshot.activeVisitId);
    }
    this.resetPresence();
    this.lastGreetedPersonId = null;
    this.emit();
  }

  private resetPresence() {
    this.snapshot.currentPersonId = null;
    this.snapshot.currentPersonName = null;
    this.snapshot.isKnown = false;
    this.snapshot.isUnknown = false;
    this.snapshot.greeting = null;
    this.snapshot.activeVisitId = null;
    this.unknownFaceSince = null;
    this.faceLostSince = null;
  }

  startEnrollment() {
    this.enrollment.step = 'consent';
    this.snapshot.enrollmentPrompt = buildConsentPrompt();
    this.emit();
  }

  acceptConsent() {
    this.enrollment.consentGiven = true;
    this.enrollment.step = 'firstName';
    this.snapshot.enrollmentPrompt = 'Hoe heet je voornaam?';
    this.emit();
  }

  setEnrollmentFirstName(name: string) {
    this.enrollment.firstName = name.trim();
    this.enrollment.step = 'lastName';
    this.snapshot.enrollmentPrompt = 'Achternaam? (optioneel, zeg "overslaan")';
    this.emit();
  }

  setEnrollmentLastName(name: string) {
    const trimmed = name.trim().toLowerCase();
    this.enrollment.lastName = trimmed === 'overslaan' ? '' : name.trim();
    this.enrollment.step = 'relationship';
    this.snapshot.enrollmentPrompt = 'Wat is je relatie tot de gebruiker?';
    this.emit();
  }

  setEnrollmentRelationship(rel: PersonRelationship) {
    this.enrollment.relationship = rel;
    this.enrollment.step = 'capture';
    this.snapshot.enrollmentPrompt = 'Even kijken… gezicht wordt opgeslagen.';
    this.emit();
  }

  async completeEnrollment(descriptor?: number[]): Promise<PersonProfile | null> {
    const desc = descriptor ?? this.enrollment.pendingDescriptor;
    if (!desc?.length || !this.enrollment.consentGiven || !this.enrollment.firstName) {
      this.cancelEnrollment();
      return null;
    }

    const displayName = this.enrollment.lastName
      ? `${this.enrollment.firstName} ${this.enrollment.lastName}`
      : this.enrollment.firstName;

    const person: PersonProfile = {
      id: uid(),
      firstName: this.enrollment.firstName,
      lastName: this.enrollment.lastName || undefined,
      displayName,
      relationship: this.enrollment.relationship,
      faceDescriptor: desc,
      favoriteGreeting: `Hoi ${this.enrollment.firstName}!`,
      visitCount: 1,
      lastVisitAt: Date.now(),
      contacts: [],
      preferences: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      consentGiven: true,
    };

    await upsertPerson(person);

    this.enrollment = {
      step: 'done',
      consentGiven: false,
      firstName: '',
      lastName: '',
      relationship: 'onbekend',
      pendingDescriptor: null,
    };
    this.snapshot.enrollmentPrompt = `Leuk je te ontmoeten, ${person.firstName}!`;
    this.snapshot.greeting = buildGreeting(person);
    this.lastGreetedPersonId = person.id;
    this.emit();

    return person;
  }

  cancelEnrollment() {
    this.enrollment = {
      step: 'idle',
      consentGiven: false,
      firstName: '',
      lastName: '',
      relationship: 'onbekend',
      pendingDescriptor: null,
    };
    this.snapshot.enrollmentPrompt = null;
    this.emit();
  }

  async removePerson(personId: string) {
    await deletePerson(personId);
    if (this.snapshot.currentPersonId === personId) this.resetPresence();
    this.emit();
  }

  async buildAiContext(): Promise<string> {
    const person = this.snapshot.currentPersonId
      ? await getPerson(this.snapshot.currentPersonId)
      : null;
    const parts = [buildPersonalityContext(person)];
    if (person) parts.push(buildRelationAnnouncement(person));
    return parts.filter(Boolean).join(' ');
  }

  clearGreeting() {
    this.snapshot.greeting = null;
    this.emit();
  }
}

export const identityEngine = new IdentityEngine();
