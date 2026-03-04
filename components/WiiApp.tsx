'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Send, ChevronRight } from 'lucide-react';
import { getTheme, channelTiles, PROFILE_PHOTO } from '@/lib/themes';
import MiiChannel from './channels/MiiChannel';
import PhotoChannel from './channels/PhotoChannel';
import WiiShop from './channels/WiiShop';
import ForecastChannel from './channels/ForecastChannel';
import NewsChannel from './channels/NewsChannel';
import InternetChannel from './channels/InternetChannel';
import SettingsChannel from './channels/SettingsChannel';
import WiiSports from './channels/WiiSports';

export default function WiiApp() {
  const [screen, setScreen] = useState<'startup' | 'desktop'>('startup');
  const [openChannel, setOpenChannel] = useState<number | null>(null);
  const [themeId, setThemeId] = useState('light');
  const [contactOpen, setContactOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [time, setTime] = useState(new Date());
  const [contactSent, setContactSent] = useState(false);

  const theme = getTheme(themeId);
  const isPokemon = themeId === 'pokemon';

  useEffect(() => {
    const saved = localStorage.getItem('wiiTheme');
    if (saved) setThemeId(saved);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard dismiss for startup
  useEffect(() => {
    if (screen !== 'startup') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') setScreen('desktop');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen]);

  const changeTheme = useCallback((id: string) => {
    setThemeId(id);
    localStorage.setItem('wiiTheme', id);
  }, []);

  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => { setContactSent(false); setContactOpen(false); }, 2000);
  };

  const renderChannel = () => {
    const props = { onBack: () => setOpenChannel(null), theme };
    switch (openChannel) {
      case 1: return <WiiSports {...props} />;
      case 2: return <MiiChannel {...props} />;
      case 3: return <PhotoChannel {...props} />;
      case 4: return <WiiShop {...props} />;
      case 5: return <ForecastChannel {...props} />;
      case 6: return <NewsChannel {...props} />;
      case 7: return <InternetChannel {...props} />;
      case 8: return <SettingsChannel {...props} currentTheme={themeId} onChangeTheme={changeTheme} musicEnabled={musicEnabled} onToggleMusic={() => setMusicEnabled(!musicEnabled)} />;
      default: return null;
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none"
      style={{ fontFamily: isPokemon ? "'Press Start 2P', monospace" : "Arial, 'Helvetica Neue', sans-serif" }}
    >
      {isPokemon && <div className="scanline-overlay" />}

      {/* ═══════ STARTUP SCREEN ═══════ */}
      <AnimatePresence>
        {screen === 'startup' && (
          <motion.div
            key="startup"
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center cursor-pointer"
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            onClick={() => setScreen('desktop')}
          >
            {/* Warning icon with hue-rotate */}
            <div className="mb-8" style={{ animation: 'hue-shift 4s linear infinite' }}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(251,191,36,0.4)]"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                <span className="text-black text-5xl md:text-7xl font-black select-none">!</span>
              </div>
            </div>

            <h1 className="text-white text-xl md:text-3xl font-bold tracking-[0.3em] mb-8 uppercase">
              <span style={{ animation: 'pulse-opacity 2s ease-in-out infinite' }}>⚠</span>
              <span className="mx-3">WARNING</span>
              <span style={{ animation: 'pulse-opacity 2s ease-in-out infinite 0.5s' }}>⚠</span>
            </h1>

            <p className="text-gray-300 text-xs md:text-sm max-w-md mb-6 leading-relaxed tracking-wide">
              BEFORE PLAYING, READ YOUR OPERATIONS MANUAL FOR
              IMPORTANT INFORMATION ABOUT YOUR HEALTH AND SAFETY.
            </p>
            <p className="text-gray-500 text-xs mb-1">Also available at</p>
            <a
              href="https://jdlo.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6ec6ff] hover:text-[#9dd8ff] text-sm underline underline-offset-2 mb-16"
              onClick={e => e.stopPropagation()}
            >
              jdlo.online
            </a>

            {/* Press Ⓐ */}
            <div className="flex items-center gap-3" style={{ animation: 'pulse-opacity 1.5s ease-in-out infinite' }}>
              <span className="text-white/70 text-sm tracking-wide">Press</span>
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <span className="text-black font-black text-base">A</span>
              </div>
              <span className="text-white/70 text-sm tracking-wide">to continue.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ MAIN DESKTOP ═══════ */}
      <div className="h-full w-full flex flex-col" style={{ background: theme.bg }}>

        {/* Channel Grid */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 pb-20 md:pb-28 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-[640px]">
            {channelTiles.map((tile, i) => (
              <motion.button
                key={tile.id}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="channel-tile flex flex-col items-center justify-center gap-2 md:gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                style={{
                  background: tile.gradient,
                  animation: `wii-float 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.25}s`,
                }}
                onClick={() => setOpenChannel(tile.id)}
              >
                {tile.icon === 'profile' ? (
                  <img
                    src={PROFILE_PHOTO}
                    alt="Profile"
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-[3px] border-white/60 relative z-[3] shadow-lg"
                  />
                ) : (
                  <span className="text-3xl md:text-5xl relative z-[3] drop-shadow-lg">{tile.icon}</span>
                )}
                <span
                  className="text-white text-[9px] md:text-[11px] font-bold tracking-wider relative z-[3] drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] uppercase"
                  style={isPokemon ? { fontSize: '7px', letterSpacing: '0.05em' } : undefined}
                >
                  {tile.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ═══════ BOTTOM BAR ═══════ */}
        <div
          className="fixed bottom-0 left-0 right-0 h-[72px] md:h-[96px] rounded-t-[28px] flex items-center justify-between px-5 md:px-10 z-40 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
          style={{
            background: theme.barBg,
            borderTop: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Wii Button */}
          <div className="w-11 h-11 md:w-[56px] md:h-[56px] rounded-full flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.1)]"
            style={{ background: 'linear-gradient(180deg, #f0f0f0 0%, #d8d8d8 100%)', border: '2px solid #c0c0c0' }}>
            <span className="font-black text-[11px] md:text-[13px] text-gray-500 tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              Wii
            </span>
          </div>

          {/* Clock */}
          <div className="text-center">
            <div
              className="text-2xl md:text-4xl font-bold tracking-tight leading-none"
              style={{ color: theme.textColor, fontFamily: isPokemon ? "'Press Start 2P'" : "'Arial', sans-serif" }}
            >
              {fmt(time)}
            </div>
            <div className="text-[10px] md:text-xs mt-0.5 opacity-60 tracking-wide" style={{ color: theme.textColor }}>
              {fmtDate(time)}
            </div>
          </div>

          {/* Mail Button */}
          <button
            onClick={() => setContactOpen(true)}
            className="w-11 h-11 md:w-[56px] md:h-[56px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-[0_2px_12px_rgba(59,130,246,0.3)]"
            style={{
              background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
              border: '2px solid rgba(255,255,255,0.35)',
            }}
          >
            <span className="text-lg md:text-xl">📧</span>
          </button>
        </div>

        {/* Right chevron (desktop) */}
        <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30">
          <div className="w-7 h-20 rounded-l-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>

      {/* ═══════ CHANNEL WINDOW ═══════ */}
      <AnimatePresence>
        {openChannel !== null && (
          <motion.div
            key="channel"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderChannel()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ CONTACT MODAL ═══════ */}
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            key="contact"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setContactOpen(false)} />
            <motion.div
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Contact Me</h2>
                  </div>
                  <button onClick={() => setContactOpen(false)} className="hover:bg-white/20 rounded-full p-1.5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {contactSent ? (
                <div className="p-10 text-center">
                  <div className="text-5xl mb-3">✓</div>
                  <p className="text-gray-800 font-bold text-lg">Message Sent!</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="p-5 space-y-3.5">
                  <input type="text" placeholder="Name" required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 text-sm bg-gray-50" />
                  <input type="email" placeholder="Email" required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 text-sm bg-gray-50" />
                  <textarea placeholder="Message" required rows={4} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 text-sm resize-none bg-gray-50" />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
