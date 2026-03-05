'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronDown, Globe, Palette, Lightbulb, Rocket, Bot, Construction, Plug, LayoutGrid, Search, ShoppingCart, Filter, ArrowUpDown, Star, X } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Service {
  id: number;
  name: string;
  emoji: string;
  category: string;
  price: number;
  desc: string;
  detail: string;
  color: string;
  colorDark: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
}

const services: Service[] = [
  {
    id: 1, name: 'Your Online Home', emoji: '🌐', category: 'Web', price: 600,
    desc: 'Pick the perfect fit for your business.',
    detail: 'A custom-built website tailored to your brand. Includes responsive design, SEO setup, contact forms, and hosting guidance. Perfect for businesses ready to establish their online presence.',
    color: '#3b82f6', colorDark: '#2563eb', icon: Globe, popular: true,
  },
  {
    id: 2, name: 'Make It Pretty', emoji: '🎨', category: 'Branding', price: 500,
    desc: 'Turn your ideas into gorgeous visuals.',
    detail: 'Full branding package — logo design, color palette, typography system, and brand guidelines. Delivered as a complete brand kit ready for print and digital.',
    color: '#a855f7', colorDark: '#9333ea', icon: Palette, popular: true,
  },
  {
    id: 3, name: 'Consultation + Advisory', emoji: '💡', category: 'Sales', price: 2000,
    desc: 'Get unstuck with expert guidance.',
    detail: 'One-on-one strategy sessions covering business operations, digital presence, sales systems, and growth planning. Includes action plan and follow-up support.',
    color: '#b8860b', colorDark: '#996f0a', icon: Lightbulb, popular: true,
  },
  {
    id: 4, name: 'Launch Your App', emoji: '🚀', category: 'Web', price: 8000,
    desc: 'From idea to live app in weeks.',
    detail: 'Full-stack application development — UI/UX design, frontend, backend, database, deployment, and launch support. Built with modern frameworks for speed and scale.',
    color: '#ef4444', colorDark: '#dc2626', icon: Rocket, popular: true,
  },
  {
    id: 5, name: 'AI Receptionist', emoji: '🤖', category: 'AI', price: 2500,
    desc: 'Never miss a call. AI answers, qualifies, and books.',
    detail: 'An AI-powered phone and chat receptionist that handles inquiries 24/7. Qualifies leads, books appointments, and integrates with your CRM.',
    color: '#0ea5e9', colorDark: '#0284c7', icon: Bot, popular: true,
  },
  {
    id: 6, name: 'System Architecture', emoji: '🏗️', category: 'Automation', price: 7500,
    desc: 'The blueprint for your app to work perfectly.',
    detail: 'Complete system design — database schemas, API architecture, infrastructure planning, CI/CD pipelines, and technical documentation. Built for scale from day one.',
    color: '#f97316', colorDark: '#ea580c', icon: Construction, popular: false,
  },
  {
    id: 7, name: 'Brand Identity', emoji: '🔌', category: 'Branding', price: 1200,
    desc: 'Plug into a complete brand system.',
    detail: 'Deep-dive brand strategy — positioning, messaging framework, visual identity system, social templates, and brand voice guide. Everything you need to look professional.',
    color: '#22c55e', colorDark: '#16a34a', icon: Plug, popular: false,
  },
  {
    id: 8, name: 'Content System', emoji: '📱', category: 'Automation', price: 1500,
    desc: 'Automate your content pipeline.',
    detail: 'End-to-end content system — scheduling, templates, repurposing workflows, and analytics dashboard. Post consistently without burning out.',
    color: '#ec4899', colorDark: '#db2777', icon: LayoutGrid, popular: false,
  },
  {
    id: 9, name: 'SEO Audit', emoji: '🔍', category: 'Web', price: 800,
    desc: 'Find out why they can\'t find you.',
    detail: 'Comprehensive SEO analysis — technical audit, keyword research, competitor analysis, content gaps, and a prioritized action plan to improve your search rankings.',
    color: '#14b8a6', colorDark: '#0d9488', icon: Search, popular: false,
  },
];

const categories = ['All Categories', 'Web', 'Branding', 'Sales', 'AI', 'Automation'];
const sortOptions = ['Most Popular', 'Price: Low to High', 'Price: High to Low'];

export default function WiiShop({ onBack }: Props) {
  const [tab, setTab] = useState<'services' | 'packages'>('services');
  const [category, setCategory] = useState('All Categories');
  const [sort, setSort] = useState('Most Popular');
  const [selected, setSelected] = useState<Service | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = services
    .filter(s => category === 'All Categories' || s.category === category)
    .sort((a, b) => {
      if (sort === 'Price: Low to High') return a.price - b.price;
      if (sort === 'Price: High to Low') return b.price - a.price;
      return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    });

  const formatPrice = (p: number) => p >= 1000 ? `$${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k` : `$${p}`;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #b8d8e8 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('services')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === 'services'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setTab('packages')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === 'packages'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            Packages
          </button>
          <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center ml-1">
            <ShoppingCart className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 md:px-6 pb-2">
        <h1 className="text-gray-800 font-black text-2xl flex items-center gap-2">
          <span className="text-2xl">🛒</span> Wii Shop Channel
        </h1>
      </div>

      {tab === 'packages' ? (
        /* Packages tab */
        <div className="flex-1 overflow-auto px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
            {/* Starter */}
            <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/40" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
              <div className="p-6 text-center text-white">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Starter</p>
                <h3 className="text-3xl font-black mb-1">$1,500</h3>
                <p className="text-white/50 text-xs mb-5">One-time</p>
                <ul className="text-left text-sm space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Custom Website</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Brand Identity Kit</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> SEO Setup</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> 1 Revision Round</li>
                  <li className="flex items-start gap-2 text-white/40"><span className="text-white/30">✗</span> AI Receptionist</li>
                  <li className="flex items-start gap-2 text-white/40"><span className="text-white/30">✗</span> App Development</li>
                </ul>
                <a href="mailto:jordan@jdlo.online" className="block w-full py-3 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 transition-colors text-center">
                  Get Started
                </a>
              </div>
            </div>

            {/* Growth — Featured */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-400 relative" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}>
              <div className="absolute -top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black py-1.5 text-center uppercase tracking-widest flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-yellow-900" /> Most Popular
              </div>
              <div className="p-6 pt-10 text-center text-white">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Growth</p>
                <h3 className="text-3xl font-black mb-1">$5,000</h3>
                <p className="text-white/50 text-xs mb-5">One-time</p>
                <ul className="text-left text-sm space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Everything in Starter</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> AI Receptionist Setup</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Content System</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Sales Funnel</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> 3 Revision Rounds</li>
                  <li className="flex items-start gap-2 text-white/40"><span className="text-white/30">✗</span> Full App Build</li>
                </ul>
                <a href="mailto:jordan@jdlo.online" className="block w-full py-3 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 transition-colors text-center">
                  Get Started
                </a>
              </div>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/40" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
              <div className="p-6 text-center text-white">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Enterprise</p>
                <h3 className="text-3xl font-black mb-1">$15,000+</h3>
                <p className="text-white/50 text-xs mb-5">Custom scope</p>
                <ul className="text-left text-sm space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Everything in Growth</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Full App Development</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> System Architecture</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Ongoing Advisory</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Priority Support</li>
                  <li className="flex items-start gap-2"><span className="text-green-300 font-bold">✓</span> Unlimited Revisions</li>
                </ul>
                <a href="mailto:jordan@jdlo.online" className="block w-full py-3 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 transition-colors text-center">
                  Let&apos;s Talk
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : tab === 'services' ? (
        <>
          {/* Filters */}
          <div className="px-4 md:px-6 pb-3 flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />

            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCatOpen(!catOpen); setSortOpen(false); }}
                className="flex items-center gap-2 bg-white/90 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm min-w-[160px] justify-between"
              >
                {category} <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {catOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                  {categories.map(c => (
                    <button key={c} onClick={() => { setCategory(c); setCatOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${category === c ? 'font-bold text-blue-600' : 'text-gray-600'}`}
                    >{c}</button>
                  ))}
                </div>
              )}
            </div>

            <ArrowUpDown className="w-4 h-4 text-gray-500" />

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => { setSortOpen(!sortOpen); setCatOpen(false); }}
                className="flex items-center gap-2 bg-white/90 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm min-w-[160px] justify-between"
              >
                {sort} <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {sortOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                  {sortOptions.map(s => (
                    <button key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${sort === s ? 'font-bold text-blue-600' : 'text-gray-600'}`}
                    >{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-auto px-4 md:px-6 pb-6" onClick={() => { setCatOpen(false); setSortOpen(false); }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filtered.map(service => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelected(service)}
                    className="relative rounded-2xl p-5 md:p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] flex flex-col items-center text-center min-h-[220px]"
                    style={{
                      background: `linear-gradient(135deg, ${service.color} 0%, ${service.colorDark} 100%)`,
                      border: '3px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {/* Popular badge */}
                    {service.popular && (
                      <div className="absolute -top-2.5 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-yellow-900" /> Popular
                      </div>
                    )}

                    {/* Vector Icon */}
                    <div className="mb-3 mt-2">
                      <Icon className="w-12 h-12 md:w-14 md:h-14 text-white/80 drop-shadow-md" />
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-base md:text-lg mb-1.5 drop-shadow-sm">
                      {service.emoji} {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/80 text-xs md:text-sm mb-4 leading-relaxed">
                      {service.desc}
                    </p>

                    {/* Price button */}
                    <div className="mt-auto w-full">
                      <div
                        className="w-full py-2.5 rounded-lg text-center font-black text-white text-base md:text-lg"
                        style={{ background: 'rgba(0,0,0,0.15)' }}
                      >
                        ${service.price.toLocaleString()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${selected.color} 0%, ${selected.colorDark} 100%)` }}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-8 text-center text-white">
              {/* Icon */}
              <div className="mb-4">
                <selected.icon className="w-16 h-16 mx-auto text-white/80 drop-shadow-lg" />
              </div>

              <h2 className="text-2xl font-black mb-1 drop-shadow-sm">
                {selected.emoji} {selected.name}
              </h2>
              <p className="text-white/60 text-sm font-semibold mb-4">{selected.category}</p>
              <p className="text-white/90 text-sm leading-relaxed mb-6">{selected.detail}</p>

              <div className="text-3xl font-black mb-6" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                ${selected.price.toLocaleString()}
              </div>

              <a
                href="mailto:jordan@jdlo.online"
                className="inline-block w-full py-3 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
              >
                Inquire Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
