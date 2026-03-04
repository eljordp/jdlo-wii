'use client';

import { useState } from 'react';
import { ChevronLeft, ShoppingCart, X } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

interface Service { id: number; name: string; category: string; price: number; description: string }

const services: Service[] = [
  { id: 1, name: 'Landing Page', category: 'Web', price: 297, description: 'High-converting single page' },
  { id: 2, name: 'Full Website', category: 'Web', price: 797, description: 'Multi-page custom site' },
  { id: 3, name: 'E-Commerce Store', category: 'Web', price: 1197, description: 'Online store with payments' },
  { id: 4, name: 'Email Automation', category: 'Automation', price: 197, description: 'Drip sequences + flows' },
  { id: 5, name: 'AI Receptionist', category: 'Automation', price: 297, description: '24/7 AI call handler' },
  { id: 6, name: 'CRM Setup', category: 'Automation', price: 247, description: 'Pipeline + lead tracking' },
  { id: 7, name: 'Brand Strategy', category: 'Branding', price: 397, description: 'Positioning + messaging' },
  { id: 8, name: 'Logo & Identity', category: 'Branding', price: 197, description: 'Logo, colors, fonts' },
  { id: 9, name: 'Social Media Kit', category: 'Branding', price: 147, description: 'Templates + graphics' },
  { id: 10, name: 'Cold Outreach', category: 'Sales', price: 497, description: 'DM sequences that book calls' },
  { id: 11, name: 'Sales Script', category: 'Sales', price: 197, description: 'Proven closing framework' },
  { id: 12, name: 'Lead Qualifier', category: 'Sales', price: 247, description: 'Intake + vetting system' },
];

const packages = [
  { name: 'Starter Bundle', items: ['Landing Page', 'Email Automation', 'Brand Strategy'], savings: 200, emoji: '🌱' },
  { name: 'Growth Bundle', items: ['Full Website', 'CRM Setup', 'Cold Outreach'], savings: 350, emoji: '🚀' },
  { name: 'Full Stack Bundle', items: ['Full Website', 'AI Receptionist', 'CRM Setup', 'Cold Outreach', 'Brand Strategy'], savings: 600, emoji: '⚡' },
];

const categories = ['All', 'Web', 'Automation', 'Branding', 'Sales'];
const catEmoji: Record<string, string> = { Web: '🌐', Automation: '🤖', Branding: '🎨', Sales: '📈' };

export default function WiiShop({ onBack }: Props) {
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'asc' | 'desc'>('default');
  const [cart, setCart] = useState<{ service: Service; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = services
    .filter(s => category === 'All' || s.category === category)
    .sort((a, b) => sortBy === 'asc' ? a.price - b.price : sortBy === 'desc' ? b.price - a.price : 0);

  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(c => c.service.id === service.id);
      if (existing) return prev.map(c => c.service.id === service.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { service, qty: 1 }];
    });
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.service.id !== id));
  const total = cart.reduce((s, c) => s + c.service.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-md" style={{ background: 'rgba(102,126,234,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-lg">🛒 Wii Shop</h1>
          </div>
          <button onClick={() => setCartOpen(!cartOpen)} className="relative text-white bg-white/20 hover:bg-white/30 rounded-full p-2.5 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg">{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              category === c ? 'bg-white text-purple-600 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'
            }`}>
            {c}
          </button>
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'default' | 'asc' | 'desc')}
          className="ml-auto bg-white/20 text-white rounded-full px-3 py-1.5 text-xs font-bold outline-none cursor-pointer [&>option]:text-black">
          <option value="default">Sort</option>
          <option value="asc">Price ↑</option>
          <option value="desc">Price ↓</option>
        </select>
      </div>

      {/* Services */}
      <div className="px-4 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-1.5">
              <div>
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">{catEmoji[s.category]} {s.category}</span>
                <h3 className="text-gray-800 font-bold text-base">{s.name}</h3>
              </div>
              <span className="text-lg font-black text-green-600">${s.price}</span>
            </div>
            <p className="text-gray-500 text-xs mb-4">{s.description}</p>
            <button onClick={() => addToCart(s)}
              className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Packages */}
      <div className="px-4 pb-10">
        <h2 className="text-white font-bold text-xl mb-4">📦 Bundles — Save More</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map(pkg => {
            const items = pkg.items.map(name => services.find(s => s.name === name)!);
            const orig = items.reduce((sum, s) => sum + s.price, 0);
            return (
              <div key={pkg.name} className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg border-2 border-yellow-400 hover:scale-[1.02] transition-transform">
                <div className="text-2xl mb-2">{pkg.emoji}</div>
                <h3 className="text-gray-800 font-bold text-base mb-1">{pkg.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-600 font-black text-xl">${orig - pkg.savings}</span>
                  <span className="text-gray-400 line-through text-sm">${orig}</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 font-bold">-${pkg.savings}</span>
                </div>
                <ul className="text-gray-600 text-xs space-y-1 mb-4">
                  {pkg.items.map(i => <li key={i}>✓ {i}</li>)}
                </ul>
                <button onClick={() => items.forEach(s => addToCart(s))}
                  className="w-full py-2.5 rounded-xl bg-yellow-400 text-yellow-900 font-bold text-sm hover:bg-yellow-300 transition-colors">
                  Add Bundle
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 h-full w-[320px] max-w-[85vw] bg-white shadow-2xl overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-800 text-base">Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="hover:bg-gray-100 rounded-full p-1 transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {cart.length === 0 ? (
              <p className="p-8 text-gray-400 text-sm text-center">Your cart is empty</p>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.service.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-gray-800 font-bold text-sm">{item.service.name}</p>
                        <p className="text-gray-400 text-xs">${item.service.price} × {item.qty}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.service.id)} className="hover:bg-red-50 rounded-full p-1"><X className="w-4 h-4 text-red-400" /></button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t sticky bottom-0 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-black text-green-600 text-2xl">${total}</span>
                  </div>
                  <button className="w-full py-3 rounded-xl text-white font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
