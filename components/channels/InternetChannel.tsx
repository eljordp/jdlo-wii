'use client';

import { useState } from 'react';
import { ChevronLeft, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

const faqs = [
  { id: 1, cat: 'Pricing', q: 'How much does a website cost?', a: 'Depends on what you need. A simple landing page starts around $300-$800. A full multi-page site with forms, blog, and SEO runs $1,200-$1,800. Need e-commerce, booking systems, or custom features? That\'s $2,000-$3,500. Check the Wii Shop for exact pricing on every service.' },
  { id: 2, cat: 'Pricing', q: 'Do you offer payment plans?', a: 'Yes. I require a down payment upfront (usually 50%) and then we can split the rest into payments. I\'m flexible, but I\'m strict — if you miss a payment, work pauses. No hard feelings, just business.' },
  { id: 3, cat: 'Process', q: 'How long does it take?', a: 'Most projects go live in 1-4 weeks depending on the scope. A simple site? 1-2 weeks. A full app? 4-8 weeks. I don\'t do 6-month projects that never launch. We move fast, get it live, and improve from there.' },
  { id: 4, cat: 'Getting Started', q: 'What do I need to get started?', a: 'Not much. I just need to know what your business does, who your customers are, and what you want the site/system to accomplish. If you have a logo, brand colors, or content ready — great. If not, I can help with that too.' },
  { id: 5, cat: 'Getting Started', q: 'Can you help with my existing site?', a: 'Absolutely. Whether it needs a redesign, speed improvements, SEO fixes, or new features — I can work with what you have. Sometimes a refresh is all you need, not a full rebuild.' },
  { id: 6, cat: 'Process', q: 'How do we communicate during the project?', a: 'However works best for you — text, email, Slack, or calls. I keep things simple. You\'ll get regular updates, and I won\'t ghost you. If I need something from you, I\'ll ask directly. No runaround.' },
  { id: 7, cat: 'Process', q: 'What if I don\'t like the design?', a: 'Every tier includes revision rounds. Starter gets 1-2 rounds, Professional gets 3-4, and Enterprise gets unlimited. I work with your feedback at every step — you\'re never stuck with something you don\'t love.' },
  { id: 8, cat: 'After Launch', q: 'What happens after my site goes live?', a: 'I don\'t just build it and disappear. You get support after launch to fix any issues. If you want ongoing maintenance, updates, or marketing help — we can set that up too. Most clients stick around because things keep working.' },
  { id: 9, cat: 'After Launch', q: 'How do I know if it\'s actually working?', a: 'I set up tracking so you can see real numbers — how many people visit, where they come from, what they click, and how many turn into leads or sales. No guessing. You\'ll have a dashboard with everything.' },
  { id: 10, cat: 'Services', q: 'Do you do branding and logos too?', a: 'Yes. Logo design, color palettes, brand guidelines, social media templates — the whole thing. I can do just the brand kit, or bundle it with your website build for a better deal.' },
  { id: 11, cat: 'Services', q: 'What\'s an AI Receptionist?', a: 'It\'s like having a virtual front desk person who never sleeps. It answers calls and chats on your website, qualifies leads by asking the right questions, books appointments on your calendar, and sends you notifications. All automatic, 24/7.' },
  { id: 12, cat: 'Services', q: 'Can you set up my automations and CRM?', a: 'That\'s literally what I do best. Email sequences, lead follow-ups, appointment reminders, invoice sending — if you\'re doing it manually and it\'s eating your time, I can automate it.' },
  { id: 13, cat: 'Getting Started', q: 'I have no idea what I need. Can you just tell me?', a: 'Yes. That\'s what the Consultation service is for. We hop on a call, I look at where your business is, and I tell you exactly what would make the biggest impact. No fluff, just a clear game plan.' },
  { id: 14, cat: 'Pricing', q: 'Why should I pay you instead of using a template?', a: 'Templates work fine if you just need a placeholder. But if you want something that actually converts visitors into customers, loads fast, ranks on Google, and doesn\'t look like everyone else\'s site — that\'s where I come in. You\'re not paying for a page, you\'re paying for a system that makes you money.' },
];

const cats = ['All', 'Getting Started', 'Pricing', 'Process', 'Services', 'After Launch'];

export default function InternetChannel({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = faqs.filter(f => {
    const matchCat = cat === 'All' || f.cat === cat;
    const matchQ = !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-3 pb-1.5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Menu
        </button>
        <h1 className="text-gray-700 font-bold text-base">🌐 Internet Channel</h1>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 pb-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: '#e4ecf2',
            border: '2px solid rgba(255,255,255,0.85)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 text-[10px] font-bold">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-1.5">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              cat === c ? 'bg-white text-gray-700 shadow-sm' : 'bg-white/40 text-gray-500 hover:bg-white/60'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="flex-1 overflow-auto px-4 md:px-6 pb-6">
        {query && (
          <p className="text-gray-400 text-[10px] font-bold mb-1.5">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        <div className="space-y-1.5 max-w-2xl">
          {filtered.map(faq => (
            <div
              key={faq.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #dfe9f0 0%, #d0dce5 100%)',
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left"
              >
                <p className="text-gray-700 font-bold text-[13px] leading-snug">{faq.q}</p>
                {openId === faq.id
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                }
              </button>
              {openId === faq.id && (
                <div className="px-3.5 pb-3">
                  <p className="text-gray-600 text-[13px] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl px-4 py-6 text-center" style={{ background: '#dfe9f0', border: '2px solid rgba(255,255,255,0.8)' }}>
              <p className="text-gray-400 text-sm font-semibold">No results found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
