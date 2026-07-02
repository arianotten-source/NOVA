import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
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
import { voiceState } from '@/lib/voice/voiceState';
import { voiceEngineV2 } from '@/lib/voice/v2/VoiceEngineV2';
import { VoiceState } from '@/lib/voice/v2/types';
import { isMobileDevice } from '@/lib/runtime/isMobile';

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

const EMPTY_IDENTITY: IdentityContextValue = {
  snapshot: identityEngine.getSnapshot(),
  enrollment: identityEngine.getEnrollment(),
  settings: DEFAULT_IDENTITY_SETTINGS,
  persons: [],
  careAlert: null,
  acceptConsent: () => {},
  setEnrollmentFirstName: () => {},
  setEnrollmentLastName: () => {},
  setEnrollmentRelationship: () => {},
  completeEnrollment: async () => {},
  cancelEnrollment: () => {},
  startEnrollment: () => {},
  removePerson: async () => {},
  updateSettings: async () => {},
  refreshPersons: async () => {},
};

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const client = useClientOnly();
  const location = useLocation();
  const { cameraSignals, status } = useAvatar();
  const [snapshot, setSnapshot] = useState<IdentitySnapshot>(identityEngine.getSnapshot());
  const [enrollment, setEnrollment] = useState<EnrollmentDraft>(identityEngine.getEnrollment());
  const [settings, setSettings] = useState<IdentitySettings>(DEFAULT_IDENTITY_SETTINGS);
  const [persons, setPersons] = useState<PersonProfile[]>([]);
  const [careAlert, setCareAlert] = useState<string | null>(null);
  const lastInteractionAt = useRef(Date.now());
  const cameraSignalsRef = useRef(cameraSignals);
  const settingsRef = useRef(settings);
  const statusRef = useRef(status);

  cameraSignalsRef.current = cameraSignals;
  settingsRef.current = settings;
  statusRef.current = status;

  const isAvatarHome = location.pathname === '/' || location.pathname === '';

  const refreshPersons = useCallback(async () => {
    try {
      const store = await loadIdentityStore();
      setSettings(store.settings);
      setPersons(store.persons);
    } catch (err) {
      console.warn('[Identity] load failed', err);
    }
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
    if (!client || !isAvatarHome) return;

    const startDelay = isMobileDevice() ? 3000 : 800;
    let intervalId = 0;

    const startTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
      const cam = cameraSignalsRef.current;
      const cfg = settingsRef.current;
      const st = statusRef.current;

      const cameraOn =
        Boolean(st?.settings.cameraEnabled) &&
        cam.permission === 'granted' &&
        cam.available;

      if (!cameraOn || !cfg.faceRecognitionEnabled) {
        cameraEngine.setIdentityOverlay(null, null, false);
        return;
      }

      const voiceIdle = voiceEngineV2.getSnapshot().state === VoiceState.IDLE;

      void identityCareEngine
        .tick({
          faceDetected: cam.faceDetected,
          landmarks: cameraEngine.getLastLandmarks(),
          inactiveMs: Date.now() - lastInteractionAt.current,
          faceRecognitionEnabled: cfg.faceRecognitionEnabled,
          autoGreet: Boolean(st?.settings.initiativeEnabled) && voiceIdle && !voiceState.isSpeaking,
        })
        .then(() => {
          const snap = identityEngine.getSnapshot();
          cameraEngine.setIdentityOverlay(
            snap.currentPersonId,
            snap.currentPersonName,
            snap.isKnown
          );
          setCareAlert(identityCareEngine.getCareAlert());
        })
        .catch((err) => {
          console.warn('[Identity] tick failed', err);
        });
    }, 600);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [client, isAvatarHome]);

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
    try {
      const desc = cameraEngine.getLastLandmarks();
      const descriptor = desc?.length ? landmarksToDescriptor(desc) : undefined;
      await identityEngine.completeEnrollment(descriptor);
      await refreshPersons();
    } catch (err) {
      console.warn('[Identity] enrollment failed', err);
    }
  }, [refreshPersons]);

  const removePerson = useCallback(
    async (id: string) => {
      try {
        await identityEngine.removePerson(id);
        await refreshPersons();
      } catch (err) {
        console.warn('[Identity] remove failed', err);
      }
    },
    [refreshPersons]
  );

  const updateSettings = useCallback(
    async (partial: Partial<IdentitySettings>) => {
      try {
        await updateIdentitySettings(partial);
        await refreshPersons();
      } catch (err) {
        console.warn('[Identity] settings update failed', err);
      }
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

/** Safe variant — never throws, returns inert defaults */
export function useIdentityOptional() {
  return useContext(IdentityContext) ?? EMPTY_IDENTITY;
}
