'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight as ChevronR, X } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Photo { id: number; url: string; category: string; alt: string }

const photos: Photo[] = [
  { id: 1, url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop', category: 'Gaming', alt: 'Gaming setup' },
  { id: 2, url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop', category: 'Gaming', alt: 'Retro gaming' },
  { id: 3, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', category: 'Creative', alt: 'Creative workspace' },
  { id: 4, url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop', category: 'Creative', alt: 'Art supplies' },
  { id: 5, url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop', category: 'Nature', alt: 'Mountains' },
  { id: 6, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop', category: 'Nature', alt: 'Forest' },
  { id: 7, url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop', category: 'Urban', alt: 'City skyline' },
  { id: 8, url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=400&fit=crop', category: 'Urban', alt: 'Downtown' },
  { id: 9, url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop', category: 'Tech', alt: 'Circuit board' },
  { id: 10, url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop', category: 'Tech', alt: 'Laptop setup' },
  { id: 11, url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop', category: 'Gaming', alt: 'Esports' },
  { id: 12, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', category: 'Nature', alt: 'Sunset peaks' },
  { id: 13, url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', category: 'Tech', alt: 'Team working' },
  { id: 14, url: 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55?w=600&h=400&fit=crop', category: 'Creative', alt: 'Design tools' },
  { id: 15, url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop', category: 'Urban', alt: 'Night city' },
];

const categories = [
  { label: 'All 📸', value: 'All' },
  { label: 'Gaming 🎮', value: 'Gaming' },
  { label: 'Creative 🎨', value: 'Creative' },
  { label: 'Nature 🌿', value: 'Nature' },
  { label: 'Urban 🏙️', value: 'Urban' },
  { label: 'Tech 💻', value: 'Tech' },
];

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
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(59,130,246,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg">📷 Photo Channel</h1>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c.value} onClick={() => setCat(c.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              cat === c.value ? 'bg-white text-blue-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="px-4 pb-8 grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map(photo => (
          <button key={photo.id} onClick={() => setLightbox(photo.id)}
            className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all aspect-[3/2] relative group">
            <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
              <span className="text-white text-xs font-bold p-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">{photo.alt}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <button onClick={e => { e.stopPropagation(); navigate(-1); }}
            className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={e => { e.stopPropagation(); navigate(1); }}
            className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors">
            <ChevronR className="w-6 h-6" />
          </button>
          <img src={activePhoto.url.replace('w=600&h=400', 'w=1200&h=800')} alt={activePhoto.alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
