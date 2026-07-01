import { useAvatar } from '@/context/AvatarContext';
import type { AvatarLevel, AvatarSpeed, AvatarTheme } from '@/types/avatar';

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
            className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              value === opt.value
                ? 'border-nova-cyan/50 bg-nova-blue/10 text-nova-cyan'
                : 'border-nova-border bg-nova-dark text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AvatarSettingsPanel() {
  const { status, updateSettings } = useAvatar();
  if (!status) return null;

  const s = status.settings;

  return (
    <section className="nova-panel p-5 space-y-5">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Avatar Instellingen</h2>

      <label className="block space-y-1">
        <span className="text-xs text-nova-muted">Avatar Naam</span>
        <input
          className="nova-input"
          value={s.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-nova-muted">Stem</span>
        <select
          className="nova-input"
          value={s.voice}
          onChange={(e) => updateSettings({ voice: e.target.value })}
        >
          <option>Vrouw</option>
          <option>Man</option>
          <option>Neutraal</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-nova-muted">Persoonlijkheid</span>
        <select
          className="nova-input"
          value={s.personality}
          onChange={(e) => updateSettings({ personality: e.target.value })}
        >
          <option>Vriendelijk</option>
          <option>Professioneel</option>
          <option>Speels</option>
          <option>Rustig</option>
        </select>
      </label>

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
    </section>
  );
}
