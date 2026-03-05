'use client';

import { useState } from 'react';
import { ChevronLeft, Server, Database, Code, Cloud, Lock, Zap, Lightbulb } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const sections = [
  {
    id: 'how-i-build', name: 'How I Build', icon: Server,
    cards: [
      { title: 'Everything Connects', text: 'I build your tools so they talk to each other. Your website, your CRM, your emails, your payments — all one system, not ten separate things you have to manage.' },
      { title: 'Built to Grow With You', text: 'Start small, scale up. Nothing I build will break when your business takes off. You won\'t need to rebuild from scratch when you double in size.' },
      { title: 'It Works While You Sleep', text: 'New lead comes in? They get a response. Appointment booked? Your calendar updates. Invoice due? It sends itself. I set up the automations so you\'re not glued to your phone.' },
    ],
    callout: 'You shouldn\'t have to be the one holding everything together. I build the machine so you can step back and actually run your business.',
  },
  {
    id: 'your-data', name: 'Your Data', icon: Database,
    cards: [
      { title: 'One Source of Truth', text: 'No more checking three different apps to figure out what\'s going on. Everything lives in one place — your leads, your sales, your numbers. Clean and simple.' },
      { title: 'No More Manual Entry', text: 'Stop copying and pasting between spreadsheets. Your data moves between tools automatically. Less busy work, fewer mistakes, more time for what matters.' },
      { title: 'See What\'s Working', text: 'You\'ll know exactly where your money is coming from, which marketing is actually working, and where people are dropping off. Real numbers, not guessing.' },
    ],
    callout: 'If you\'re making decisions based on gut feelings instead of real numbers, you\'re leaving money on the table. I fix that.',
  },
  {
    id: 'speed', name: 'Speed to Launch', icon: Code,
    cards: [
      { title: 'Live in Weeks, Not Months', text: 'I don\'t do 6-month projects that never see the light of day. We get something real in front of people fast, see what works, and improve from there.' },
      { title: 'Nothing Gets Lost', text: 'Every change I make is tracked and can be undone. You\'ll never hear "oops, I broke it and can\'t fix it." Your project stays clean and organized.' },
      { title: 'Updates Go Live Instantly', text: 'When we make a change, it goes live in minutes — not days. No waiting around, no back-and-forth with hosting companies.' },
    ],
    callout: 'Done is better than perfect. I get you live fast so you can start making money, then we fine-tune from there.',
  },
  {
    id: 'always-on', name: 'Always Online', icon: Cloud,
    cards: [
      { title: 'Fast Everywhere', text: 'Your site loads quick whether someone\'s in LA, New York, or Tokyo. Nobody\'s waiting around for your page to show up.' },
      { title: 'No Downtime', text: 'Updates happen without your site going offline. Your customers never see a "we\'ll be right back" page. Ever.' },
      { title: 'Handles the Rush', text: 'Run a big promo? Go viral? Your site handles it. No crashing when traffic spikes — you\'ll never miss a sale because your site went down.' },
    ],
    callout: 'Every minute your site is down or slow, you\'re losing real money. I make sure that doesn\'t happen.',
  },
  {
    id: 'safe', name: 'Keeping It Safe', icon: Lock,
    cards: [
      { title: 'Your Customers\' Info Is Protected', text: 'All the personal info, payments, and data on your site is locked down tight. Your customers can trust you with their information.' },
      { title: 'The Right People See the Right Things', text: 'Your team sees what they need, and nothing they don\'t. No accidental access to sensitive stuff. Everything is set up with proper permissions.' },
      { title: 'Problems Caught Early', text: 'I set up automatic checks that catch security issues before they become real problems. Prevention, not damage control.' },
    ],
    callout: 'One data breach can kill a small business\'s reputation. I build security in from day one so you don\'t have to worry about it.',
  },
  {
    id: 'fast', name: 'Making It Fast', icon: Zap,
    cards: [
      { title: 'Google Loves Fast Sites', text: 'Your site scores high on Google\'s speed test. That means better search rankings, more people finding you, and more of them actually sticking around.' },
      { title: 'Everything Loads Quick', text: 'Images, videos, pages — all optimized so nothing takes forever to load. People are impatient. If your site is slow, they bounce.' },
      { title: 'Repeat Visitors Get Instant Loads', text: 'Once someone visits your site, the next time they come back it loads almost instantly. That\'s the kind of experience that keeps people coming back.' },
    ],
    callout: 'Every extra second your site takes to load, you lose about 7% of potential customers. I make your site fly.',
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
        <h1 className="text-gray-700 font-bold text-xl">🌐 How I Work</h1>
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
