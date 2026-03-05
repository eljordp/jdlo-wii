'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronDown, Globe, Palette, Lightbulb, Rocket, Bot, Construction, Plug, LayoutGrid, Search, ShoppingCart, Filter, ArrowUpDown, Star, X } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  desc: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
}

const services: Service[] = [
  {
    id: 1, name: 'Your Online Home', category: 'Web', price: 600,
    desc: 'Pick the perfect fit for your business.',
    detail: 'A custom-built website tailored to your brand. Includes responsive design, SEO setup, contact forms, and hosting guidance. Perfect for businesses ready to establish their online presence.',
    icon: Globe, popular: true,
  },
  {
    id: 2, name: 'Make It Pretty', category: 'Branding', price: 500,
    desc: 'Turn your ideas into gorgeous visuals.',
    detail: 'Full branding package — logo design, color palette, typography system, and brand guidelines. Delivered as a complete brand kit ready for print and digital.',
    icon: Palette, popular: true,
  },
  {
    id: 3, name: 'Consultation + Advisory', category: 'Sales', price: 2000,
    desc: 'Get unstuck with expert guidance.',
    detail: 'One-on-one strategy sessions covering business operations, digital presence, sales systems, and growth planning. Includes action plan and follow-up support.',
    icon: Lightbulb, popular: true,
  },
  {
    id: 4, name: 'Launch Your App', category: 'Web', price: 8000,
    desc: 'From idea to live app in weeks.',
    detail: 'Full-stack application development — UI/UX design, frontend, backend, database, deployment, and launch support. Built with modern frameworks for speed and scale.',
    icon: Rocket, popular: true,
  },
  {
    id: 5, name: 'AI Receptionist', category: 'AI', price: 2500,
    desc: 'Never miss a call. AI answers, qualifies, and books.',
    detail: 'An AI-powered phone and chat receptionist that handles inquiries 24/7. Qualifies leads, books appointments, and integrates with your CRM.',
    icon: Bot, popular: true,
  },
  {
    id: 6, name: 'System Architecture', category: 'Automation', price: 7500,
    desc: 'The blueprint for your app to work perfectly.',
    detail: 'Complete system design — database schemas, API architecture, infrastructure planning, CI/CD pipelines, and technical documentation. Built for scale from day one.',
    icon: Construction, popular: false,
  },
  {
    id: 7, name: 'Brand Identity', category: 'Branding', price: 1200,
    desc: 'Plug into a complete brand system.',
    detail: 'Deep-dive brand strategy — positioning, messaging framework, visual identity system, social templates, and brand voice guide. Everything you need to look professional.',
    icon: Plug, popular: false,
  },
  {
    id: 8, name: 'Content System', category: 'Automation', price: 1500,
    desc: 'Automate your content pipeline.',
    detail: 'End-to-end content system — scheduling, templates, repurposing workflows, and analytics dashboard. Post consistently without burning out.',
    icon: LayoutGrid, popular: false,
  },
  {
    id: 9, name: 'SEO Audit', category: 'Web', price: 800,
    desc: 'Find out why they can\'t find you.',
    detail: 'Comprehensive SEO analysis — technical audit, keyword research, competitor analysis, content gaps, and a prioritized action plan to improve your search rankings.',
    icon: Search, popular: false,
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

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('services')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === 'services'
                ? 'bg-white text-gray-700 shadow-md'
                : 'bg-white/40 text-gray-500 hover:bg-white/60'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setTab('packages')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === 'packages'
                ? 'bg-white text-gray-700 shadow-md'
                : 'bg-white/40 text-gray-500 hover:bg-white/60'
            }`}
          >
            Packages
          </button>
          <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center ml-1">
            <ShoppingCart className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 md:px-6 pb-2">
        <h1 className="text-gray-700 font-bold text-xl">🛒 Wii Shop Channel</h1>
      </div>

      {tab === 'packages' ? (
        /* Packages tab */
        <div className="flex-1 overflow-auto px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* Starter */}
            <div className="rounded-2xl overflow-hidden" style={{
              background: 'linear-gradient(180deg, #dbe7ef 0%, #c4d4e0 100%)',
              border: '2.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}>
              <div className="p-6 text-center">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Starter</p>
                <h3 className="text-gray-700 text-3xl font-black mb-1">$1,500</h3>
                <p className="text-gray-400 text-xs mb-5">One-time</p>
                <ul className="text-left text-sm text-gray-600 space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Custom Website</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Brand Identity Kit</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> SEO Setup</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> 1 Revision Round</li>
                  <li className="flex items-start gap-2 text-gray-300"><span>✗</span> AI Receptionist</li>
                  <li className="flex items-start gap-2 text-gray-300"><span>✗</span> App Development</li>
                </ul>
                <a href="mailto:jordan@jdlo.online" className="block w-full py-3 rounded-xl font-bold text-sm bg-white/60 hover:bg-white/80 text-gray-600 transition-colors text-center shadow-sm">
                  Get Started
                </a>
              </div>
            </div>

            {/* Growth — Featured */}
            <div className="rounded-2xl overflow-hidden relative" style={{
              background: 'linear-gradient(180deg, #d0dde8 0%, #b8ccd9 100%)',
              border: '2.5px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}>
              <div className="absolute top-0 left-0 right-0 bg-gray-500 text-white text-[10px] font-black py-1.5 text-center uppercase tracking-widest flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-white" /> Most Popular
              </div>
              <div className="p-6 pt-10 text-center">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Growth</p>
                <h3 className="text-gray-700 text-3xl font-black mb-1">$5,000</h3>
                <p className="text-gray-400 text-xs mb-5">One-time</p>
                <ul className="text-left text-sm text-gray-600 space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Everything in Starter</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> AI Receptionist Setup</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Content System</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Sales Funnel</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> 3 Revision Rounds</li>
                  <li className="flex items-start gap-2 text-gray-300"><span>✗</span> Full App Build</li>
                </ul>
                <a href="mailto:jordan@jdlo.online" className="block w-full py-3 rounded-xl font-bold text-sm bg-white/60 hover:bg-white/80 text-gray-600 transition-colors text-center shadow-sm">
                  Get Started
                </a>
              </div>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl overflow-hidden" style={{
              background: 'linear-gradient(180deg, #dbe7ef 0%, #c4d4e0 100%)',
              border: '2.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}>
              <div className="p-6 text-center">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Enterprise</p>
                <h3 className="text-gray-700 text-3xl font-black mb-1">$15,000+</h3>
                <p className="text-gray-400 text-xs mb-5">Custom scope</p>
                <ul className="text-left text-sm text-gray-600 space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Everything in Growth</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Full App Development</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> System Architecture</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Ongoing Advisory</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Priority Support</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 font-bold">✓</span> Unlimited Revisions</li>
                </ul>
                <a href="mailto:jordan@jdlo.online" className="block w-full py-3 rounded-xl font-bold text-sm bg-white/60 hover:bg-white/80 text-gray-600 transition-colors text-center shadow-sm">
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
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <button
                onClick={() => { setCatOpen(!catOpen); setSortOpen(false); }}
                className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm min-w-[150px] justify-between"
              >
                {category} <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {catOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg z-20 min-w-[150px] py-1">
                  {categories.map(c => (
                    <button key={c} onClick={() => { setCategory(c); setCatOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${category === c ? 'font-bold text-gray-700' : 'text-gray-500'}`}
                    >{c}</button>
                  ))}
                </div>
              )}
            </div>

            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <button
                onClick={() => { setSortOpen(!sortOpen); setCatOpen(false); }}
                className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm min-w-[150px] justify-between"
              >
                {sort} <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {sortOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg z-20 min-w-[150px] py-1">
                  {sortOptions.map(s => (
                    <button key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${sort === s ? 'font-bold text-gray-700' : 'text-gray-500'}`}
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
                    className="relative rounded-2xl p-5 md:p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center"
                    style={{
                      background: 'linear-gradient(180deg, #dbe7ef 0%, #cddae4 50%, #c4d4e0 100%)',
                      border: '2.5px solid rgba(255,255,255,0.85)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
                    }}
                  >
                    {/* Popular badge */}
                    {service.popular && (
                      <div className="absolute -top-2.5 right-4 bg-gray-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-white" /> Popular
                      </div>
                    )}

                    {/* Vector Icon */}
                    <div className="mb-3 mt-1">
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-gray-400 drop-shadow-sm" />
                    </div>

                    {/* Title */}
                    <h3 className="text-gray-700 font-bold text-sm md:text-base mb-1">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                      {service.desc}
                    </p>

                    {/* Price */}
                    <div className="mt-auto w-full">
                      <div className="w-full py-2 rounded-lg text-center font-bold text-gray-600 text-sm bg-white/50">
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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #dbe7ef 0%, #c4d4e0 100%)',
              border: '2.5px solid rgba(255,255,255,0.9)',
            }}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="p-8 text-center">
              <div className="mb-4">
                <selected.icon className="w-14 h-14 mx-auto text-gray-400" />
              </div>
              <h2 className="text-gray-700 text-xl font-black mb-1">{selected.name}</h2>
              <p className="text-gray-400 text-xs font-semibold mb-4 uppercase tracking-wider">{selected.category}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{selected.detail}</p>
              <div className="text-gray-700 text-2xl font-black mb-6">${selected.price.toLocaleString()}</div>
              <a
                href="mailto:jordan@jdlo.online"
                className="inline-block w-full py-3 rounded-xl font-bold text-sm bg-white/60 hover:bg-white/80 text-gray-600 transition-colors shadow-sm"
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
