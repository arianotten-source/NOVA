import { useSettings } from '@/hooks/useSettings';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AppSettings } from '@/types';

export default function Settings() {
  const { settings, loaded, updateSettings } = useSettings();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded) setForm(settings);
  }, [loaded, settings]);

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Instellingen</h1>
          <button onClick={handleSave} className="nova-btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saved ? 'Opgeslagen!' : 'Opslaan'}
          </button>
        </div>

        <section className="nova-panel p-6 space-y-5">
          <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Profiel</h2>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Naam</label>
            <input
              className="nova-input"
              value={form.userName}
              onChange={(e) => handleChange('userName', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Taal</label>
            <select className="nova-input" value={form.language} onChange={(e) => handleChange('language', e.target.value)}>
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Thema</label>
            <select className="nova-input" value={form.theme} onChange={(e) => handleChange('theme', e.target.value)}>
              <option value="dark">Donker</option>
              <option value="light">Licht (binnenkort)</option>
            </select>
          </div>
        </section>

        <section className="nova-panel p-6 space-y-5">
          <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">AI Instellingen</h2>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Provider</label>
            <select className="nova-input" value={form.aiProvider} onChange={(e) => handleChange('aiProvider', e.target.value)}>
              <option value="none">Geen (basis antwoorden)</option>
              <option value="openai">OpenAI (binnenkort)</option>
              <option value="local">Lokale LLM (binnenkort)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Model</label>
            <input
              className="nova-input"
              value={form.aiModel}
              onChange={(e) => handleChange('aiModel', e.target.value)}
              placeholder="bijv. gpt-4, llama-3"
            />
          </div>
        </section>

        <section className="nova-panel p-6 space-y-5">
          <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Spraak</h2>
          <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.voiceEnabled}
              onChange={(e) => handleChange('voiceEnabled', e.target.checked)}
              className="accent-nova-blue w-4 h-4"
            />
            Spraak invoer inschakelen
          </label>
        </section>

        <section className="nova-panel p-6">
          <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider mb-3">Toekomstige uitbreidingen</h2>
          <div className="grid grid-cols-2 gap-2 text-xs text-nova-muted">
            {['Camera vision', 'Gezichtsherkenning', 'Robotlichaam', 'ESP32 modules', 'Smart home', 'Persoonlijk geheugen', 'Emotie analyse', 'Lokale AI modellen', 'Home Assistant'].map((item) => (
              <div key={item} className="px-3 py-2 rounded-lg bg-nova-dark border border-nova-border">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
