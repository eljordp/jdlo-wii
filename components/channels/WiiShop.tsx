'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const services = [
  { id: 1, name: 'Landing Page', category: 'Web', price: 297, desc: 'High-converting single page' },
  { id: 2, name: 'Full Website', category: 'Web', price: 797, desc: 'Multi-page custom site' },
  { id: 3, name: 'E-Commerce Store', category: 'Web', price: 1197, desc: 'Online store with payments' },
  { id: 4, name: 'Email Automation', category: 'Automation', price: 197, desc: 'Drip sequences + flows' },
  { id: 5, name: 'AI Receptionist', category: 'Automation', price: 297, desc: '24/7 AI call handler' },
  { id: 6, name: 'CRM Setup', category: 'Automation', price: 247, desc: 'Pipeline + lead tracking' },
  { id: 7, name: 'Brand Strategy', category: 'Branding', price: 397, desc: 'Positioning + messaging' },
  { id: 8, name: 'Logo & Identity', category: 'Branding', price: 197, desc: 'Logo, colors, fonts' },
  { id: 9, name: 'Social Media Kit', category: 'Branding', price: 147, desc: 'Templates + graphics' },
  { id: 10, name: 'Cold Outreach', category: 'Sales', price: 497, desc: 'DM sequences that book calls' },
  { id: 11, name: 'Sales Script', category: 'Sales', price: 197, desc: 'Proven closing framework' },
  { id: 12, name: 'Lead Qualifier', category: 'Sales', price: 247, desc: 'Intake + vetting system' },
];

const categories = ['All', 'Web', 'Automation', 'Branding', 'Sales'];

export default function WiiShop({ onBack }: Props) {
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = services.filter(s => category === 'All' || s.category === category);
  const detail = services.find(s => s.id === selected);

  return (
    <div className="h-full w-full flex flex-col" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>

      <div className="px-5 pb-3">
        <h1 className="text-gray-700 font-bold text-xl">Wii Shop Channel</h1>
      </div>

      {/* Category tabs */}
      <div className="px-5 pb-3 flex gap-1.5">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => { setCategory(c); setSelected(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              category === c
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 mx-4 mb-4 bg-white/70 rounded-2xl overflow-hidden shadow-sm border border-white/80 flex">

        {/* Service list */}
        <div className={`${detail ? 'hidden md:block md:w-1/2' : 'w-full'} overflow-auto`}>
          {filtered.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                selected === s.id ? 'bg-blue-50' : i % 2 === 0 ? 'bg-transparent' : 'bg-gray-50/50'
              } hover:bg-blue-50/60`}
              style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div>
                <p className="text-gray-700 font-bold text-sm">{s.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
              </div>
              <span className="text-gray-600 font-bold text-sm ml-4 whitespace-nowrap">${s.price}</span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {detail && (
          <div className={`${detail ? 'w-full md:w-1/2' : ''} border-l border-gray-100 flex flex-col`}>
            {/* Mobile back */}
            <button
              onClick={() => setSelected(null)}
              className="md:hidden flex items-center gap-1 px-4 pt-3 text-gray-400 text-xs font-bold"
            >
              <ChevronLeft className="w-3 h-3" /> All Services
            </button>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <span className="text-2xl">
                  {detail.category === 'Web' ? '🌐' : detail.category === 'Automation' ? '🤖' : detail.category === 'Branding' ? '🎨' : '📈'}
                </span>
              </div>
              <h2 className="text-gray-800 font-bold text-lg mb-1">{detail.name}</h2>
              <p className="text-gray-400 text-sm mb-1">{detail.category}</p>
              <p className="text-gray-500 text-sm mb-6">{detail.desc}</p>
              <div className="text-gray-700 font-bold text-2xl mb-6">${detail.price}</div>
              <a
                href="mailto:jordan@jdlo.online"
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Inquire
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
