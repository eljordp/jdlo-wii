'use client';

import { useState } from 'react';
import { ChevronLeft, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: 1, category: 'Pricing',
    question: 'How much does a website cost?',
    answer: 'Depends on what you need. A simple landing page starts around $300-$800. A full multi-page site with forms, blog, and SEO runs $1,200-$1,800. Need e-commerce, booking systems, or custom features? That\'s $2,000-$3,500. Check the Wii Shop for exact pricing on every service.',
  },
  {
    id: 2, category: 'Pricing',
    question: 'Do you offer payment plans?',
    answer: 'Yes. I require a down payment upfront (usually 50%) and then we can split the rest into payments. I\'m flexible, but I\'m strict — if you miss a payment, work pauses. No hard feelings, just business.',
  },
  {
    id: 3, category: 'Process',
    question: 'How long does it take?',
    answer: 'Most projects go live in 1-4 weeks depending on the scope. A simple site? 1-2 weeks. A full app? 4-8 weeks. I don\'t do 6-month projects that never launch. We move fast, get it live, and improve from there.',
  },
  {
    id: 4, category: 'Getting Started',
    question: 'What do I need to get started?',
    answer: 'Not much. I just need to know what your business does, who your customers are, and what you want the site/system to accomplish. If you have a logo, brand colors, or content ready — great. If not, I can help with that too.',
  },
  {
    id: 5, category: 'Getting Started',
    question: 'Can you help with my existing site?',
    answer: 'Absolutely. Whether it needs a redesign, speed improvements, SEO fixes, or new features — I can work with what you have. Sometimes a refresh is all you need, not a full rebuild.',
  },
  {
    id: 6, category: 'Process',
    question: 'How do we communicate during the project?',
    answer: 'However works best for you — text, email, Slack, or calls. I keep things simple. You\'ll get regular updates, and I won\'t ghost you. If I need something from you, I\'ll ask directly. No runaround.',
  },
  {
    id: 7, category: 'Process',
    question: 'What if I don\'t like the design?',
    answer: 'Every tier includes revision rounds. Starter gets 1-2 rounds, Professional gets 3-4, and Enterprise gets unlimited. I work with your feedback at every step — you\'re never stuck with something you don\'t love.',
  },
  {
    id: 8, category: 'After Launch',
    question: 'What happens after my site goes live?',
    answer: 'I don\'t just build it and disappear. You get support after launch to fix any issues. If you want ongoing maintenance, updates, or marketing help — we can set that up too. Most clients stick around because things keep working.',
  },
  {
    id: 9, category: 'After Launch',
    question: 'How do I know if it\'s actually working?',
    answer: 'I set up tracking so you can see real numbers — how many people visit, where they come from, what they click, and how many turn into leads or sales. No guessing. You\'ll have a dashboard with everything.',
  },
  {
    id: 10, category: 'Services',
    question: 'Do you do branding and logos too?',
    answer: 'Yes. Logo design, color palettes, brand guidelines, social media templates — the whole thing. I can do just the brand kit, or bundle it with your website build for a better deal.',
  },
  {
    id: 11, category: 'Services',
    question: 'What\'s an AI Receptionist?',
    answer: 'It\'s like having a virtual front desk person who never sleeps. It answers calls and chats on your website, qualifies leads by asking the right questions, books appointments on your calendar, and sends you notifications. All automatic, 24/7.',
  },
  {
    id: 12, category: 'Services',
    question: 'Can you set up my automations and CRM?',
    answer: 'That\'s literally what I do best. Email sequences, lead follow-ups, appointment reminders, invoice sending — if you\'re doing it manually and it\'s eating your time, I can automate it.',
  },
  {
    id: 13, category: 'Getting Started',
    question: 'I have no idea what I need. Can you just tell me?',
    answer: 'Yes. That\'s what the Consultation service is for. We hop on a call, I look at where your business is, and I tell you exactly what would make the biggest impact. No fluff, just a clear game plan.',
  },
  {
    id: 14, category: 'Pricing',
    question: 'Why should I pay you instead of using a template?',
    answer: 'Templates work fine if you just need a placeholder. But if you want something that actually converts visitors into customers, loads fast, ranks on Google, and doesn\'t look like everyone else\'s site — that\'s where I come in. You\'re not paying for a page, you\'re paying for a system that makes you money.',
  },
];

const categories = ['All', 'Getting Started', 'Pricing', 'Process', 'Services', 'After Launch'];

const cardStyle = {
  background: 'linear-gradient(180deg, #dbe7ef 0%, #cddae4 50%, #c4d4e0 100%)',
  border: '2.5px solid rgba(255,255,255,0.85)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
};

export default function InternetChannel({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = faqs.filter(f => {
    const matchesCat = category === 'All' || f.category === category;
    const matchesQuery = query === '' || f.question.toLowerCase().includes(query.toLowerCase()) || f.answer.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-lg px-3 py-1.5 text-sm font-bold transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>

      <div className="px-4 md:px-6 pb-3">
        <h1 className="text-gray-700 font-bold text-xl mb-3">🌐 Internet Channel</h1>

        {/* Search Bar */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #e8eff5 0%, #dbe5ed 100%)',
            border: '2.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="flex-1 bg-transparent outline-none text-gray-700 text-sm font-medium placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 md:px-6 pb-3 flex flex-wrap gap-2">
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

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 md:px-6 pb-8">
        {query && (
          <p className="text-gray-400 text-xs font-semibold mb-3">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} {query && `for "${query}"`}
          </p>
        )}

        <div className="space-y-2.5 max-w-2xl">
          {filtered.map(faq => (
            <div key={faq.id} className="rounded-2xl overflow-hidden" style={cardStyle}>
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 font-bold text-sm">{faq.question}</p>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{faq.category}</p>
                </div>
                {openId === faq.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                }
              </button>
              {openId === faq.id && (
                <div className="px-4 pb-4">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)',
                      border: '1.5px solid rgba(255,255,255,0.7)',
                    }}
                  >
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={cardStyle}>
              <p className="text-gray-400 text-sm font-semibold">No results found. Try a different search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
