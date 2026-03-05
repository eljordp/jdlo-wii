'use client';

import { useState } from 'react';
import { ChevronLeft, Globe, Palette, Lightbulb, Rocket, Bot, Construction, Plug, LayoutGrid, Search, Star, ShoppingCart, Clock, Check, ArrowLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Tier {
  name: string;
  price: string;
  timeline: string;
  description: string;
  features: string[];
}

interface Service {
  id: number;
  name: string;
  emoji: string;
  category: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
  tiers: Tier[];
}

const services: Service[] = [
  {
    id: 1, name: 'Your Online Home', emoji: '🌐', category: 'Web',
    desc: 'Get online quick with a beautiful, simple site. Perfect for portfolio, resume, or small business landing page.',
    icon: Globe, popular: true,
    tiers: [
      {
        name: 'Starter', price: '$300 - $800', timeline: '1-2 weeks',
        description: 'A clean, simple website that gets you online fast. Perfect for showcasing your portfolio, resume, or small business. Fully mobile-responsive, lightning-fast loading, and ready to go live immediately. Includes your own domain name and professional hosting.',
        features: ['Clean & Simple', 'Mobile Friendly', 'Super Fast', 'Show Your Work', '+ $50/mo hosting'],
      },
      {
        name: 'Professional', price: '$1,200 - $1,800', timeline: '2-4 weeks',
        description: 'A polished, multi-page website with custom design, contact forms, blog setup, and SEO optimization. Perfect for growing businesses that need more than a landing page.',
        features: ['Everything in Starter', 'Multi-Page Design', 'Contact Forms', 'Blog Setup', 'SEO Optimization', 'Analytics Dashboard'],
      },
      {
        name: 'Enterprise', price: '$2,000 - $3,500', timeline: '4-6 weeks',
        description: 'A fully custom website with advanced functionality — e-commerce, booking systems, member areas, and integrations. Built for businesses ready to scale.',
        features: ['Everything in Pro', 'E-Commerce Ready', 'Booking System', 'Member Areas', 'Custom Integrations', 'Priority Support'],
      },
    ],
  },
  {
    id: 2, name: 'Make It Pretty', emoji: '🎨', category: 'Branding',
    desc: 'Turn your ideas into gorgeous visuals. Logo, colors, and brand kit.',
    icon: Palette, popular: true,
    tiers: [
      {
        name: 'Starter', price: '$200 - $500', timeline: '3-5 days',
        description: 'A simple but effective brand starter kit. Logo design, color palette, and basic typography selection to get your brand looking professional.',
        features: ['Logo Design', 'Color Palette', 'Typography Pick', '2 Revisions'],
      },
      {
        name: 'Professional', price: '$800 - $1,200', timeline: '1-2 weeks',
        description: 'Complete visual identity system with logo variations, brand guidelines document, social media templates, and business card design.',
        features: ['Everything in Starter', 'Logo Variations', 'Brand Guidelines', 'Social Templates', 'Business Cards', '4 Revisions'],
      },
      {
        name: 'Enterprise', price: '$1,500 - $2,500', timeline: '2-3 weeks',
        description: 'Full brand strategy and identity — positioning, messaging framework, complete visual system, and marketing collateral ready to launch.',
        features: ['Everything in Pro', 'Brand Strategy', 'Messaging Framework', 'Marketing Collateral', 'Presentation Templates', 'Unlimited Revisions'],
      },
    ],
  },
  {
    id: 3, name: 'Consultation + Advisory', emoji: '💡', category: 'Sales',
    desc: 'Get unstuck with expert guidance on business and digital strategy.',
    icon: Lightbulb, popular: true,
    tiers: [
      {
        name: 'Starter', price: '$500 - $1,000', timeline: '1-2 sessions',
        description: 'Focused strategy session to tackle your biggest challenge. Get clear action steps and a roadmap to move forward.',
        features: ['1-2 Hour Session', 'Action Plan', 'Follow-Up Email', 'Resource List'],
      },
      {
        name: 'Professional', price: '$1,500 - $2,500', timeline: '2-4 weeks',
        description: 'Multi-session advisory program with deep-dive analysis, ongoing support, and implementation guidance.',
        features: ['Everything in Starter', '4 Sessions', 'Business Audit', 'Sales Strategy', 'Weekly Check-ins', 'Slack Support'],
      },
      {
        name: 'Enterprise', price: '$3,000 - $5,000', timeline: '1-3 months',
        description: 'Comprehensive advisory retainer with hands-on involvement. I become your fractional strategist.',
        features: ['Everything in Pro', 'Monthly Retainer', 'On-Call Support', 'Team Training', 'Growth Planning', 'Priority Access'],
      },
    ],
  },
  {
    id: 4, name: 'Launch Your App', emoji: '🚀', category: 'Web',
    desc: 'From idea to live app in weeks. Full-stack development.',
    icon: Rocket, popular: true,
    tiers: [
      {
        name: 'Starter', price: '$3,000 - $5,000', timeline: '2-4 weeks',
        description: 'A focused MVP to validate your idea. Core features, clean UI, and deployment — everything you need to launch and test.',
        features: ['MVP Build', 'Core Features', 'Clean UI', 'Deployment', 'Basic Analytics'],
      },
      {
        name: 'Professional', price: '$6,000 - $10,000', timeline: '4-8 weeks',
        description: 'A production-ready app with full feature set, user authentication, database, API integrations, and admin dashboard.',
        features: ['Everything in Starter', 'User Auth', 'Database Design', 'API Integrations', 'Admin Dashboard', 'Testing Suite'],
      },
      {
        name: 'Enterprise', price: '$12,000 - $20,000', timeline: '8-16 weeks',
        description: 'Enterprise-grade application with scalable architecture, real-time features, advanced security, and ongoing maintenance.',
        features: ['Everything in Pro', 'Scalable Architecture', 'Real-Time Features', 'Advanced Security', 'CI/CD Pipeline', 'Ongoing Maintenance'],
      },
    ],
  },
  {
    id: 5, name: 'AI Receptionist', emoji: '🤖', category: 'AI',
    desc: 'Never miss a call. AI answers, qualifies, and books.',
    icon: Bot, popular: true,
    tiers: [
      {
        name: 'Starter', price: '$800 - $1,500', timeline: '3-5 days',
        description: 'Basic AI chatbot for your website that answers FAQs, captures leads, and sends notifications.',
        features: ['Website Chatbot', 'FAQ Handling', 'Lead Capture', 'Email Notifications', '+ $100/mo'],
      },
      {
        name: 'Professional', price: '$2,000 - $3,000', timeline: '1-2 weeks',
        description: 'Advanced AI assistant with phone integration, appointment booking, CRM sync, and custom training.',
        features: ['Everything in Starter', 'Phone Integration', 'Appointment Booking', 'CRM Sync', 'Custom Training', '+ $200/mo'],
      },
      {
        name: 'Enterprise', price: '$3,500 - $5,000', timeline: '2-4 weeks',
        description: 'Full AI receptionist system — multi-channel, intelligent routing, analytics dashboard, and white-label branding.',
        features: ['Everything in Pro', 'Multi-Channel', 'Smart Routing', 'Analytics Dashboard', 'White-Label', '+ $350/mo'],
      },
    ],
  },
  {
    id: 6, name: 'System Architecture', emoji: '🏗️', category: 'Automation',
    desc: 'The blueprint for your app to work perfectly at scale.',
    icon: Construction, popular: false,
    tiers: [
      {
        name: 'Starter', price: '$2,000 - $4,000', timeline: '1-2 weeks',
        description: 'Technical audit and architecture plan for your existing system. Identify bottlenecks and get a clear roadmap.',
        features: ['System Audit', 'Architecture Plan', 'Tech Recommendations', 'Documentation'],
      },
      {
        name: 'Professional', price: '$5,000 - $8,000', timeline: '2-4 weeks',
        description: 'Complete system design with database schemas, API specs, infrastructure planning, and security review.',
        features: ['Everything in Starter', 'Database Design', 'API Specifications', 'Infrastructure Plan', 'Security Review', 'CI/CD Setup'],
      },
      {
        name: 'Enterprise', price: '$10,000 - $15,000', timeline: '4-8 weeks',
        description: 'Enterprise architecture with implementation support, team onboarding, and ongoing technical advisory.',
        features: ['Everything in Pro', 'Implementation Support', 'Team Onboarding', 'Performance Tuning', 'Monitoring Setup', 'Technical Advisory'],
      },
    ],
  },
  {
    id: 7, name: 'Brand Identity', emoji: '🔌', category: 'Branding',
    desc: 'Plug into a complete brand system.',
    icon: Plug, popular: false,
    tiers: [
      {
        name: 'Starter', price: '$400 - $800', timeline: '3-5 days',
        description: 'Brand discovery and positioning statement. Clarify who you are, who you serve, and what makes you different.',
        features: ['Brand Discovery', 'Positioning Statement', 'Target Audience', 'Competitor Analysis'],
      },
      {
        name: 'Professional', price: '$1,000 - $1,500', timeline: '1-2 weeks',
        description: 'Complete brand identity with messaging, visual guidelines, and content voice documentation.',
        features: ['Everything in Starter', 'Brand Messaging', 'Visual Guidelines', 'Content Voice', 'Tagline Options', 'Brand Story'],
      },
      {
        name: 'Enterprise', price: '$2,000 - $3,000', timeline: '2-3 weeks',
        description: 'Full brand strategy with market research, brand architecture, and go-to-market plan.',
        features: ['Everything in Pro', 'Market Research', 'Brand Architecture', 'Go-To-Market Plan', 'Launch Strategy', 'Ongoing Support'],
      },
    ],
  },
  {
    id: 8, name: 'Content System', emoji: '📐', category: 'Automation',
    desc: 'Automate your content pipeline. Post consistently.',
    icon: LayoutGrid, popular: false,
    tiers: [
      {
        name: 'Starter', price: '$500 - $1,000', timeline: '3-5 days',
        description: 'Content calendar setup with templates and scheduling tools. Get organized and start posting consistently.',
        features: ['Content Calendar', 'Post Templates', 'Scheduling Setup', 'Platform Strategy'],
      },
      {
        name: 'Professional', price: '$1,200 - $1,800', timeline: '1-2 weeks',
        description: 'Full content system with repurposing workflows, AI-assisted writing, and analytics tracking.',
        features: ['Everything in Starter', 'Repurposing Workflows', 'AI Writing Assist', 'Analytics Tracking', 'Hashtag Strategy', 'Engagement Plan'],
      },
      {
        name: 'Enterprise', price: '$2,000 - $3,000', timeline: '2-3 weeks',
        description: 'Complete content engine — strategy, creation workflows, distribution automation, and performance optimization.',
        features: ['Everything in Pro', 'Content Strategy', 'Distribution Automation', 'A/B Testing', 'Performance Reports', 'Monthly Optimization'],
      },
    ],
  },
  {
    id: 9, name: 'SEO Audit', emoji: '🔍', category: 'Web',
    desc: "Find out why they can't find you online.",
    icon: Search, popular: false,
    tiers: [
      {
        name: 'Starter', price: '$300 - $600', timeline: '3-5 days',
        description: 'Basic SEO health check — technical issues, keyword gaps, and quick wins to improve your search visibility.',
        features: ['Technical Audit', 'Keyword Gaps', 'Quick Wins List', 'Competitor Check'],
      },
      {
        name: 'Professional', price: '$800 - $1,200', timeline: '1-2 weeks',
        description: 'Comprehensive SEO analysis with keyword research, content strategy, and prioritized action plan.',
        features: ['Everything in Starter', 'Keyword Research', 'Content Strategy', 'Backlink Analysis', 'Action Plan', 'Monthly Tracking'],
      },
      {
        name: 'Enterprise', price: '$1,500 - $2,500', timeline: '2-4 weeks',
        description: 'Full SEO overhaul with implementation support, content optimization, and ongoing monitoring.',
        features: ['Everything in Pro', 'Implementation Support', 'Content Optimization', 'Local SEO', 'Schema Markup', 'Quarterly Reviews'],
      },
    ],
  },
];

const categories = ['All', 'Web', 'Branding', 'Sales', 'AI', 'Automation'];

export default function WiiShop({ onBack }: Props) {
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedTier, setSelectedTier] = useState(0);

  const filtered = services.filter(s => category === 'All' || s.category === category);

  /* ═══════ PRODUCT PAGE ═══════ */
  if (selected) {
    const tier = selected.tiers[selectedTier];
    return (
      <div className="h-full w-full flex flex-col overflow-auto" style={{ background: 'linear-gradient(180deg, #c4dff0 0%, #d4c4f0 100%)' }}>
        <div className="px-4 md:px-8 pt-4">
          <button
            onClick={() => { setSelected(null); setSelectedTier(0); }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 bg-white/70 hover:bg-white/90 rounded-xl px-4 py-2 text-sm font-bold transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </button>
        </div>

        <div className="flex-1 px-4 md:px-8 pb-8 pt-4 max-w-3xl mx-auto w-full space-y-4">
          {/* Hero Card */}
          <div
            className="rounded-2xl p-6 md:p-8 flex items-start gap-5"
            style={{
              background: 'linear-gradient(135deg, #5b8def 0%, #7c6cf0 100%)',
              boxShadow: '0 4px 20px rgba(91,141,239,0.3)',
            }}
          >
            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white/15 flex items-center justify-center">
              <selected.icon className="w-10 h-10 md:w-12 md:h-12 text-white/90" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-white text-xl md:text-2xl font-black">
                  {selected.emoji} {selected.name}
                </h2>
                {selected.popular && (
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-900" /> Popular
                  </span>
                )}
              </div>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">{selected.desc}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                  {tier.price}
                </span>
                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {tier.timeline}
                </span>
              </div>
            </div>
          </div>

          {/* Select Your Tier */}
          <div
            className="rounded-2xl bg-white/70 p-5 md:p-6 shadow-sm"
            style={{ border: '1px solid rgba(255,255,255,0.8)' }}
          >
            <h3 className="text-gray-700 font-bold text-lg mb-4">Select Your Tier</h3>
            <div className="grid grid-cols-3 gap-3">
              {selected.tiers.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTier(i)}
                  className={`rounded-xl py-3 px-2 text-center font-bold transition-all ${
                    selectedTier === i
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={selectedTier === i ? { background: 'linear-gradient(180deg, #4ade80, #22c55e)' } : undefined}
                >
                  <div className="text-sm">{t.name}</div>
                  <div className={`text-xs mt-0.5 ${selectedTier === i ? 'text-white/80' : 'text-gray-400'}`}>
                    {t.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <div
            className="rounded-2xl bg-white/70 p-5 md:p-6 shadow-sm"
            style={{ border: '1px solid rgba(255,255,255,0.8)' }}
          >
            <h3 className="text-gray-700 font-bold text-lg mb-3">What&apos;s Included</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">{tier.description}</p>
            <h4 className="text-gray-700 font-bold text-sm mb-3">Key Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tier.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-gray-600 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            <a
              href={`mailto:jordan@jdlo.online?subject=${encodeURIComponent(`${selected.name} - ${tier.name}`)}`}
              className="py-3.5 rounded-xl font-bold text-sm text-white text-center shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </span>
            </a>
            <a
              href="mailto:jordan@jdlo.online"
              className="py-3.5 rounded-xl font-bold text-sm text-white text-center shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ SHOP GRID ═══════ */
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
      </div>

      <div className="px-4 md:px-6 pb-2">
        <h1 className="text-gray-700 font-bold text-xl">🛒 Wii Shop Channel</h1>
      </div>

      {/* Category Pills */}
      <div className="px-4 md:px-6 pb-3 flex items-center gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              category === c
                ? 'bg-white text-gray-700 shadow-md'
                : 'bg-white/40 text-gray-500 hover:bg-white/60'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-auto px-4 md:px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map(service => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => { setSelected(service); setSelectedTier(0); }}
                className="relative rounded-2xl p-5 md:p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center overflow-visible"
                style={{
                  background: 'linear-gradient(180deg, #dbe7ef 0%, #cddae4 50%, #c4d4e0 100%)',
                  border: '2.5px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                {service.popular && (
                  <div className="absolute -top-2.5 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm z-10">
                    <Star className="w-3 h-3 fill-yellow-900" /> Popular
                  </div>
                )}
                <div className="mb-3 mt-1">
                  <Icon className="w-10 h-10 md:w-12 md:h-12 text-gray-400 drop-shadow-sm" />
                </div>
                <h3 className="text-gray-700 font-bold text-sm md:text-base mb-1">{service.name}</h3>
                <p className="text-gray-400 text-xs mb-4 leading-relaxed">{service.desc}</p>
                <div className="mt-auto w-full">
                  <div className="w-full py-2 rounded-lg text-center font-bold text-gray-600 text-sm bg-white/50">
                    From {service.tiers[0].price.split(' - ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
