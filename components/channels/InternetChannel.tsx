'use client';

import { useState } from 'react';
import { ChevronLeft, Server, Database, Code, Cloud, Lock, Zap, Lightbulb } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const sections = [
  {
    id: 'architecture', name: 'System Architecture', icon: 'server', color: 'from-blue-500 to-blue-600',
    cards: [
      { title: 'Modular Design', text: 'Every system I build is modular — components can be swapped, upgraded, or scaled independently without breaking the whole.' },
      { title: 'API-First Approach', text: 'I design APIs before interfaces. This means your frontend, mobile app, and integrations all speak the same language.' },
      { title: 'Event-Driven Architecture', text: 'Systems react to events in real-time — new lead comes in, automation fires, team gets notified, client gets onboarded.' },
    ],
    callout: 'Your business runs on systems, not people. I build the systems so your team can focus on what they do best.',
  },
  {
    id: 'database', name: 'Data Management', icon: 'database', color: 'from-purple-500 to-purple-600',
    cards: [
      { title: 'Structured Data Models', text: 'Clean data architecture means your CRM, analytics, and automations all pull from a single source of truth.' },
      { title: 'Automated Pipelines', text: 'Data flows automatically between your tools — no manual entry, no copy-paste, no human error.' },
      { title: 'Analytics & Insights', text: 'Every touchpoint is tracked. You see exactly what\'s working, what\'s not, and where the money is.' },
    ],
    callout: 'Bad data = bad decisions. I make sure your data is clean, connected, and actionable.',
  },
  {
    id: 'development', name: 'Development Workflow', icon: 'code', color: 'from-green-500 to-green-600',
    cards: [
      { title: 'Rapid Prototyping', text: 'I ship MVPs fast — get something live, get feedback, iterate. No 6-month projects that never launch.' },
      { title: 'Version Control', text: 'Every change is tracked, reversible, and documented. Your codebase stays clean even as features stack.' },
      { title: 'CI/CD Pipelines', text: 'Code gets tested and deployed automatically. Push a change, see it live in minutes, not days.' },
    ],
    callout: 'Speed matters more than perfection. I get you live fast, then make it perfect.',
  },
  {
    id: 'deployment', name: 'Deployment & DevOps', icon: 'cloud', color: 'from-cyan-500 to-cyan-600',
    cards: [
      { title: 'Edge Deployment', text: 'Your site loads from the closest server to your user — fast everywhere, not just in your city.' },
      { title: 'Zero-Downtime Updates', text: 'Updates happen seamlessly. Your customers never see a maintenance page or broken experience.' },
      { title: 'Auto-Scaling', text: 'Traffic spike? The infrastructure scales automatically. You never lose a sale because your site went down.' },
    ],
    callout: 'If your site is slow or goes down, you\'re losing money. I make sure that doesn\'t happen.',
  },
  {
    id: 'security', name: 'Security & Compliance', icon: 'lock', color: 'from-red-500 to-red-600',
    cards: [
      { title: 'End-to-End Encryption', text: 'All data in transit and at rest is encrypted. Your customers\' information stays safe.' },
      { title: 'Access Controls', text: 'Role-based permissions mean people only see what they need to. No accidental data leaks.' },
      { title: 'Regular Audits', text: 'Automated security scanning catches vulnerabilities before they become problems.' },
    ],
    callout: 'Security isn\'t optional anymore. I build it in from day one, not as an afterthought.',
  },
  {
    id: 'performance', name: 'Performance Optimization', icon: 'zap', color: 'from-yellow-500 to-yellow-600',
    cards: [
      { title: 'Core Web Vitals', text: 'Your site scores 90+ on Google PageSpeed. This directly impacts your search ranking and conversion rate.' },
      { title: 'Image & Asset Optimization', text: 'Every image is compressed, lazy-loaded, and served in modern formats. Fast loads = happy users.' },
      { title: 'Caching Strategies', text: 'Smart caching means repeat visitors get instant loads. Less server work, better experience.' },
    ],
    callout: 'Every second of load time costs you conversions. I optimize everything so your site flies.',
  },
];

const iconMap: Record<string, React.ReactNode> = {
  server: <Server className="w-5 h-5" />,
  database: <Database className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  cloud: <Cloud className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
};

export default function InternetChannel({ onBack }: Props) {
  const [active, setActive] = useState(sections[0].id);
  const section = sections.find(s => s.id === active)!;

  return (
    <div className="h-full w-full flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(26,26,46,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg">🌐 Internet — Tech Docs</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (desktop) / Dropdown (mobile) */}
        <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 overflow-auto p-3 gap-1.5">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
                active === s.id ? `bg-gradient-to-r ${s.color} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              {iconMap[s.icon]}
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Mobile dropdown */}
        <div className="md:hidden px-4 pt-3 pb-1 shrink-0">
          <select value={active} onChange={e => setActive(e.target.value)}
            className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-white/10 [&>option]:text-black">
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${section.color} text-white text-sm font-bold mb-6 shadow-lg`}>
              {iconMap[section.icon]}
              {section.name}
            </div>

            <div className="space-y-4 mb-8">
              {section.cards.map((card, i) => (
                <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                  <h3 className="text-white font-bold text-base mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{card.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">What This Means For You</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{section.callout}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
