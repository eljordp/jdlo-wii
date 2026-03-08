'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, MapPin, Mail, Linkedin, Instagram, ExternalLink,
  Globe, Cpu, Palette, TrendingUp, Zap, Code, Layers,
} from 'lucide-react';
import { PROFILE_PHOTO, type WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

/* ── Data ── */

const services = [
  { icon: Globe,       title: 'Web Systems',       desc: 'Full conversion architecture. Not pages — flows that close.' },
  { icon: Cpu,         title: 'AI Integration',     desc: 'Automation, agents, and workflows that actually run.' },
  { icon: Palette,     title: 'Brand Systems',      desc: 'Identity, positioning, and the strategy behind it.' },
  { icon: TrendingUp,  title: 'Sales Ops',          desc: 'CRM, pipeline, and team systems built to scale.' },
];

const stack = [
  'Next.js', 'React', 'TypeScript', 'Tailwind', 'Vercel',
  'Supabase', 'Stripe', 'Claude AI', 'Framer Motion', 'Node.js',
];

const contacts = [
  { href: 'mailto:eljordp@gmail.com', icon: Mail,      label: 'Email',     sub: 'eljordp@gmail.com' },
  { href: 'https://www.linkedin.com/in/jordan-lopez-764974388/', icon: Linkedin, label: 'LinkedIn',  sub: 'jordan-lopez' },
  { href: 'https://www.instagram.com/jdlo/', icon: Instagram, label: 'Instagram', sub: '@jdlo' },
];

/* ── Shared styles ── */

const card = {
  background: 'linear-gradient(180deg, #dbe7ef 0%, #cddae4 50%, #c4d4e0 100%)',
  border: '2.5px solid rgba(255,255,255,0.85)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
};

const glassInner = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 100%)',
  border: '1.5px solid rgba(255,255,255,0.7)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } };

/* ── Stat counter (animates on mount) ── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center p-3 rounded-xl"
      style={glassInner}
    >
      <span className="text-gray-700 text-2xl md:text-3xl font-black">{value}</span>
      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">{label}</span>
    </motion.div>
  );
}

/* ── Section heading ── */
function Heading({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider">{children}</h3>
    </div>
  );
}

/* ── Component ── */

export default function MiiChannel({ onBack }: Props) {
  const [activeService, setActiveService] = useState<number | null>(null);

  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>

      {/* Back */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </motion.button>
      </div>

      <motion.div
        className="px-4 md:px-8 pb-12 max-w-2xl mx-auto space-y-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >

        {/* ═══════ HERO ═══════ */}
        <motion.div variants={fadeUp} className="rounded-2xl p-6 md:p-8 text-center relative overflow-hidden" style={card}>
          {/* Subtle accent glow */}
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #7aa8c4, transparent)' }}
          />

          {/* Photo */}
          <div className="relative inline-block mb-5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mx-auto"
              style={{
                border: '4px solid rgba(255,255,255,0.9)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <img src={PROFILE_PHOTO} alt="JDLO" className="w-full h-full object-cover" />
            </motion.div>
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #86efac, #4ade80)',
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          <h2 className="text-gray-700 text-3xl md:text-4xl font-black tracking-tight">@jdlo</h2>
          <p className="text-gray-400 text-xs font-bold mt-1.5 uppercase tracking-[0.25em]">Systems Operator</p>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Bay Area, CA</span>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-gray-500 text-sm md:text-base font-semibold mt-5 max-w-md mx-auto leading-relaxed"
          >
            &ldquo;I build the machine, then let it run.&rdquo;
          </motion.p>
        </motion.div>

        {/* ═══════ STATS ═══════ */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5">
          <Stat value="20+" label="Projects" />
          <Stat value="5" label="Industries" />
          <Stat value="100%" label="Ship Rate" />
        </motion.div>

        {/* ═══════ WHAT I DO ═══════ */}
        <motion.div variants={fadeUp} className="rounded-2xl p-5 md:p-6" style={card}>
          <Heading icon={Zap}>What I Do</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {services.map((s, i) => {
              const Icon = s.icon;
              const isActive = activeService === i;
              return (
                <motion.button
                  key={s.title}
                  onClick={() => setActiveService(isActive ? null : i)}
                  className="text-left rounded-xl p-4 transition-all"
                  style={glassInner}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Icon className="w-4.5 h-4.5 text-gray-500 shrink-0" />
                    <span className="text-gray-600 font-bold text-xs">{s.title}</span>
                  </div>
                  <motion.p
                    initial={false}
                    animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-gray-400 text-[11px] leading-relaxed overflow-hidden"
                  >
                    {s.desc}
                  </motion.p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════ TOOLBOX ═══════ */}
        <motion.div variants={fadeUp} className="rounded-2xl p-5 md:p-6" style={card}>
          <Heading icon={Code}>Toolbox</Heading>
          <div className="flex flex-wrap gap-2">
            {stack.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.04, duration: 0.3 }}
                whileHover={{ scale: 1.08 }}
                className="px-3 py-1.5 rounded-lg text-gray-600 font-bold text-[10px] uppercase tracking-wider"
                style={glassInner}
              >
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* ═══════ CONNECT ═══════ */}
        <motion.div variants={fadeUp} className="rounded-2xl p-5 md:p-6" style={card}>
          <Heading icon={Layers}>Connect</Heading>
          <div className="space-y-2.5">
            {contacts.map(link => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={glassInner}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 font-bold text-xs">{link.label}</p>
                    <p className="text-gray-400 text-[10px] truncate">{link.sub}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
