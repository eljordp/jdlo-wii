'use client';

import { ChevronLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface ForecastEntry {
  period: 'this_week' | 'this_month' | 'this_year';
  location: string;
  activity: string;
  weather: string;
  temperature: string;
  description: string;
  priority: number;
}

const weatherEmoji: Record<string, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '❄️', 'partly-cloudy': '⛅',
};

const entries: ForecastEntry[] = [
  { period: 'this_week', location: 'Napa Valley', activity: 'Client Onboarding Sprint', weather: 'sunny', temperature: '72°', description: 'Onboarding 2 new clients — website builds + CRM setup', priority: 1 },
  { period: 'this_week', location: 'Remote', activity: 'Pomaika\'i COO Work', weather: 'partly-cloudy', temperature: '68°', description: 'Systems buildout and team coordination', priority: 2 },
  { period: 'this_week', location: 'Bay Area', activity: 'Sales Calls', weather: 'sunny', temperature: '70°', description: '3 discovery calls booked — qualify and close', priority: 3 },
  { period: 'this_month', location: 'Vacaville', activity: 'Portfolio Launch', weather: 'sunny', temperature: '75°', description: 'Ship jdlo.site v2 — this Wii-themed portfolio', priority: 1 },
  { period: 'this_month', location: 'Remote', activity: 'MRR Engine Build', weather: 'partly-cloudy', temperature: '65°', description: 'Set up recurring revenue from retainer clients', priority: 2 },
  { period: 'this_month', location: 'Bay Area', activity: 'Network Events', weather: 'cloudy', temperature: '62°', description: 'Attend 2 networking events for lead gen', priority: 3 },
  { period: 'this_month', location: 'Home Office', activity: 'LLC Formation', weather: 'sunny', temperature: '70°', description: 'Register business entity and set up invoicing', priority: 4 },
  { period: 'this_year', location: 'California', activity: '$10K/mo Revenue', weather: 'sunny', temperature: '80°', description: 'Hit consistent $10K/mo through Pomaika\'i + freelance', priority: 1 },
  { period: 'this_year', location: 'Everywhere', activity: 'Team of 3', weather: 'sunny', temperature: '78°', description: 'Hire 2 reliable operators who don\'t need babysitting', priority: 2 },
  { period: 'this_year', location: 'Digital', activity: 'Brand Authority', weather: 'partly-cloudy', temperature: '72°', description: 'Become the go-to systems operator in the Bay', priority: 3 },
];

const periodLabels: Record<string, string> = {
  this_week: '📅 This Week',
  this_month: '📆 This Month',
  this_year: '🎯 This Year',
};

export default function ForecastChannel({ onBack }: Props) {
  const grouped = {
    this_week: entries.filter(e => e.period === 'this_week').sort((a, b) => a.priority - b.priority),
    this_month: entries.filter(e => e.period === 'this_month').sort((a, b) => a.priority - b.priority),
    this_year: entries.filter(e => e.period === 'this_year').sort((a, b) => a.priority - b.priority),
  };

  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #b3d9f2 30%, #e0f0ff 100%)' }}>
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(135,206,235,0.85)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/30 hover:bg-white/40 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg drop-shadow">🌤️ Forecast</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {(['this_week', 'this_month', 'this_year'] as const).map(period => (
          <div key={period}>
            <h2 className="text-gray-700 font-bold text-lg mb-3">{periodLabels[period]}</h2>
            <div className="space-y-3">
              {grouped[period].map((entry, i) => (
                <div key={i} className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0 mt-0.5">{weatherEmoji[entry.weather] || '🌤️'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-gray-800 font-bold text-sm">{entry.activity}</h3>
                        <span className="text-gray-500 font-bold text-sm shrink-0">{entry.temperature}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">📍 {entry.location}</p>
                      <p className="text-gray-600 text-xs mt-2 leading-relaxed">{entry.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
