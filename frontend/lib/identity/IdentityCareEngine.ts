import { identityEngine } from './IdentityEngine';
import { loadIdentityStore } from './identityStore';
import { buildCareContext, detectMissedVisit, detectStillnessAlert } from './CareEngine';
import { requestSmartCall } from './SmartCallEngine';
import type { LandmarkPoint } from './faceDescriptor';

export class IdentityCareEngine {
  private careAlert: string | null = null;

  async tick(input: {
    faceDetected: boolean;
    landmarks: LandmarkPoint[] | null;
    inactiveMs: number;
    faceRecognitionEnabled: boolean;
    autoGreet: boolean;
  }) {
    const store = await loadIdentityStore();
    if (!store.settings.faceRecognitionEnabled || !input.faceRecognitionEnabled) return;

    await identityEngine.tick({
      faceDetected: input.faceDetected,
      landmarks: input.landmarks,
      enabled: true,
      autoGreet: store.settings.autoGreetKnown && input.autoGreet,
    });

    this.careAlert = detectStillnessAlert(input.inactiveMs);

    for (const person of store.persons) {
      if (person.usualVisitDay) {
        const missed = detectMissedVisit(person.displayName, person.usualVisitDay, person.lastVisitAt);
        if (missed) this.careAlert = missed;
      }
    }
  }

  getCareAlert() {
    return this.careAlert;
  }

  async buildFullAiContext(): Promise<string> {
    const store = await loadIdentityStore();
    const identity = await identityEngine.buildAiContext();
    const care = buildCareContext(store.care);
    return [identity, care].filter(Boolean).join('\n');
  }

  async handleSmartCallQuery(
    query: string,
    onConfirm: Parameters<typeof requestSmartCall>[2]
  ) {
    const store = await loadIdentityStore();
    return requestSmartCall(query, store.persons, onConfirm);
  }
}

export const identityCareEngine = new IdentityCareEngine();
