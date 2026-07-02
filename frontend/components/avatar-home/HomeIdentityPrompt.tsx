import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIdentity } from '@/context/IdentityContext';
import { RELATIONSHIP_OPTIONS } from '@/lib/identity/types';
import type { PersonRelationship } from '@/lib/identity/types';

export default function HomeIdentityPrompt() {
  const {
    snapshot,
    enrollment,
    acceptConsent,
    setEnrollmentFirstName,
    setEnrollmentLastName,
    setEnrollmentRelationship,
    completeEnrollment,
    cancelEnrollment,
  } = useIdentity();

  const [textInput, setTextInput] = useState('');
  const active = enrollment.step !== 'idle' && enrollment.step !== 'done';

  useEffect(() => {
    if (enrollment.step === 'capture') {
      void completeEnrollment();
    }
  }, [enrollment.step, completeEnrollment]);

  if (!active && !snapshot.enrollmentPrompt) return null;

  const prompt = snapshot.enrollmentPrompt;

  const submitText = () => {
    const value = textInput.trim();
    if (!value) return;
    setTextInput('');

    if (enrollment.step === 'firstName') setEnrollmentFirstName(value);
    else if (enrollment.step === 'lastName') setEnrollmentLastName(value);
  };

  const pickRelationship = (rel: PersonRelationship) => {
    setEnrollmentRelationship(rel);
  };

  return (
    <div className="absolute top-[18%] left-0 right-0 px-6 z-20 pointer-events-none">
      <AnimatePresence mode="wait">
        {(active || prompt) && (
          <motion.div
            key={enrollment.step}
            className="mx-auto max-w-sm rounded-2xl border border-nova-cyan/30 bg-nova-dark/90 backdrop-blur-md p-4 pointer-events-auto shadow-lg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {prompt && (
              <p className="text-sm text-nova-cyan text-center leading-relaxed mb-3">{prompt}</p>
            )}

            {enrollment.step === 'consent' && (
              <div className="flex gap-2 justify-center">
                <button type="button" className="nova-btn-primary min-h-[40px] flex-1" onClick={acceptConsent}>
                  Ja, graag
                </button>
                <button type="button" className="nova-btn-ghost min-h-[40px] flex-1" onClick={cancelEnrollment}>
                  Nee
                </button>
              </div>
            )}

            {(enrollment.step === 'firstName' || enrollment.step === 'lastName') && (
              <div className="flex gap-2">
                <input
                  className="nova-input flex-1 text-sm"
                  placeholder={enrollment.step === 'firstName' ? 'Voornaam' : 'Achternaam'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitText()}
                />
                <button type="button" className="nova-btn-primary min-h-[40px] px-4" onClick={submitText}>
                  OK
                </button>
              </div>
            )}

            {enrollment.step === 'relationship' && (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto justify-center">
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg text-[11px] border border-nova-border bg-nova-dark text-gray-200 hover:border-nova-cyan/50 touch-manipulation"
                    onClick={() => pickRelationship(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {enrollment.step === 'capture' && (
              <p className="text-xs text-nova-muted text-center animate-pulse">Gezicht wordt opgeslagen…</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
