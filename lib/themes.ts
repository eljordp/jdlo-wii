export interface WiiTheme {
  id: string;
  name: string;
  bg: string;
  barBg: string;
  textColor: string;
  icon: string;
  description: string;
  musicUrl: string;
}

export const themes: WiiTheme[] = [
  {
    id: 'light',
    name: 'Classic Light',
    bg: 'linear-gradient(180deg, #dfe9f0 0%, #d2e0ea 40%, #c8d8e4 100%)',
    barBg: 'linear-gradient(180deg, rgba(245,248,252,0.97) 0%, rgba(220,232,242,0.97) 100%)',
    textColor: '#888',
    icon: '☀️',
    description: 'The original Wii experience',
    musicUrl: 'https://www.bensound.com/bensound-music/bensound-memories.mp3',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    bg: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    barBg: 'linear-gradient(180deg, rgba(20,20,40,0.95) 0%, rgba(15,30,60,0.95) 100%)',
    textColor: '#aaa',
    icon: '🌙',
    description: 'Easy on the eyes',
    musicUrl: 'https://www.bensound.com/bensound-music/bensound-slowmotion.mp3',
  },
  {
    id: 'pokemon',
    name: 'Pokémon',
    bg: 'radial-gradient(ellipse at center, #DC143C 0%, #FFD700 50%, #1E90FF 100%)',
    barBg: 'linear-gradient(180deg, rgba(255,215,0,0.95) 0%, rgba(220,20,60,0.95) 100%)',
    textColor: '#1a1a1a',
    icon: '⚡',
    description: 'Gotta catch em all',
    musicUrl: 'https://www.bensound.com/bensound-music/bensound-energy.mp3',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    bg: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 50%, #FF006E 100%)',
    barBg: 'linear-gradient(180deg, rgba(127,0,255,0.9) 0%, rgba(225,0,255,0.9) 100%)',
    textColor: '#00ffff',
    icon: '💜',
    description: 'Cyberpunk vibes',
    musicUrl: 'https://www.bensound.com/bensound-music/bensound-electrolounge.mp3',
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: 'linear-gradient(180deg, #134E5E 0%, #71B280 50%, #96E6B3 100%)',
    barBg: 'linear-gradient(180deg, rgba(19,78,94,0.95) 0%, rgba(113,178,128,0.95) 100%)',
    textColor: '#fff',
    icon: '🌲',
    description: 'Nature retreat',
    musicUrl: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: 'linear-gradient(180deg, #FF6B6B 0%, #FFE66D 50%, #FFA07A 100%)',
    barBg: 'linear-gradient(180deg, rgba(255,107,107,0.95) 0%, rgba(255,160,122,0.95) 100%)',
    textColor: '#fff',
    icon: '🌅',
    description: 'Golden hour forever',
    musicUrl: 'https://www.bensound.com/bensound-music/bensound-happiness.mp3',
  },
];

export const getTheme = (id: string): WiiTheme => {
  return themes.find(t => t.id === id) || themes[0];
};

export const channelTiles = [
  { id: 1, name: 'Wii Sports', icon: '🎮', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { id: 2, name: 'Mii Channel', icon: 'profile', gradient: 'linear-gradient(135deg, #4ade80, #22c55e)' },
  { id: 3, name: 'Photo Channel', icon: '📷', gradient: 'linear-gradient(135deg, #fb923c, #f97316)' },
  { id: 4, name: 'Wii Shop', icon: '🛒', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
  { id: 5, name: 'Forecast', icon: '🌤️', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  { id: 6, name: 'News', icon: '📰', gradient: 'linear-gradient(135deg, #16a34a, #15803d)' },
  { id: 7, name: 'Internet', icon: '🌐', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' },
  { id: 8, name: 'Settings', icon: '⚙️', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
];

export const PROFILE_PHOTO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69705b759c8dc226ae265997/7729d0e69_CoffeeBreak1.png';
