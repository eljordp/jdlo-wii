'use client';

import { useState } from 'react';
import { ChevronLeft, MapPin, Mail, Linkedin, Instagram, Palette } from 'lucide-react';
import { PROFILE_PHOTO, type WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const skills = [
  { name: 'Conversion Architecture', level: 95, color: '#3b82f6' },
  { name: 'UI/UX Design', level: 90, color: '#8b5cf6' },
  { name: 'Creative Coding', level: 85, color: '#ec4899' },
  { name: 'System Execution', level: 92, color: '#06b6d4' },
  { name: 'Brand Clarity', level: 88, color: '#f97316' },
  { name: 'Bottleneck Removal', level: 95, color: '#22c55e' },
];

const interests = [
  { icon: '🎨', name: 'Design', desc: 'Convert attention to cashflow' },
  { icon: '💻', name: 'Coding', desc: 'Tools that remove friction' },
  { icon: '🎮', name: 'Gaming', desc: 'Retro & modern games' },
  { icon: '🎵', name: 'Music', desc: 'All genres' },
  { icon: '📚', name: 'Learning', desc: 'Continuous Evolution' },
  { icon: '🚀', name: 'Innovation', desc: 'Room for opportunity' },
];

const tabs = ['bio', 'skills', 'interests', 'contact'] as const;

export default function MiiChannel({ onBack }: Props) {
  const [tab, setTab] = useState<typeof tabs[number]>('bio');

  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(79,172,254,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg">Mii Channel</h1>
        </div>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center py-8 px-4">
        <div className="relative">
          <img src={PROFILE_PHOTO} alt="JDLO" className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] object-cover" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-400 rounded-full border-3 border-white" />
        </div>
        <h2 className="text-white text-3xl md:text-4xl font-black mt-5 drop-shadow-lg">@jdlo</h2>
        <p className="text-white/80 text-sm md:text-base mt-1 font-medium">Systems Operator</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-1.5 px-4 mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200 capitalize ${
              tab === t
                ? 'bg-white text-blue-600 shadow-lg scale-105'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pb-10 max-w-2xl mx-auto space-y-4">
        {tab === 'bio' && (
          <>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">
              <p className="text-gray-800 text-sm md:text-base leading-relaxed">
                &ldquo;I build systems that turn attention into action. My role is to design the structure, then let the system do the work.&rdquo;
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg">
              <p className="text-gray-800 text-sm md:text-base leading-relaxed">
                I don&apos;t sell pages — I design flows. UI/UX design, and creative coding.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-gray-800 text-sm md:text-base font-medium">Napa Valley | Bay Area 🌎</p>
            </div>
          </>
        )}

        {tab === 'skills' && (
          <div className="space-y-3">
            {skills.map(s => (
              <div key={s.name} className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-gray-800 font-bold text-sm">{s.name}</span>
                  <span className="text-gray-500 text-xs font-bold">{s.level}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full animate-fill" style={{ width: `${s.level}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'interests' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {interests.map(it => (
              <div key={it.name} className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg text-center hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">{it.icon}</div>
                <h3 className="text-gray-800 font-bold text-sm">{it.name}</h3>
                <p className="text-gray-500 text-[11px] mt-1">{it.desc}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'contact' && (
          <div className="space-y-3">
            {[
              { href: 'mailto:jordan@firstclassinternational.com', icon: <Mail className="w-6 h-6 text-blue-500" />, label: 'Email', sub: 'jordan@firstclassinternational.com' },
              { href: 'https://www.linkedin.com/in/jordan-lopez-764974388/', icon: <Linkedin className="w-6 h-6 text-blue-700" />, label: 'LinkedIn', sub: 'jordan-lopez' },
              { href: 'https://www.instagram.com/jdlo/', icon: <Instagram className="w-6 h-6 text-pink-500" />, label: 'Instagram', sub: '@jdlo' },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:bg-white hover:scale-[1.02] transition-all block">
                {link.icon}
                <div>
                  <p className="text-gray-800 font-bold text-sm">{link.label}</p>
                  <p className="text-gray-500 text-xs">{link.sub}</p>
                </div>
              </a>
            ))}
            <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <Palette className="w-6 h-6 text-purple-500" />
              <div>
                <p className="text-gray-800 font-bold text-sm">Portfolio</p>
                <p className="text-gray-500 text-xs">You&apos;re looking at it ✨</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
