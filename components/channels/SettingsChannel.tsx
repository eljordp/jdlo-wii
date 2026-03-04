'use client';

import { ChevronLeft, Volume2, VolumeX, Globe, Sparkles } from 'lucide-react';
import { themes, type WiiTheme } from '@/lib/themes';

interface Props {
  onBack: () => void;
  theme: WiiTheme;
  currentTheme: string;
  onChangeTheme: (id: string) => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
}

export default function SettingsChannel({ onBack, currentTheme, onChangeTheme, musicEnabled, onToggleMusic }: Props) {
  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #e0f0ff 50%, #f0f8ff 100%)' }}>
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(135,206,235,0.85)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/30 hover:bg-white/40 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg drop-shadow">⚙️ Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Themes */}
        <div>
          <h2 className="text-gray-700 font-bold text-lg mb-4">🎨 Themes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => onChangeTheme(t.id)}
                className={`rounded-2xl p-4 text-left transition-all hover:scale-[1.03] ${
                  currentTheme === t.id
                    ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-transparent shadow-xl scale-[1.03]'
                    : 'shadow-md hover:shadow-lg'
                }`}
                style={{ background: 'rgba(255,255,255,0.85)' }}
              >
                {/* Preview Swatch */}
                <div className="w-full h-16 rounded-xl mb-3 shadow-inner overflow-hidden" style={{ background: t.bg }} />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-gray-800 font-bold text-sm">{t.name}</span>
                </div>
                <p className="text-gray-500 text-[11px]">{t.description}</p>
                {currentTheme === t.id && (
                  <span className="inline-block mt-2 text-[10px] font-bold bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Other Settings */}
        <div>
          <h2 className="text-gray-700 font-bold text-lg mb-4">🔧 Other Settings</h2>
          <div className="space-y-3">
            {/* Music Toggle */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                {musicEnabled ? <Volume2 className="w-5 h-5 text-blue-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                <div>
                  <p className="text-gray-800 font-bold text-sm">Background Music</p>
                  <p className="text-gray-500 text-xs">{musicEnabled ? 'Playing' : 'Off'}</p>
                </div>
              </div>
              <button
                onClick={onToggleMusic}
                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                  musicEnabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${
                  musicEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Animations (decorative) */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-gray-800 font-bold text-sm">Animations</p>
                  <p className="text-gray-500 text-xs">Always on</p>
                </div>
              </div>
              <div className="w-14 h-8 rounded-full bg-blue-500 relative">
                <div className="w-6 h-6 bg-white rounded-full shadow-md absolute top-1 left-7" />
              </div>
            </div>

            {/* Language (decorative) */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-gray-800 font-bold text-sm">Language</p>
                  <p className="text-gray-500 text-xs">English</p>
                </div>
              </div>
              <span className="text-gray-400 text-xs font-bold bg-gray-100 rounded-full px-3 py-1">EN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
