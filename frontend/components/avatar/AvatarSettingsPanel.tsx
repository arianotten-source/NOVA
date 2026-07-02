import { useAvatar } from '@/context/AvatarContext';
import { useIdentity } from '@/context/IdentityContext';
import type { AvatarLevel, AvatarPersonalityId, AvatarSpeed, AvatarTheme } from '@/types/avatar';
import { PERSONALITIES } from '@/lib/avatar/engine/personalities';
import { cn } from '@/lib/utils';

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-nova-muted uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold border transition-colors touch-manipulation',
              value === opt.value
                ? 'border-nova-cyan/50 bg-nova-blue/10 text-nova-cyan'
                : 'border-nova-border bg-nova-dark text-gray-300'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AvatarSettingsPanel() {
  const { status, updateSettings, enableCamera, disableCamera, cameraSignals } = useAvatar();
  const { settings: identitySettings, persons, updateSettings: updateIdentity, removePerson } =
    useIdentity();
  if (!status) return null;

  const s = { ...status.settings, autonomousAvatar: status.settings.autonomousAvatar ?? true };

  return (
    <section className="nova-panel p-5 space-y-5">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Avatar Instellingen</h2>

      <label className="flex items-center justify-between gap-4 min-h-[48px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer">
        <div>
          <span className="text-sm font-semibold text-gray-100">Autonomous Avatar</span>
          <p className="text-xs text-nova-muted mt-0.5">N.O.V.A. regelt emoties volledig zelfstandig</p>
        </div>
        <input
          type="checkbox"
          className="w-5 h-5 accent-nova-cyan"
          checked={s.autonomousAvatar}
          onChange={(e) => updateSettings({ autonomousAvatar: e.target.checked })}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-nova-muted">Avatar Naam</span>
        <input className="nova-input" value={s.name} onChange={(e) => updateSettings({ name: e.target.value })} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-nova-muted">Stem</span>
        <select className="nova-input" value={s.voice} onChange={(e) => updateSettings({ voice: e.target.value })}>
          <option>Vrouw</option>
          <option>Man</option>
          <option>Neutraal</option>
        </select>
      </label>

      <OptionGroup<AvatarPersonalityId>
        label="Persoonlijkheid"
        value={s.personalityId ?? 'friendly'}
        options={Object.values(PERSONALITIES).map((p) => ({ value: p.id, label: p.label }))}
        onChange={(v) => updateSettings({ personalityId: v, personality: PERSONALITIES[v].label })}
      />

      <OptionGroup<AvatarSpeed>
        label="Animatiesnelheid"
        value={s.animationSpeed}
        options={[
          { value: 'slow', label: 'Langzaam' },
          { value: 'normal', label: 'Normaal' },
          { value: 'fast', label: 'Snel' },
        ]}
        onChange={(v) => updateSettings({ animationSpeed: v })}
      />

      <OptionGroup<AvatarLevel>
        label="Oogknipper frequentie"
        value={s.blinkFrequency}
        options={[
          { value: 'low', label: 'Laag' },
          { value: 'normal', label: 'Normaal' },
          { value: 'high', label: 'Hoog' },
        ]}
        onChange={(v) => updateSettings({ blinkFrequency: v })}
      />

      <OptionGroup<AvatarLevel>
        label="Expressie intensiteit"
        value={s.expressionIntensity}
        options={[
          { value: 'low', label: 'Laag' },
          { value: 'normal', label: 'Normaal' },
          { value: 'strong', label: 'Sterk' },
        ]}
        onChange={(v) => updateSettings({ expressionIntensity: v })}
      />

      <OptionGroup<AvatarTheme>
        label="Thema"
        value={s.theme}
        options={[
          { value: 'classic', label: 'Classic' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'robot', label: 'Robot' },
          { value: 'neo', label: 'Neo' },
        ]}
        onChange={(v) => updateSettings({ theme: v })}
      />

      <div className="pt-2 border-t border-nova-border space-y-3">
        <span className="text-xs text-nova-muted uppercase tracking-wider">Presence Intelligence</span>

        {(
          [
            ['alwaysListening', 'Always Listening', 'Microfoon blijft actief na toestemming'],
            ['wakeWordEnabled', 'Wake Word', 'Reageert op Hey Nova / Nova'],
            ['eyeTrackingEnabled', 'Eye Tracking', 'Ogen volgen gezicht via camera'],
            ['followUserEnabled', 'Follow User', 'Pupillen volgen beweging'],
            ['presenceDetectionEnabled', 'Presence Detection', 'Detecteert aanwezigheid'],
            ['lipSyncEnabled', 'Lip Sync', 'Mond synchroon tijdens spreken'],
            ['idleAnimationsEnabled', 'Idle Animations', 'Natuurlijke idle bewegingen'],
            ['autonomousPersonality', 'Autonomous Personality', 'Zelfstandige emoties'],
            ['silentMode', 'Silent Mode', 'Geen geluiden — alleen visuele feedback'],
          ] as const
        ).map(([key, label, hint]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-4 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer"
          >
            <div>
              <span className="text-sm text-gray-100">{label}</span>
              <p className="text-xs text-nova-muted">{hint}</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 accent-nova-cyan"
              checked={s[key] ?? true}
              onChange={(e) => updateSettings({ [key]: e.target.checked })}
            />
          </label>
        ))}
      </div>

      <div className="pt-2 border-t border-nova-border space-y-3">
        <span className="text-xs text-nova-muted uppercase tracking-wider">Privacy &amp; Presence</span>

        <label className="flex items-center justify-between gap-4 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer">
          <div>
            <span className="text-sm text-gray-100">Aanwezigheidsgeheugen</span>
            <p className="text-xs text-nova-muted">Leert voorkeuren lokaal op dit apparaat</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-nova-cyan"
            checked={s.presenceMemoryEnabled ?? true}
            onChange={(e) => updateSettings({ presenceMemoryEnabled: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between gap-4 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer">
          <div>
            <span className="text-sm text-gray-100">Eigen initiatief</span>
            <p className="text-xs text-nova-muted">N.O.V.A. mag af en toe iets zeggen</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-nova-cyan"
            checked={s.initiativeEnabled ?? true}
            onChange={(e) => updateSettings({ initiativeEnabled: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between gap-4 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer">
          <div>
            <span className="text-sm text-gray-100">Alleen lokaal verwerken</span>
            <p className="text-xs text-nova-muted">Geen cloud voor camera of geheugen</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-nova-cyan"
            checked={s.localProcessingOnly ?? true}
            onChange={(e) => updateSettings({ localProcessingOnly: e.target.checked })}
          />
        </label>
      </div>

      <div className="pt-2 border-t border-nova-border space-y-2">
        <span className="text-xs text-nova-muted uppercase tracking-wider">Camera Awareness</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="nova-btn-primary min-h-[40px]" onClick={enableCamera}>
            Camera inschakelen
          </button>
          <button type="button" className="nova-btn-ghost min-h-[40px]" onClick={disableCamera}>
            Uitschakelen
          </button>
        </div>
        <p className="text-xs text-nova-muted">
          Status: {cameraSignals.permission}
          {cameraSignals.faceDetected ? ' · Gezicht gedetecteerd' : ''}
          {cameraSignals.personKnown && cameraSignals.personName
            ? ` · ${cameraSignals.personName}`
            : ''}
        </p>
      </div>

      <div className="pt-2 border-t border-nova-border space-y-3">
        <span className="text-xs text-nova-muted uppercase tracking-wider">Identity &amp; Gezichten</span>

        <label className="flex items-center justify-between gap-4 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer">
          <div>
            <span className="text-sm text-gray-100">Gezichtsherkenning</span>
            <p className="text-xs text-nova-muted">Herken bekende bezoekers via camera</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-nova-cyan"
            checked={identitySettings.faceRecognitionEnabled}
            onChange={(e) => updateIdentity({ faceRecognitionEnabled: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between gap-4 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer">
          <div>
            <span className="text-sm text-gray-100">Automatisch begroeten</span>
            <p className="text-xs text-nova-muted">Nova spreekt bekende gezichten aan</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-nova-cyan"
            checked={identitySettings.autoGreetKnown}
            onChange={(e) => updateIdentity({ autoGreetKnown: e.target.checked })}
          />
        </label>

        {persons.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-nova-muted">Opgeslagen gezichten ({persons.length})</span>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {persons.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-nova-dark border border-nova-border text-xs"
                >
                  <span className="text-gray-200">
                    {p.displayName}{' '}
                    <span className="text-nova-muted">({p.relationship})</span>
                  </span>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-300 touch-manipulation px-2 py-1"
                    onClick={() => void removePerson(p.id)}
                  >
                    Verwijder
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
