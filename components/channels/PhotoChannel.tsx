'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight as ChevronR, X } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Photo { id: number; url: string; category: string; alt: string }

const B = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69705b759c8dc226ae265997/';

const photos: Photo[] = [
  { id: 1, url: `${B}af179ee70_image.png`, category: 'Adventures', alt: 'Lake day with the crew' },
  { id: 2, url: `${B}12b79f88f_image.png`, category: 'Adventures', alt: 'Beach vibes, no worries' },
  { id: 3, url: `${B}f97897ac6_image.png`, category: 'Squad', alt: 'The squad linked up' },
  { id: 4, url: `${B}2ee8ddcb2_image.png`, category: 'Life', alt: 'Throwback to the good days' },
  { id: 5, url: `${B}b2da56def_image.png`, category: 'Life', alt: 'Halloween went crazy' },
  { id: 6, url: `${B}88f2f3f42_image.png`, category: 'Life', alt: 'Night moves, city lights' },
  { id: 7, url: `${B}b9df2764b_image.png`, category: 'Drip', alt: 'Hood up, locked in' },
  { id: 8, url: `${B}7573a5d21_image.png`, category: 'Life', alt: 'Young Raiders, born with it' },
  { id: 9, url: `${B}75b63b68e_image.png`, category: 'Life', alt: 'Quick store run' },
  { id: 10, url: `${B}4b6dbfd71_image.png`, category: 'Adventures', alt: 'Palm trees and good energy' },
  { id: 11, url: `${B}4bf5d8f06_image.png`, category: 'Adventures', alt: 'Universal Studios run' },
  { id: 12, url: `${B}070611cda_image.png`, category: 'Drip', alt: 'Posted up with the whip' },
  { id: 13, url: `${B}fe27f9341_image.png`, category: 'Life', alt: 'Money moves only' },
  { id: 14, url: `${B}39df25997_image.png`, category: 'Life', alt: 'Vineyard work, real hours' },
  { id: 15, url: `${B}d5f039ffb_image.png`, category: 'Adventures', alt: 'Dino attack at the museum' },
  { id: 16, url: `${B}e11b820b2_image.png`, category: 'Family', alt: 'The little one' },
  { id: 17, url: `${B}4ab726703_image.png`, category: 'Adventures', alt: 'Farm life, different pace' },
  { id: 18, url: `${B}0ac9313e2_image.png`, category: 'Drip', alt: 'Mirror check before stepping out' },
  { id: 19, url: `${B}18559c7bf_image.png`, category: 'Drip', alt: 'Corvette dreams' },
  { id: 20, url: `${B}58acf053c_image.png`, category: 'Adventures', alt: 'Theme park with the fam' },
  { id: 21, url: `${B}0dbb6c337_image.png`, category: 'Life', alt: 'Baseball team days' },
  { id: 22, url: `${B}c2e173e43_image.png`, category: 'Life', alt: 'Batman mode activated' },
  { id: 23, url: `${B}e30d6783b_image.png`, category: 'Life', alt: 'Peace out, always' },
  { id: 24, url: `${B}b0a3ac17a_image.png`, category: 'Squad', alt: 'Squad goals, no cap' },
  { id: 25, url: `${B}33387654d_image.png`, category: 'Life', alt: 'Shopping spree with the team' },
  { id: 26, url: `${B}a478626d9_B299E392-B142-4CD5-BB5E-8AFEEFCBD14C.jpeg`, category: 'Drip', alt: 'Suited up, business ready' },
  { id: 27, url: `${B}93d8ce6d4_image.png`, category: 'Squad', alt: 'Burberry boys' },
  { id: 28, url: `${B}d8a64add0_image.png`, category: 'Life', alt: 'Graduation day, we made it' },
  { id: 29, url: `${B}841333415_image.png`, category: 'Squad', alt: 'Best friend, day one' },
  { id: 30, url: `${B}654292d81_image.png`, category: 'Adventures', alt: 'Boat trip, open water' },
  { id: 31, url: `${B}acf11c96c_image.png`, category: 'Life', alt: 'Kabob spot hit different' },
  { id: 32, url: `${B}ea4ef8bc1_image.png`, category: 'Family', alt: 'Diggin in my butt' },
];

const categories = ['All', 'Life', 'Squad', 'Adventures', 'Drip', 'Family'];

export default function PhotoChannel({ onBack }: Props) {
  const [cat, setCat] = useState('All');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = photos.filter(p => cat === 'All' || p.category === cat);

  const navigate = useCallback((dir: -1 | 1) => {
    if (lightbox === null) return;
    const idx = filtered.findIndex(p => p.id === lightbox);
    const next = (idx + dir + filtered.length) % filtered.length;
    setLightbox(filtered[next].id);
  }, [lightbox, filtered]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, navigate]);

  const activePhoto = photos.find(p => p.id === lightbox);

  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(180deg, #dceef6 0%, #c4dfe9 100%)' }}>
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
        <h1 className="text-gray-700 font-bold text-xl">📷 Photo Channel</h1>
      </div>

      {/* Category Pills */}
      <div className="px-4 md:px-6 pb-3 flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cat === c
                ? 'bg-white text-gray-700 shadow-md'
                : 'bg-white/40 text-gray-500 hover:bg-white/60'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="px-4 md:px-6 pb-8 grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map(photo => (
          <button
            key={photo.id}
            onClick={() => setLightbox(photo.id)}
            className="rounded-2xl overflow-hidden aspect-[3/2] relative group transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              border: '2.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
              <span className="text-white text-[10px] font-bold p-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                {photo.alt}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button
            onClick={e => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(-1); }}
            className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(1); }}
            className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
          >
            <ChevronR className="w-6 h-6" />
          </button>
          <img
            src={activePhoto.url}
            alt={activePhoto.alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
