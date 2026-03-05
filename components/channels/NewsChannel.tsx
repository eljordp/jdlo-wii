'use client';

import { useState } from 'react';
import { ChevronLeft, TrendingUp, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Project {
  id: number; name: string; client: string; dates: string; industry: string;
  tech: string[]; revBefore: string; revAfter: string; revIncrease: string;
  metrics: string[]; description: string; role: string; built: string;
  logo?: string;
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
  },
  {
    id: 3, name: 'Luxury Car Rental Platform', client: 'JetsCars Exclusive', dates: 'Mar–Jul 2024',
    industry: 'Automotive', tech: ['React', 'Stripe', 'Maps'],
    revBefore: '$95k/yr', revAfter: '$220k/yr', revIncrease: '+$125k/yr',
    metrics: ['+131% revenue', '+200% online bookings', '4.9★ rating', '-55% manual work'],
    description: 'Premium car rental platform with real-time availability and luxury booking flow.',
    role: 'Full Stack Developer',
    built: 'Custom booking platform, Stripe payments, fleet management, Maps integration',
  },
  {
    id: 4, name: 'Inbound Lead System', client: 'Vacaville Appliance', dates: 'Jun–Nov 2024',
    industry: 'Service & Repair', tech: ['AI Receptionist', 'CRM', 'Email Auto'],
    revBefore: '$8k/mo', revAfter: '$18.5k/mo', revIncrease: '+$126k/yr',
    metrics: ['+131% revenue', '24/7 AI receptionist', '+200% qualified leads', '-70% missed calls'],
    description: 'AI-powered receptionist and automated lead qualification system.',
    role: 'Automation Architect',
    built: 'AI call handler, CRM pipeline, email sequences, lead scoring',
  },
  {
    id: 5, name: 'Boutique Fitness Studio', client: 'CoreFlow Pilates', dates: 'May–Sep 2024',
    industry: 'Fitness', tech: ['WordPress', 'MindBody', 'Stripe'],
    revBefore: '$6k/mo', revAfter: '$11k/mo', revIncrease: '+$60k/yr',
    metrics: ['+83% revenue', '+150% online bookings', '+40% retention', '-50% admin time'],
    description: 'Full digital presence with integrated class booking and membership management.',
    role: 'Web Developer & Growth Consultant',
    built: 'Custom WordPress site, MindBody integration, membership flows, SEO',
  },
  {
    id: 6, name: 'Coffee Roastery E-Commerce', client: 'Peak Roasters', dates: 'Feb–Jun 2024',
    industry: 'Food & Beverage', tech: ['Shopify', 'Recharge', 'Klaviyo'],
    revBefore: '$4.5k/mo', revAfter: '$12k/mo', revIncrease: '+$90k/yr',
    metrics: ['+167% revenue', '+300% subscribers', '+85% email revenue', '45% repeat rate'],
    description: 'Subscription-based e-commerce platform with automated email marketing.',
    role: 'E-Commerce Architect',
    built: 'Shopify store, subscription system, Klaviyo flows, product photography',
  },
  {
    id: 7, name: 'Photography Portfolio + CRM', client: 'Lens & Light Studios', dates: 'Dec 2023–Apr 2024',
    industry: 'Creative', tech: ['React', 'Cloudinary', 'Airtable'],
    revBefore: '$5k/mo', revAfter: '$9.5k/mo', revIncrease: '+$54k/yr',
    metrics: ['+90% revenue', '+200% inquiries', '-60% response time', '98% client satisfaction'],
    description: 'Stunning portfolio site with integrated CRM and automated client onboarding.',
    role: 'Full Stack Developer',
    built: 'React portfolio, Cloudinary gallery, Airtable CRM, automated proposals',
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
  },
  {
    id: 9, name: 'The Sticker Smith', client: 'The Sticker Smith', dates: 'Jul 2025–Present',
    industry: 'E-Commerce & Print', tech: ['Smart Pricing', 'Google Business', 'E-Commerce'],
    revBefore: 'Manual DM', revAfter: 'Automated Sales', revIncrease: 'Systemized',
    metrics: ['Smart pricing engine', 'Google Business optimized', 'E-commerce store', 'Automated fulfillment'],
    description: 'From manual DM sales to fully automated e-commerce with smart pricing.',
    role: 'Systems Operator',
    built: 'Pricing engine, Google Business optimization, e-commerce store, fulfillment automation',
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
  },
];

const industries = ['All', ...Array.from(new Set(projects.map(p => p.industry)))];

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

export default function NewsChannel({ onBack }: Props) {
  const [industry, setIndustry] = useState('All');
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = projects
    .filter(p => industry === 'All' || p.industry === industry)
    .sort((a, b) => b.id - a.id);

  /* ═══════ PROJECT DETAIL ═══════ */
  if (selected) {
    const hasRevNumbers = !['In Progress', 'Systemized', 'Growing'].includes(selected.revIncrease);
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>
        <div className="px-4 md:px-8 pt-4 pb-2">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
        </div>

        <div className="px-4 md:px-8 pb-10 max-w-2xl mx-auto space-y-4">
          {/* Hero */}
          <div className="rounded-2xl p-6 md:p-8" style={cardStyle}>
            <div className="flex items-start gap-4">
              {selected.logo ? (
                <img src={selected.logo} alt="" className="w-14 h-14 rounded-xl object-contain bg-white/60 p-1.5 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/40 flex items-center justify-center shrink-0">
                  <span className="text-2xl">📰</span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-gray-700 text-xl md:text-2xl font-black">{selected.name}</h2>
                <p className="text-gray-400 text-sm font-semibold">{selected.client}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-white/50 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {selected.dates}
                  </span>
                  <span className="bg-white/50 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-500">{selected.industry}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Impact */}
          {hasRevNumbers && (
            <div className="rounded-2xl p-5 md:p-6" style={cardStyle}>
              <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" /> Revenue Impact
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl p-3" style={innerCard}>
                  <p className="text-gray-400 text-[10px] font-bold mb-1">Before</p>
                  <p className="text-gray-600 font-bold text-sm">{selected.revBefore}</p>
                </div>
                <div className="rounded-xl p-3" style={innerCard}>
                  <p className="text-gray-400 text-[10px] font-bold mb-1">After</p>
                  <p className="text-gray-600 font-bold text-sm">{selected.revAfter}</p>
                </div>
                <div className="rounded-xl p-3" style={innerCard}>
                  <p className="text-gray-400 text-[10px] font-bold mb-1">Increase</p>
                  <p className="text-gray-700 font-black text-sm">{selected.revIncrease}</p>
                </div>
              </div>
            </div>
          )}

          {/* Role & Built */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-2">My Role</h3>
              <p className="text-gray-500 text-sm">{selected.role}</p>
            </div>
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-2">What I Built</h3>
              <p className="text-gray-500 text-sm">{selected.built}</p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {selected.tech.map(t => (
                <span key={t} className="bg-white/50 text-gray-500 rounded-lg px-3 py-1 text-xs font-bold">{t}</span>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-3">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {selected.metrics.map((m, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={innerCard}>
                  <p className="text-gray-600 font-bold text-xs">{m}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Overview */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-2">Overview</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{selected.description}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ PROJECT GRID ═══════ */
  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>

      <div className="px-4 md:px-6 pb-2">
        <h1 className="text-gray-700 font-bold text-xl">📰 News — Past Projects</h1>
      </div>

      {/* Industry Filter */}
      <div className="px-4 md:px-6 pb-3 flex flex-wrap gap-2">
        {industries.map(ind => (
          <button
            key={ind}
            onClick={() => setIndustry(ind)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              industry === ind
                ? 'bg-white text-gray-700 shadow-md'
                : 'bg-white/40 text-gray-500 hover:bg-white/60'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Project Cards */}
      <div className="px-4 md:px-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => {
          const hasRevNum = !['In Progress', 'Systemized', 'Growing'].includes(p.revIncrease);
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="text-left rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={cardStyle}
            >
              <div className="flex items-start gap-3 mb-3">
                {p.logo ? (
                  <img src={p.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/50 p-1 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                    <span className="text-lg">📰</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-gray-700 font-bold text-sm">{p.name}</h3>
                  <p className="text-gray-400 text-[10px] font-semibold">{p.client}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/50 rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-400">{p.dates}</span>
                <span className="bg-white/50 rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-400">{p.industry}</span>
                {hasRevNum && (
                  <span className="bg-white/50 rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-500 flex items-center gap-0.5">
                    <DollarSign className="w-2.5 h-2.5" /> {p.revIncrease}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
