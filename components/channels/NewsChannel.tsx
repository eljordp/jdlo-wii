'use client';

import { useState } from 'react';
import { ChevronLeft, ExternalLink, TrendingUp, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Project {
  id: number; name: string; client: string; dates: string; industry: string;
  tech: string[]; revBefore: string; revAfter: string; revIncrease: string;
  metrics: string[]; description: string; role: string; built: string;
  logo?: string; gradient: string;
}

const projects: Project[] = [
  {
    id: 1, name: 'Music Studio Website & Booking', client: 'Harmony Studios', dates: 'Jan–Mar 2025',
    industry: 'Music', tech: ['React', 'Node.js', 'Stripe', 'Calendar API'],
    revBefore: '$3.5k/mo', revAfter: '$7.2k/mo', revIncrease: '+$45k/yr',
    metrics: ['+85% bookings', '-60% no-shows', '+120% inquiries', '-40% admin time'],
    description: 'Full website rebuild with integrated booking system and payment processing.',
    role: 'Lead Developer & Systems Architect',
    built: 'Custom booking engine, automated reminders, Stripe integration, responsive site',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  {
    id: 2, name: 'CWBY Studios', client: 'CWBY Studios', dates: 'Aug–Nov 2025',
    industry: 'Creative Services', tech: ['Cold DM', 'CRM', 'Sales Pipeline'],
    revBefore: 'Sporadic', revAfter: 'Predictable', revIncrease: 'Systemized',
    metrics: ['Automated outreach', 'CRM pipeline built', 'Consistent lead flow', 'Brand positioning'],
    description: 'Built complete sales infrastructure from cold outreach to closed deals.',
    role: 'Systems Operator & Sales Architect',
    built: 'Cold DM sequences, CRM setup, sales pipeline, follow-up automation',
    logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69705b759c8dc226ae265997/6d3bfcf4f_cwby-logo-D3BwHLy9.png',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
  },
  {
    id: 3, name: 'Luxury Car Rental Platform', client: 'JetsCars Exclusive', dates: 'Mar–Jul 2024',
    industry: 'Automotive', tech: ['React', 'Stripe', 'Maps'],
    revBefore: '$95k/yr', revAfter: '$220k/yr', revIncrease: '+$125k/yr',
    metrics: ['+131% revenue', '+200% online bookings', '4.9★ rating', '-55% manual work'],
    description: 'Premium car rental platform with real-time availability and luxury booking flow.',
    role: 'Full Stack Developer',
    built: 'Custom booking platform, Stripe payments, fleet management, Maps integration',
    gradient: 'linear-gradient(135deg, #0c3483, #a2b6df)',
  },
  {
    id: 4, name: 'Inbound Lead System', client: 'Vacaville Appliance', dates: 'Jun–Nov 2024',
    industry: 'Service & Repair', tech: ['AI Receptionist', 'CRM', 'Email Auto'],
    revBefore: '$8k/mo', revAfter: '$18.5k/mo', revIncrease: '+$126k/yr',
    metrics: ['+131% revenue', '24/7 AI receptionist', '+200% qualified leads', '-70% missed calls'],
    description: 'AI-powered receptionist and automated lead qualification system.',
    role: 'Automation Architect',
    built: 'AI call handler, CRM pipeline, email sequences, lead scoring',
    gradient: 'linear-gradient(135deg, #f5af19, #f12711)',
  },
  {
    id: 5, name: 'Boutique Fitness Studio', client: 'CoreFlow Pilates', dates: 'May–Sep 2024',
    industry: 'Fitness', tech: ['WordPress', 'MindBody', 'Stripe'],
    revBefore: '$6k/mo', revAfter: '$11k/mo', revIncrease: '+$60k/yr',
    metrics: ['+83% revenue', '+150% online bookings', '+40% retention', '-50% admin time'],
    description: 'Full digital presence with integrated class booking and membership management.',
    role: 'Web Developer & Growth Consultant',
    built: 'Custom WordPress site, MindBody integration, membership flows, SEO',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  },
  {
    id: 6, name: 'Coffee Roastery E-Commerce', client: 'Peak Roasters', dates: 'Feb–Jun 2024',
    industry: 'Food & Beverage', tech: ['Shopify', 'Recharge', 'Klaviyo'],
    revBefore: '$4.5k/mo', revAfter: '$12k/mo', revIncrease: '+$90k/yr',
    metrics: ['+167% revenue', '+300% subscribers', '+85% email revenue', '45% repeat rate'],
    description: 'Subscription-based e-commerce platform with automated email marketing.',
    role: 'E-Commerce Architect',
    built: 'Shopify store, subscription system, Klaviyo flows, product photography',
    gradient: 'linear-gradient(135deg, #3e2723, #795548)',
  },
  {
    id: 7, name: 'Photography Portfolio + CRM', client: 'Lens & Light Studios', dates: 'Dec 2023–Apr 2024',
    industry: 'Creative', tech: ['React', 'Cloudinary', 'Airtable'],
    revBefore: '$5k/mo', revAfter: '$9.5k/mo', revIncrease: '+$54k/yr',
    metrics: ['+90% revenue', '+200% inquiries', '-60% response time', '98% client satisfaction'],
    description: 'Stunning portfolio site with integrated CRM and automated client onboarding.',
    role: 'Full Stack Developer',
    built: 'React portfolio, Cloudinary gallery, Airtable CRM, automated proposals',
    gradient: 'linear-gradient(135deg, #2196f3, #00bcd4)',
  },
  {
    id: 8, name: 'First Class International', client: 'First Class Intl', dates: 'Oct 2025–Present',
    industry: 'Luxury Network', tech: ['Website Architecture', 'Brand Positioning'],
    revBefore: 'New', revAfter: 'Building', revIncrease: 'In Progress',
    metrics: ['Brand identity built', 'Website architecture', 'Network positioning', 'Content strategy'],
    description: 'Premium brand positioning and digital presence for luxury networking platform.',
    role: 'COO & Digital Architect',
    built: 'Brand strategy, website architecture, content system, network positioning',
    logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69705b759c8dc226ae265997/d339c897a_Screenshot2026-01-23at12902AM.png',
    gradient: 'linear-gradient(135deg, #1a1a2e, #e2d9c2)',
  },
  {
    id: 9, name: 'The Sticker Smith', client: 'The Sticker Smith', dates: 'Jul 2025–Present',
    industry: 'E-Commerce & Print', tech: ['Smart Pricing', 'Google Business', 'E-Commerce'],
    revBefore: 'Manual DM', revAfter: 'Automated Sales', revIncrease: 'Systemized',
    metrics: ['Smart pricing engine', 'Google Business optimized', 'E-commerce store', 'Automated fulfillment'],
    description: 'From manual DM sales to fully automated e-commerce with smart pricing.',
    role: 'Systems Operator',
    built: 'Pricing engine, Google Business optimization, e-commerce store, fulfillment automation',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ffa07a)',
  },
  {
    id: 10, name: 'Manza Visuals', client: 'Manza Visuals', dates: 'Aug–Oct 2025',
    industry: 'Creative Services', tech: ['Portfolio', 'Local SEO', 'Brand Positioning'],
    revBefore: 'Word of mouth', revAfter: 'Inbound leads', revIncrease: 'Growing',
    metrics: ['Portfolio launched', 'Local SEO ranking', 'Brand clarity', '+200% inquiries'],
    description: 'Professional creative portfolio with local SEO and brand positioning.',
    role: 'Web Developer & Brand Consultant',
    built: 'Portfolio website, local SEO strategy, brand guidelines, social presence',
    logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69705b759c8dc226ae265997/22f4e9131_manza-logo-final-K7prHwch.png',
    gradient: 'linear-gradient(135deg, #232526, #414345)',
  },
];

const industries = ['All', ...Array.from(new Set(projects.map(p => p.industry)))];

export default function NewsChannel({ onBack }: Props) {
  const [industry, setIndustry] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rev-high' | 'rev-low'>('newest');
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = projects
    .filter(p => industry === 'All' || p.industry === industry)
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      return 0;
    });

  if (selected) {
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(26,26,46,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-sm md:text-base truncate">{selected.name}</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Hero */}
          <div className="rounded-2xl p-8 text-white relative overflow-hidden" style={{ background: selected.gradient }}>
            {selected.logo && <img src={selected.logo} alt="" className="w-20 h-20 rounded-xl object-contain bg-white/10 p-2 mb-4" />}
            <h2 className="text-2xl md:text-3xl font-black mb-1">{selected.name}</h2>
            <p className="text-white/80 text-sm">{selected.client}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1"><Calendar className="w-3 h-3" />{selected.dates}</span>
              <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold">{selected.industry}</span>
            </div>
          </div>

          {/* Revenue Impact */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Revenue Impact</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-xs mb-1">Before</p>
                <p className="text-white font-bold text-lg">{selected.revBefore}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">After</p>
                <p className="text-green-400 font-bold text-lg">{selected.revAfter}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Increase</p>
                <p className="text-yellow-400 font-black text-lg">{selected.revIncrease}</p>
              </div>
            </div>
          </div>

          {/* Role & Built */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-sm mb-2">My Role</h3>
              <p className="text-gray-300 text-sm">{selected.role}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-sm mb-2">What I Built</h3>
              <p className="text-gray-300 text-sm">{selected.built}</p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {selected.tech.map(t => (
                <span key={t} className="bg-blue-500/20 text-blue-300 rounded-full px-3 py-1 text-xs font-bold">{t}</span>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-sm mb-3">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              {selected.metrics.map((m, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-sm">{m}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-sm mb-2">Overview</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}>
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(22,163,74,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg">📰 News — Past Projects</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
        {industries.map(ind => (
          <button key={ind} onClick={() => setIndustry(ind)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              industry === ind ? 'bg-white text-green-700 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'
            }`}>
            {ind}
          </button>
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="ml-auto bg-white/20 text-white rounded-full px-3 py-1.5 text-xs font-bold outline-none [&>option]:text-black">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Project Grid */}
      <div className="px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => (
          <button key={p.id} onClick={() => setSelected(p)}
            className="text-left rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group">
            <div className="p-6 text-white relative" style={{ background: p.gradient }}>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {p.logo ? (
                <img src={p.logo} alt="" className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1.5 mb-3 relative z-[1]" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 relative z-[1]">
                  <span className="text-xl">📰</span>
                </div>
              )}
              <h3 className="font-bold text-base mb-0.5 relative z-[1]">{p.name}</h3>
              <p className="text-white/70 text-xs relative z-[1]">{p.client}</p>
              <div className="flex flex-wrap gap-1.5 mt-3 relative z-[1]">
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold">{p.dates}</span>
                {p.revIncrease !== 'In Progress' && p.revIncrease !== 'Systemized' && p.revIncrease !== 'Growing' && (
                  <span className="bg-green-400/30 rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
                    <DollarSign className="w-2.5 h-2.5" />{p.revIncrease}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
