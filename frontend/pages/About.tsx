import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-nova-muted hover:text-nova-cyan mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar N.O.V.A.
      </Link>

      <h1 className="text-2xl font-bold text-nova-cyan mb-2">Over N.O.V.A.</h1>
      <p className="text-nova-muted text-sm mb-6">
        Neural Observation &amp; Voice Assistant — jouw persoonlijke AI-metgezel.
      </p>

      <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          N.O.V.A. is ontworpen als een levend digitaal wezen dat oogcontact maakt, emoties toont en
          je gedurende de dag gezelschap houdt.
        </p>
        <p>
          Gebruik het microfoon-icoon om te praten, of open het menu (•••) voor dashboard, sensoren,
          agenda, taken en instellingen.
        </p>
        <p className="text-nova-muted text-xs">
          Neon Pulse Labs · Versie 2.0
        </p>
      </div>
    </div>
  );
}
