'use client';

import { useState } from 'react';
import { ChevronLeft, Server, Database, Code, Cloud, Lock, Zap, Lightbulb } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const sections = [
  {
    id: 'architecture', name: 'System Architecture', icon: Server,
    cards: [
      { title: 'Modular Design', text: 'Every system I build is modular — components can be swapped, upgraded, or scaled independently without breaking the whole.' },
      { title: 'API-First Approach', text: 'I design APIs before interfaces. This means your frontend, mobile app, and integrations all speak the same language.' },
      { title: 'Event-Driven Architecture', text: 'Systems react to events in real-time — new lead comes in, automation fires, team gets notified, client gets onboarded.' },
    ],
    callout: 'Your business runs on systems, not people. I build the systems so your team can focus on what they do best.',
  },
  {
    id: 'database', name: 'Data Management', icon: Database,
    cards: [
      { title: 'Structured Data Models', text: 'Clean data architecture means your CRM, analytics, and automations all pull from a single source of truth.' },
      { title: 'Automated Pipelines', text: 'Data flows automatically between your tools — no manual entry, no copy-paste, no human error.' },
      { title: 'Analytics & Insights', text: 'Every touchpoint is tracked. You see exactly what\'s working, what\'s not, and where the money is.' },
    ],
    callout: 'Bad data = bad decisions. I make sure your data is clean, connected, and actionable.',
  },
  {
    id: 'development', name: 'Development', icon: Code,
    cards: [
      { title: 'Rapid Prototyping', text: 'I ship MVPs fast — get something live, get feedback, iterate. No 6-month projects that never launch.' },
      { title: 'Version Control', text: 'Every change is tracked, reversible, and documented. Your codebase stays clean even as features stack.' },
      { title: 'CI/CD Pipelines', text: 'Code gets tested and deployed automatically. Push a change, see it live in minutes, not days.' },
    ],
    callout: 'Speed matters more than perfection. I get you live fast, then make it perfect.',
  },
  {
    id: 'deployment', name: 'Deployment', icon: Cloud,
    cards: [
      { title: 'Edge Deployment', text: 'Your site loads from the closest server to your user — fast everywhere, not just in your city.' },
      { title: 'Zero-Downtime Updates', text: 'Updates happen seamlessly. Your customers never see a maintenance page or broken experience.' },
      { title: 'Auto-Scaling', text: 'Traffic spike? The infrastructure scales automatically. You never lose a sale because your site went down.' },
    ],
    callout: 'If your site is slow or goes down, you\'re losing money. I make sure that doesn\'t happen.',
  },
  {
    id: 'security', name: 'Security', icon: Lock,
    cards: [
      { title: 'End-to-End Encryption', text: 'All data in transit and at rest is encrypted. Your customers\' information stays safe.' },
      { title: 'Access Controls', text: 'Role-based permissions mean people only see what they need to. No accidental data leaks.' },
      { title: 'Regular Audits', text: 'Automated security scanning catches vulnerabilities before they become problems.' },
    ],
    callout: 'Security isn\'t optional anymore. I build it in from day one, not as an afterthought.',
  },
  {
    id: 'performance', name: 'Performance', icon: Zap,
    cards: [
      { title: 'Core Web Vitals', text: 'Your site scores 90+ on Google PageSpeed. This directly impacts your search ranking and conversion rate.' },
      { title: 'Asset Optimization', text: 'Every image is compressed, lazy-loaded, and served in modern formats. Fast loads = happy users.' },
      { title: 'Caching Strategies', text: 'Smart caching means repeat visitors get instant loads. Less server work, better experience.' },
    ],
    callout: 'Every second of load time costs you conversions. I optimize everything so your site flies.',
  },
];

const cardStyle = {
  background: 'linear-gradient(180deg, #dbe7ef 0%, #cddae4 50%, #c4d4e0 100%)',
  border: '2.5px solid rgba(255,255,255,0.85)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
};

const innerCard = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)',
  border: '1.5px solid rgba(255,255,255,0.7)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

export default function InternetChannel({ onBack }: Props) {
  const [active, setActive] = useState(sections[0].id);
  const section = sections.find(s => s.id === active)!;
  const SectionIcon = section.icon;

  return (
    <div className="h-full w-full flex flex-col" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>

      <div className="px-4 md:px-6 pb-2">
        <h1 className="text-gray-700 font-bold text-xl">🌐 Internet — Tech Docs</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (desktop) */}
        <div className="hidden md:flex flex-col w-56 shrink-0 overflow-auto p-3 gap-1.5">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                  active === s.id ? 'bg-white text-gray-700 shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile pills */}
        <div className="md:hidden px-4 pt-1 pb-2 shrink-0 flex flex-wrap gap-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                active === s.id ? 'bg-white text-gray-700 shadow-md' : 'bg-white/40 text-gray-500 hover:bg-white/60'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 md:px-6 pb-8">
          <div className="max-w-2xl space-y-4">
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                <SectionIcon className="w-4 h-4 text-gray-400" />
              </div>
              <h2 className="text-gray-700 font-bold text-base">{section.name}</h2>
            </div>

            {/* Cards */}
            {section.cards.map((card, i) => (
              <div key={i} className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-gray-700 font-bold text-sm mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}

            {/* Callout */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-gray-700 font-bold text-xs uppercase tracking-wider mb-1">What This Means For You</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{section.callout}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
