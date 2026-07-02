import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useClientOnly } from '@/hooks/useClientOnly';
import { cameraEngine } from '@/lib/avatar/engine/CameraEngine';
import { identityCareEngine } from '@/lib/identity/IdentityCareEngine';
import {
  identityEngine,
  type EnrollmentDraft,
} from '@/lib/identity/IdentityEngine';
import {
  loadIdentityStore,
  updateIdentitySettings,
} from '@/lib/identity/identityStore';
import type {
  IdentitySettings,
  IdentitySnapshot,
  PersonProfile,
  PersonRelationship,
} from '@/lib/identity/types';
import { DEFAULT_IDENTITY_SETTINGS } from '@/lib/identity/types';
import { landmarksToDescriptor } from '@/lib/identity/faceDescriptor';
import { speakText } from '@/lib/voice/textToSpeech';
import { voiceState } from '@/lib/voice/voiceState';
import { voiceEngineV2 } from '@/lib/voice/v2/VoiceEngineV2';
import { VoiceState } from '@/lib/voice/v2/types';

interface IdentityContextValue {
  snapshot: IdentitySnapshot;
  enrollment: EnrollmentDraft;
  settings: IdentitySettings;
  persons: PersonProfile[];
  careAlert: string | null;
  acceptConsent: () => void;
  setEnrollmentFirstName: (name: string) => void;
  setEnrollmentLastName: (name: string) => void;
  setEnrollmentRelationship: (rel: PersonRelationship) => void;
  completeEnrollment: () => Promise<void>;
  cancelEnrollment: () => void;
  startEnrollment: () => void;
  removePerson: (id: string) => Promise<void>;
  updateSettings: (partial: Partial<IdentitySettings>) => Promise<void>;
  refreshPersons: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const client = useClientOnly();
  const { cameraSignals, status } = useAvatar();
  const [snapshot, setSnapshot] = useState<IdentitySnapshot>(identityEngine.getSnapshot());
  const [enrollment, setEnrollment] = useState<EnrollmentDraft>(identityEngine.getEnrollment());
  const [settings, setSettings] = useState<IdentitySettings>(DEFAULT_IDENTITY_SETTINGS);
  const [persons, setPersons] = useState<PersonProfile[]>([]);
  const [careAlert, setCareAlert] = useState<string | null>(null);
  const lastSpokenGreeting = useRef<string | null>(null);
  const lastInteractionAt = useRef(Date.now());

  const refreshPersons = useCallback(async () => {
    const store = await loadIdentityStore();
    setSettings(store.settings);
    setPersons(store.persons);
  }, []);

  useEffect(() => {
    void refreshPersons();
    const unsub = identityEngine.subscribe((s) => {
      setSnapshot(s);
      setEnrollment(identityEngine.getEnrollment());
    });
    return () => {
      unsub();
    };
  }, [refreshPersons]);

  useEffect(() => {
    if (!client) return;
    const bump = () => {
      lastInteractionAt.current = Date.now();
    };
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    return () => {
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    const id = window.setInterval(() => {
      const cameraOn =
        Boolean(status?.settings.cameraEnabled) &&
        cameraSignals.permission === 'granted' &&
        cameraSignals.available;

      if (!cameraOn || !settings.faceRecognitionEnabled) {
        cameraEngine.setIdentityOverlay(null, null, false);
        return;
      }

      const voiceIdle = voiceEngineV2.getSnapshot().state === VoiceState.IDLE;

      void identityCareEngine
        .tick({
          faceDetected: cameraSignals.faceDetected,
          landmarks: cameraEngine.getLastLandmarks(),
          inactiveMs: Date.now() - lastInteractionAt.current,
          faceRecognitionEnabled: settings.faceRecognitionEnabled,
          autoGreet: Boolean(status?.settings.initiativeEnabled) && voiceIdle && !voiceState.isSpeaking,
        })
        .then(() => {
          const snap = identityEngine.getSnapshot();
          cameraEngine.setIdentityOverlay(
            snap.currentPersonId,
            snap.currentPersonName,
            snap.isKnown
          );
          setCareAlert(identityCareEngine.getCareAlert());
        });
    }, 450);

    return () => clearInterval(id);
  }, [client, cameraSignals, status?.settings, settings.faceRecognitionEnabled]);

  useEffect(() => {
    const greeting = snapshot.greeting;
    if (!greeting || greeting === lastSpokenGreeting.current) return;
    if (voiceEngineV2.getSnapshot().state !== VoiceState.IDLE || voiceState.isSpeaking) return;

    lastSpokenGreeting.current = greeting;
    void speakText(greeting, {
      onEnd: () => {
        identityEngine.clearGreeting();
        lastSpokenGreeting.current = null;
      },
    });
  }, [snapshot.greeting]);

  const acceptConsent = useCallback(() => identityEngine.acceptConsent(), []);
  const setEnrollmentFirstName = useCallback((name: string) => identityEngine.setEnrollmentFirstName(name), []);
  const setEnrollmentLastName = useCallback((name: string) => identityEngine.setEnrollmentLastName(name), []);
  const setEnrollmentRelationship = useCallback(
    (rel: PersonRelationship) => identityEngine.setEnrollmentRelationship(rel),
    []
  );
  const cancelEnrollment = useCallback(() => identityEngine.cancelEnrollment(), []);
  const startEnrollment = useCallback(() => identityEngine.startEnrollment(), []);

  const completeEnrollment = useCallback(async () => {
    const desc = cameraEngine.getLastLandmarks();
    const descriptor = desc?.length ? landmarksToDescriptor(desc) : undefined;
    await identityEngine.completeEnrollment(descriptor);
    await refreshPersons();
  }, [refreshPersons]);

  const removePerson = useCallback(
    async (id: string) => {
      await identityEngine.removePerson(id);
      await refreshPersons();
    },
    [refreshPersons]
  );

  const updateSettings = useCallback(
    async (partial: Partial<IdentitySettings>) => {
      await updateIdentitySettings(partial);
      await refreshPersons();
    },
    [refreshPersons]
  );

  const value: IdentityContextValue = {
    snapshot,
    enrollment,
    settings,
    persons,
    careAlert,
    acceptConsent,
    setEnrollmentFirstName,
    setEnrollmentLastName,
    setEnrollmentRelationship,
    completeEnrollment,
    cancelEnrollment,
    startEnrollment,
    removePerson,
    updateSettings,
    refreshPersons,
  };

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
}
