'use client';

import { ChevronLeft, MapPin, Mail, Linkedin, Instagram, Palette, ExternalLink } from 'lucide-react';
import { PROFILE_PHOTO, type WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const skills = [
  { name: 'Conversion Architecture', level: 95 },
  { name: 'UI/UX Design', level: 90 },
  { name: 'Creative Coding', level: 85 },
  { name: 'System Execution', level: 92 },
  { name: 'Brand Clarity', level: 88 },
  { name: 'Bottleneck Removal', level: 95 },
];

const interests = [
  { icon: '🎨', name: 'Design' },
  { icon: '💻', name: 'Coding' },
  { icon: '🎮', name: 'Gaming' },
  { icon: '🎵', name: 'Music' },
  { icon: '📚', name: 'Learning' },
  { icon: '🚀', name: 'Innovation' },
];

const contacts = [
  { href: 'mailto:jordan@firstclassinternational.com', icon: Mail, color: '#6b8ca8', label: 'Email', sub: 'jordan@firstclassinternational.com' },
  { href: 'https://www.linkedin.com/in/jordan-lopez-764974388/', icon: Linkedin, color: '#6b8ca8', label: 'LinkedIn', sub: 'jordan-lopez' },
  { href: 'https://www.instagram.com/jdlo/', icon: Instagram, color: '#6b8ca8', label: 'Instagram', sub: '@jdlo' },
];

const cardStyle = {
  background: 'linear-gradient(180deg, #dbe7ef 0%, #cddae4 50%, #c4d4e0 100%)',
  border: '2.5px solid rgba(255,255,255,0.85)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
};

export default function MiiChannel({ onBack }: Props) {
  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>

      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>

      <div className="px-4 md:px-8 pb-10 max-w-2xl mx-auto space-y-4">

        {/* ═══════ PROFILE CARD ═══════ */}
        <div className="rounded-2xl p-6 md:p-8 flex flex-col items-center text-center" style={cardStyle}>
          {/* Photo with Wii-style frame */}
          <div className="relative mb-4">
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden"
              style={{
                border: '4px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <img src={PROFILE_PHOTO} alt="JDLO" className="w-full h-full object-cover" />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #86efac, #4ade80)',
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          <h2 className="text-gray-700 text-2xl md:text-3xl font-black">@jdlo</h2>
          <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">Systems Operator</p>

          <div className="flex items-center gap-1.5 mt-3 text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Napa Valley | Bay Area</span>
          </div>
        </div>

        {/* ═══════ ABOUT ═══════ */}
        <div className="rounded-2xl p-5 md:p-6" style={cardStyle}>
          <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-3">About</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-3">
            &ldquo;I build systems that turn attention into action. My role is to design the structure, then let the system do the work.&rdquo;
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            I don&apos;t sell pages — I design flows. UI/UX design, creative coding, and conversion architecture.
          </p>
        </div>

        {/* ═══════ SKILLS ═══════ */}
        <div className="rounded-2xl p-5 md:p-6" style={cardStyle}>
          <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-4">Skills</h3>
          <div className="space-y-3.5">
            {skills.map(s => (
              <div key={s.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gray-600 font-bold text-xs">{s.name}</span>
                  <span className="text-gray-400 text-[10px] font-bold">{s.level}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <div
                    className="h-full rounded-full animate-fill"
                    style={{
                      width: `${s.level}%`,
                      background: 'linear-gradient(90deg, #9ab4c6, #7a9ab0)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ INTERESTS ═══════ */}
        <div className="rounded-2xl p-5 md:p-6" style={cardStyle}>
          <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-4">Interests</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {interests.map(it => (
              <div
                key={it.name}
                className="rounded-xl p-3 flex flex-col items-center text-center transition-transform hover:scale-105"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)',
                  border: '1.5px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <span className="text-2xl mb-1">{it.icon}</span>
                <span className="text-gray-600 font-bold text-[10px]">{it.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ CONTACT ═══════ */}
        <div className="rounded-2xl p-5 md:p-6" style={cardStyle}>
          <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-4">Connect</h3>
          <div className="space-y-2.5">
            {contacts.map(link => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)',
                    border: '1.5px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 font-bold text-xs">{link.label}</p>
                    <p className="text-gray-400 text-[10px] truncate">{link.sub}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </a>
              );
            })}

            {/* Portfolio */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)',
                border: '1.5px solid rgba(255,255,255,0.7)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Palette className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-gray-600 font-bold text-xs">Portfolio</p>
                <p className="text-gray-400 text-[10px]">You&apos;re looking at it</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
