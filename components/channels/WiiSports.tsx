'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

type Sport = 'menu' | 'baseball' | 'basketball' | 'boxing' | 'tennis' | 'golf' | 'arcade';
type ArcadeGame = 'snake' | 'pacman';
type Difficulty = 'easy' | 'medium' | 'hard';

const sports = [
  { id: 'baseball' as Sport, name: 'Baseball', emoji: '⚾', color: 'from-red-500 to-red-600' },
  { id: 'basketball' as Sport, name: 'Basketball', emoji: '🏀', color: 'from-orange-500 to-orange-600' },
  { id: 'boxing' as Sport, name: 'Boxing', emoji: '🥊', color: 'from-red-600 to-red-800' },
  { id: 'tennis' as Sport, name: 'Tennis', emoji: '🎾', color: 'from-green-500 to-green-600' },
  { id: 'golf' as Sport, name: 'Golf', emoji: '⛳', color: 'from-emerald-500 to-emerald-700' },
  { id: 'arcade' as Sport, name: 'Arcade', emoji: '🕹️', color: 'from-purple-600 to-purple-800' },
];

// ═══════ BASEBALL ═══════
function Baseball({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const [inning, setInning] = useState(1);
  const [outs, setOuts] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [balls, setBalls] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [batting, setBatting] = useState(true);
  const [message, setMessage] = useState('You\'re up to bat!');
  const [gameOver, setGameOver] = useState(false);
  const maxInnings = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 3;
  const hitChance = difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.35 : 0.25;

  const swing = () => {
    if (gameOver) return;
    const rand = Math.random();
    if (rand < hitChance) {
      const runs = Math.random() < 0.2 ? 2 : 1;
      if (batting) {
        setPlayerScore(s => s + runs);
        setMessage(runs > 1 ? 'DOUBLE! 🔥' : 'Base hit! ⚾');
      } else {
        setCpuScore(s => s + runs);
        setMessage(runs > 1 ? 'CPU hits a double!' : 'CPU gets a hit');
      }
    } else if (rand < hitChance + 0.3) {
      setStrikes(s => {
        if (s + 1 >= 3) {
          setMessage(batting ? 'Strike three — OUT!' : 'Struck \'em out!');
          advanceOut();
          return 0;
        }
        setMessage('Strike!');
        return s + 1;
      });
    } else {
      setBalls(b => {
        if (b + 1 >= 4) {
          setMessage('Walk!');
          if (batting) setPlayerScore(s => s + 1); else setCpuScore(s => s + 1);
          return 0;
        }
        setMessage('Ball');
        return b + 1;
      });
    }
  };

  const advanceOut = () => {
    setStrikes(0); setBalls(0);
    setOuts(o => {
      if (o + 1 >= 3) {
        if (!batting) {
          if (inning >= maxInnings) { setGameOver(true); setMessage('Game Over!'); return 0; }
          setInning(i => i + 1); setBatting(true); setMessage('New inning — you\'re batting!');
        } else {
          setBatting(false); setMessage('Side retired — CPU is batting');
        }
        return 0;
      }
      return o + 1;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex gap-6 text-white">
        <div><p className="text-xs opacity-60">YOU</p><p className="text-3xl font-black">{playerScore}</p></div>
        <div><p className="text-xs opacity-60">INN</p><p className="text-3xl font-black">{inning}</p></div>
        <div><p className="text-xs opacity-60">CPU</p><p className="text-3xl font-black">{cpuScore}</p></div>
      </div>
      <div className="flex gap-4 text-white text-sm">
        <span>Outs: {outs}/3</span><span>Strikes: {strikes}</span><span>Balls: {balls}</span>
      </div>
      <p className="text-white font-bold text-lg min-h-[2rem]">{message}</p>
      <p className="text-white/60 text-xs">{batting ? 'You\'re batting' : 'CPU is batting'}</p>
      {!gameOver ? (
        <button onClick={swing} className="px-8 py-3 bg-white text-red-600 font-black rounded-xl text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg">
          {batting ? '⚾ Swing!' : '⚾ Pitch!'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-yellow-300 font-black text-xl">{playerScore > cpuScore ? 'YOU WIN! 🏆' : playerScore < cpuScore ? 'CPU Wins' : 'TIE!'}</p>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-colors">Back to Sports</button>
        </div>
      )}
    </div>
  );
}

// ═══════ BASKETBALL ═══════
function Basketball({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [power, setPower] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [message, setMessage] = useState('Click SHOOT at peak power!');
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setGameOver(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    if (!shooting) return;
    let start = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - start) % 2000;
      setPower(elapsed < 1000 ? elapsed / 10 : (2000 - elapsed) / 10);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shooting]);

  const shoot = () => {
    if (gameOver) return;
    if (!shooting) { setShooting(true); return; }
    setShooting(false);
    const accuracy = Math.abs(power - 75);
    const threshold = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 12;
    const made = accuracy < threshold;
    const points = power > 70 ? 3 : 2;
    if (playerTurn) {
      if (made) { setPlayerScore(s => s + points); setMessage(`${points}-pointer! 🏀🔥`); }
      else setMessage('Missed! 😤');
    } else {
      if (made) { setCpuScore(s => s + points); setMessage(`CPU scores ${points}!`); }
      else setMessage('CPU missed!');
    }
    setPlayerTurn(t => !t);
    setPower(0);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex gap-6 text-white">
        <div><p className="text-xs opacity-60">YOU</p><p className="text-3xl font-black">{playerScore}</p></div>
        <div><p className="text-xs opacity-60">TIME</p><p className="text-3xl font-black">{timeLeft}s</p></div>
        <div><p className="text-xs opacity-60">CPU</p><p className="text-3xl font-black">{cpuScore}</p></div>
      </div>
      {/* Power meter */}
      <div className="w-full max-w-xs">
        <div className="h-6 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-75" style={{
            width: `${power}%`,
            background: power > 65 && power < 85 ? '#22c55e' : power > 50 ? '#eab308' : '#ef4444'
          }} />
        </div>
        <p className="text-white/60 text-xs mt-1">Sweet spot: 65-85%</p>
      </div>
      <p className="text-white font-bold text-lg min-h-[2rem]">{message}</p>
      <p className="text-white/60 text-xs">{playerTurn ? 'Your shot' : 'CPU\'s shot'}</p>
      {!gameOver ? (
        <button onClick={shoot} className="px-8 py-3 bg-white text-orange-600 font-black rounded-xl text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg">
          🏀 {shooting ? 'RELEASE!' : 'Shoot!'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-yellow-300 font-black text-xl">{playerScore > cpuScore ? 'YOU WIN! 🏆' : playerScore < cpuScore ? 'CPU Wins' : 'TIE!'}</p>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30">Back to Sports</button>
        </div>
      )}
    </div>
  );
}

// ═══════ BOXING ═══════
function Boxing({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const [playerHP, setPlayerHP] = useState(100);
  const [cpuHP, setCpuHP] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [message, setMessage] = useState('Fight! 🥊');
  const [blocking, setBlocking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const cpuDmg = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 10 : 15;

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setStamina(s => Math.min(100, s + 5));
      // CPU attacks
      if (Math.random() < 0.4) {
        if (blocking) {
          setMessage('Blocked CPU attack! 🛡️');
        } else {
          const dmg = cpuDmg + Math.floor(Math.random() * 5);
          setPlayerHP(h => {
            const next = Math.max(0, h - dmg);
            if (next <= 0) { setGameOver(true); setMessage('KO! You lost...'); }
            else setMessage(`CPU hits for ${dmg}!`);
            return next;
          });
        }
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [blocking, gameOver, cpuDmg]);

  const attack = (type: 'jab' | 'hook' | 'special') => {
    if (gameOver) return;
    const cost = type === 'jab' ? 8 : type === 'hook' ? 15 : 30;
    if (stamina < cost) { setMessage('Not enough stamina!'); return; }
    setStamina(s => s - cost);
    setBlocking(false);
    const dmg = type === 'jab' ? 8 + Math.floor(Math.random() * 5) : type === 'hook' ? 15 + Math.floor(Math.random() * 8) : 25 + Math.floor(Math.random() * 15);
    setCpuHP(h => {
      const next = Math.max(0, h - dmg);
      if (next <= 0) { setGameOver(true); setMessage('KNOCKOUT! YOU WIN! 🏆'); }
      else setMessage(`${type.toUpperCase()} hits for ${dmg}! 💥`);
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      {/* HP Bars */}
      <div className="w-full max-w-sm space-y-2">
        <div>
          <div className="flex justify-between text-xs text-white mb-1"><span>YOU</span><span>{playerHP}%</span></div>
          <div className="h-5 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${playerHP}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-white mb-1"><span>CPU</span><span>{cpuHP}%</span></div>
          <div className="h-5 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${cpuHP}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-white/60 mb-1"><span>Stamina</span><span>{stamina}%</span></div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${stamina}%` }} /></div>
        </div>
      </div>
      <p className="text-white font-bold text-lg min-h-[2rem]">{message}</p>
      {!gameOver ? (
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => attack('jab')} className="px-5 py-2.5 bg-white text-red-600 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg text-sm">👊 Jab (8)</button>
          <button onClick={() => attack('hook')} className="px-5 py-2.5 bg-white text-red-700 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg text-sm">🥊 Hook (15)</button>
          <button onClick={() => setBlocking(b => !b)} className={`px-5 py-2.5 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg text-sm ${blocking ? 'bg-blue-400 text-white' : 'bg-white text-blue-600'}`}>🛡️ Block</button>
          <button onClick={() => attack('special')} className="px-5 py-2.5 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg text-sm">⚡ Special (30)</button>
        </div>
      ) : (
        <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30">Back to Sports</button>
      )}
    </div>
  );
}

// ═══════ TENNIS (Canvas Pong) ═══════
function Tennis({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState({ player: 0, cpu: 0 });
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({ playerY: 200, ballX: 300, ballY: 200, ballDX: 3, ballDY: 2, cpuY: 200, mouseY: 200 });

  const cpuSpeed = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3.5 : 5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 600, H = 400;
    canvas.width = W; canvas.height = H;
    const s = stateRef.current;
    let raf: number;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      s.mouseY = ((e.clientY - rect.top) / rect.height) * H;
    };
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      s.mouseY = ((e.touches[0].clientY - rect.top) / rect.height) * H;
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleTouch);

    const loop = () => {
      // Player paddle
      s.playerY += (s.mouseY - s.playerY) * 0.15;
      // CPU paddle
      const cpuTarget = s.ballY + (Math.random() - 0.5) * 30;
      if (s.cpuY < cpuTarget - 5) s.cpuY += cpuSpeed;
      if (s.cpuY > cpuTarget + 5) s.cpuY -= cpuSpeed;
      // Ball
      s.ballX += s.ballDX; s.ballY += s.ballDY;
      if (s.ballY <= 5 || s.ballY >= H - 5) s.ballDY *= -1;
      // Player paddle hit
      if (s.ballX <= 25 && s.ballX >= 15 && Math.abs(s.ballY - s.playerY) < 40) {
        s.ballDX = Math.abs(s.ballDX) * 1.05;
        s.ballDY += (s.ballY - s.playerY) * 0.1;
      }
      // CPU paddle hit
      if (s.ballX >= W - 25 && s.ballX <= W - 15 && Math.abs(s.ballY - s.cpuY) < 40) {
        s.ballDX = -Math.abs(s.ballDX) * 1.05;
        s.ballDY += (s.ballY - s.cpuY) * 0.1;
      }
      // Score
      if (s.ballX < 0) {
        setScores(p => {
          const next = { ...p, cpu: p.cpu + 1 };
          if (next.cpu >= 5) setGameOver(true);
          return next;
        });
        s.ballX = W / 2; s.ballY = H / 2; s.ballDX = 3; s.ballDY = 2;
      }
      if (s.ballX > W) {
        setScores(p => {
          const next = { ...p, player: p.player + 1 };
          if (next.player >= 5) setGameOver(true);
          return next;
        });
        s.ballX = W / 2; s.ballY = H / 2; s.ballDX = -3; s.ballDY = -2;
      }
      // Clamp speed
      s.ballDX = Math.max(-8, Math.min(8, s.ballDX));
      s.ballDY = Math.max(-6, Math.min(6, s.ballDY));

      // Draw
      ctx.fillStyle = '#1a5c2a'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
      // Paddles
      ctx.fillStyle = '#fff';
      ctx.fillRect(10, s.playerY - 35, 10, 70);
      ctx.fillRect(W - 20, s.cpuY - 35, 10, 70);
      // Ball
      ctx.beginPath(); ctx.arc(s.ballX, s.ballY, 6, 0, Math.PI * 2); ctx.fill();

      if (!gameOver) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('mousemove', handleMove); canvas.removeEventListener('touchmove', handleTouch); };
  }, [gameOver, cpuSpeed]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-8 text-white text-center">
        <div><p className="text-xs opacity-60">YOU</p><p className="text-2xl font-black">{scores.player}</p></div>
        <div><p className="text-xs opacity-60">CPU</p><p className="text-2xl font-black">{scores.cpu}</p></div>
      </div>
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[600px] aspect-[3/2] bg-green-900 touch-none" />
      <p className="text-white/60 text-xs">Move mouse or touch to control paddle • First to 5 wins</p>
      {gameOver && (
        <div className="space-y-2 text-center">
          <p className="text-yellow-300 font-black text-xl">{scores.player >= 5 ? 'YOU WIN! 🏆' : 'CPU Wins!'}</p>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30">Back to Sports</button>
        </div>
      )}
    </div>
  );
}

// ═══════ GOLF ═══════
function Golf({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [message, setMessage] = useState('Click and drag to aim & set power');
  const [scored, setScored] = useState(false);
  const maxHoles = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 9;
  const stateRef = useRef({ ballX: 100, ballY: 350, holeX: 450, holeY: 80, dragging: false, dragX: 0, dragY: 0, moving: false, vx: 0, vy: 0 });

  const resetHole = useCallback(() => {
    const s = stateRef.current;
    s.ballX = 80 + Math.random() * 60; s.ballY = 320 + Math.random() * 40;
    s.holeX = 350 + Math.random() * 150; s.holeY = 50 + Math.random() * 100;
    s.moving = false; s.vx = 0; s.vy = 0;
    setStrokes(0); setScored(false); setMessage('Click and drag to aim & set power');
  }, []);

  useEffect(() => { resetHole(); }, [hole, resetHole]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 550, H = 400;
    canvas.width = W; canvas.height = H;
    const s = stateRef.current;
    let raf: number;

    const getPos = (e: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect();
      return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
    };

    const onDown = (e: MouseEvent) => {
      if (s.moving) return;
      const p = getPos(e); s.dragging = true; s.dragX = p.x; s.dragY = p.y;
    };
    const onMove = (e: MouseEvent) => { if (s.dragging) { const p = getPos(e); s.dragX = p.x; s.dragY = p.y; } };
    const onUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      const dx = s.ballX - s.dragX, dy = s.ballY - s.dragY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) return;
      const power = Math.min(dist / 25, 10);
      s.vx = (dx / dist) * power; s.vy = (dy / dist) * power;
      s.moving = true;
      setStrokes(st => st + 1);
      setMessage('');
    };
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);

    const loop = () => {
      if (s.moving) {
        s.ballX += s.vx; s.ballY += s.vy;
        s.vx *= 0.985; s.vy *= 0.985;
        if (s.ballX < 5 || s.ballX > W - 5) s.vx *= -0.7;
        if (s.ballY < 5 || s.ballY > H - 5) s.vy *= -0.7;
        s.ballX = Math.max(5, Math.min(W - 5, s.ballX));
        s.ballY = Math.max(5, Math.min(H - 5, s.ballY));
        // Check hole
        const dist = Math.sqrt((s.ballX - s.holeX) ** 2 + (s.ballY - s.holeY) ** 2);
        if (dist < 15) { s.moving = false; setScored(true); setMessage(strokes === 0 ? 'HOLE IN ONE! 🏆' : 'In the hole! ⛳'); }
        if (Math.abs(s.vx) < 0.1 && Math.abs(s.vy) < 0.1) { s.moving = false; if (!scored) setMessage('Click and drag to aim'); }
      }

      // Draw
      ctx.fillStyle = '#2d7a3a'; ctx.fillRect(0, 0, W, H);
      // Fairway
      ctx.fillStyle = '#3a9e4f'; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 220, 160, 0, 0, Math.PI * 2); ctx.fill();
      // Hole
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(s.holeX, s.holeY, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4444'; ctx.fillRect(s.holeX - 1, s.holeY - 30, 2, 30);
      ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.moveTo(s.holeX + 1, s.holeY - 30); ctx.lineTo(s.holeX + 15, s.holeY - 25); ctx.lineTo(s.holeX + 1, s.holeY - 20); ctx.fill();
      // Ball
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.ballX, s.ballY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s.ballX, s.ballY, 5, 0, Math.PI * 2); ctx.stroke();
      // Aim line
      if (s.dragging) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(s.ballX, s.ballY); ctx.lineTo(s.ballX + (s.ballX - s.dragX), s.ballY + (s.ballY - s.dragY)); ctx.stroke();
        ctx.setLineDash([]);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('mousedown', onDown); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseup', onUp); };
  }, [hole, scored, strokes]);

  const nextHole = () => {
    setTotalStrokes(t => t + strokes);
    if (hole >= maxHoles) { setMessage(`Game Over! Total: ${totalStrokes + strokes} strokes`); return; }
    setHole(h => h + 1);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-6 text-white text-center">
        <div><p className="text-xs opacity-60">HOLE</p><p className="text-2xl font-black">{hole}/{maxHoles}</p></div>
        <div><p className="text-xs opacity-60">STROKES</p><p className="text-2xl font-black">{strokes}</p></div>
        <div><p className="text-xs opacity-60">TOTAL</p><p className="text-2xl font-black">{totalStrokes}</p></div>
      </div>
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[550px] aspect-[550/400] bg-green-800 touch-none cursor-crosshair" />
      <p className="text-white font-bold min-h-[1.5rem]">{message}</p>
      {scored && (
        hole < maxHoles
          ? <button onClick={nextHole} className="px-6 py-2 bg-white text-emerald-700 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg">Next Hole →</button>
          : <div className="space-y-2 text-center">
              <p className="text-yellow-300 font-black text-xl">Course Complete! Total: {totalStrokes + strokes} 🏌️</p>
              <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30">Back to Sports</button>
            </div>
      )}
    </div>
  );
}

// ═══════ SNAKE ═══════
function SnakeGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dirRef = useRef({ x: 1, y: 0 });
  const stateRef = useRef({ snake: [{ x: 5, y: 5 }], food: { x: 10, y: 10 }, running: true });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const GRID = 20, COLS = 20, ROWS = 20;
    canvas.width = COLS * GRID; canvas.height = ROWS * GRID;
    const s = stateRef.current;
    s.snake = [{ x: 5, y: 5 }]; s.food = { x: 10, y: 10 }; s.running = true;
    dirRef.current = { x: 1, y: 0 };

    const placeFood = () => {
      s.food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    };

    const handler = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if (e.key === 'ArrowUp' && d.y !== 1) dirRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && d.y !== -1) dirRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && d.x !== 1) dirRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && d.x !== -1) dirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handler);

    const interval = setInterval(() => {
      if (!s.running) return;
      const head = { x: s.snake[0].x + dirRef.current.x, y: s.snake[0].y + dirRef.current.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        s.running = false; setGameOver(true); return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) { setScore(sc => sc + 1); placeFood(); }
      else s.snake.pop();

      // Draw
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#22c55e';
      s.snake.forEach((seg, i) => {
        ctx.globalAlpha = 1 - i * 0.02;
        ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.food.x * GRID + 2, s.food.y * GRID + 2, GRID - 4, GRID - 4);
    }, 120);

    return () => { clearInterval(interval); window.removeEventListener('keydown', handler); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <p className="text-white font-bold">🐍 Snake — Score: {score}</p>
      <canvas ref={canvasRef} className="rounded-xl shadow-lg" style={{ width: 320, height: 320 }} />
      <p className="text-white/50 text-xs">Use arrow keys to move</p>
      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-1 md:hidden w-36">
        <div />
        <button onClick={() => { if (dirRef.current.y !== 1) dirRef.current = { x: 0, y: -1 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">↑</button>
        <div />
        <button onClick={() => { if (dirRef.current.x !== 1) dirRef.current = { x: -1, y: 0 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">←</button>
        <button onClick={() => { if (dirRef.current.y !== -1) dirRef.current = { x: 0, y: 1 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">↓</button>
        <button onClick={() => { if (dirRef.current.x !== -1) dirRef.current = { x: 1, y: 0 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">→</button>
      </div>
      {gameOver && (
        <div className="text-center space-y-2">
          <p className="text-red-400 font-bold">Game Over! Score: {score}</p>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30">Back to Arcade</button>
        </div>
      )}
    </div>
  );
}

// ═══════ PAC-MAN ═══════
function PacManGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dirRef = useRef({ x: 1, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const GRID = 20, COLS = 20, ROWS = 20;
    canvas.width = COLS * GRID; canvas.height = ROWS * GRID;

    // Simple maze - 0 = path, 1 = wall
    const maze: number[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) return 1;
        if (r % 4 === 2 && c > 1 && c < COLS - 2 && c % 3 !== 0) return 1;
        return 0;
      })
    );

    const dots: boolean[][] = maze.map(row => row.map(cell => cell === 0));
    let totalDots = dots.flat().filter(Boolean).length;
    const pac = { x: 1, y: 1 };
    const ghosts = [
      { x: 18, y: 1, color: '#ff0000', dx: 0, dy: 1 },
      { x: 1, y: 18, color: '#00ffff', dx: 1, dy: 0 },
      { x: 18, y: 18, color: '#ffb8ff', dx: -1, dy: 0 },
      { x: 10, y: 10, color: '#ffb852', dx: 0, dy: -1 },
    ];

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') dirRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown') dirRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft') dirRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight') dirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handler);

    let running = true;
    const interval = setInterval(() => {
      if (!running) return;

      // Move pac
      const nx = pac.x + dirRef.current.x, ny = pac.y + dirRef.current.y;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && maze[ny][nx] === 0) {
        pac.x = nx; pac.y = ny;
      }
      // Eat dot
      if (dots[pac.y][pac.x]) {
        dots[pac.y][pac.x] = false;
        totalDots--;
        setScore(s => s + 10);
        if (totalDots <= 0) { running = false; setGameOver(true); }
      }
      // Move ghosts
      ghosts.forEach(g => {
        // Simple AI: sometimes chase, sometimes random
        if (Math.random() < 0.3) {
          const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const valid = dirs.filter(d => {
            const gx = g.x + d.x, gy = g.y + d.y;
            return gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS && maze[gy][gx] === 0;
          });
          if (valid.length) {
            // Chase pac sometimes
            if (Math.random() < 0.5) {
              valid.sort((a, b) => {
                const da = Math.abs(pac.x - (g.x + a.x)) + Math.abs(pac.y - (g.y + a.y));
                const db = Math.abs(pac.x - (g.x + b.x)) + Math.abs(pac.y - (g.y + b.y));
                return da - db;
              });
            }
            const chosen = valid[0];
            g.dx = chosen.x; g.dy = chosen.y;
          }
        }
        const gnx = g.x + g.dx, gny = g.y + g.dy;
        if (gnx >= 0 && gnx < COLS && gny >= 0 && gny < ROWS && maze[gny][gnx] === 0) {
          g.x = gnx; g.y = gny;
        } else { g.dx *= -1; g.dy *= -1; }
      });
      // Ghost collision
      if (ghosts.some(g => g.x === pac.x && g.y === pac.y)) { running = false; setGameOver(true); }

      // Draw
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Walls
      maze.forEach((row, r) => row.forEach((cell, c) => {
        if (cell === 1) { ctx.fillStyle = '#1a1a8e'; ctx.fillRect(c * GRID, r * GRID, GRID, GRID); }
      }));
      // Dots
      dots.forEach((row, r) => row.forEach((dot, c) => {
        if (dot) { ctx.fillStyle = '#ffb8ff'; ctx.beginPath(); ctx.arc(c * GRID + GRID / 2, r * GRID + GRID / 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
      }));
      // Pac-Man
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      const mouthAngle = 0.3;
      const angle = Math.atan2(dirRef.current.y, dirRef.current.x);
      ctx.arc(pac.x * GRID + GRID / 2, pac.y * GRID + GRID / 2, GRID / 2 - 2, angle + mouthAngle, angle + Math.PI * 2 - mouthAngle);
      ctx.lineTo(pac.x * GRID + GRID / 2, pac.y * GRID + GRID / 2);
      ctx.fill();
      // Ghosts
      ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.fillRect(g.x * GRID + 2, g.y * GRID + 2, GRID - 4, GRID - 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(g.x * GRID + 5, g.y * GRID + 5, 4, 4);
        ctx.fillRect(g.x * GRID + 11, g.y * GRID + 5, 4, 4);
      });
    }, 150);

    return () => { clearInterval(interval); window.removeEventListener('keydown', handler); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <p className="text-white font-bold">PAC-MAN — Score: {score}</p>
      <canvas ref={canvasRef} className="rounded-xl shadow-lg" style={{ width: 320, height: 320 }} />
      <p className="text-white/50 text-xs">Use arrow keys to move</p>
      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-1 md:hidden w-36">
        <div />
        <button onClick={() => { dirRef.current = { x: 0, y: -1 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">↑</button>
        <div />
        <button onClick={() => { dirRef.current = { x: -1, y: 0 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">←</button>
        <button onClick={() => { dirRef.current = { x: 0, y: 1 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">↓</button>
        <button onClick={() => { dirRef.current = { x: 1, y: 0 }; }} className="bg-white/20 text-white rounded-lg py-2 text-center font-bold">→</button>
      </div>
      {gameOver && (
        <div className="text-center space-y-2">
          <p className="text-yellow-300 font-bold">{score > 500 ? 'Great run!' : 'Game Over!'} Score: {score}</p>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30">Back to Arcade</button>
        </div>
      )}
    </div>
  );
}

// ═══════ MAIN WII SPORTS COMPONENT ═══════
export default function WiiSports({ onBack }: Props) {
  const [sport, setSport] = useState<Sport>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [arcadeGame, setArcadeGame] = useState<ArcadeGame | null>(null);
  const [pendingSport, setPendingSport] = useState<Sport | null>(null);

  const selectSport = (s: Sport) => {
    if (s === 'arcade') { setSport('arcade'); return; }
    setPendingSport(s);
  };

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    if (pendingSport) setSport(pendingSport);
    setPendingSport(null);
  };

  const exitGame = () => { setSport('menu'); setDifficulty(null); setArcadeGame(null); setPendingSport(null); };

  // Difficulty selection
  if (pendingSport) {
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(59,130,246,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => setPendingSport(null)} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-lg">Select Difficulty</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 pt-16">
          <p className="text-white/80 text-sm mb-4">{sports.find(s => s.id === pendingSport)?.emoji} {sports.find(s => s.id === pendingSport)?.name}</p>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => startGame(d)}
              className="w-full max-w-xs px-6 py-4 bg-white/90 rounded-2xl font-bold text-gray-800 text-lg capitalize hover:scale-105 active:scale-95 transition-transform shadow-lg">
              {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Arcade sub-menu
  if (sport === 'arcade' && !arcadeGame) {
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(124,58,237,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={exitGame} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-lg">🕹️ Arcade</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 pt-16">
          <button onClick={() => setArcadeGame('snake')} className="w-full max-w-xs px-6 py-6 bg-white/90 rounded-2xl text-center hover:scale-105 active:scale-95 transition-transform shadow-lg">
            <span className="text-4xl block mb-2">🐍</span>
            <span className="font-bold text-gray-800 text-lg">Snake</span>
          </button>
          <button onClick={() => setArcadeGame('pacman')} className="w-full max-w-xs px-6 py-6 bg-white/90 rounded-2xl text-center hover:scale-105 active:scale-95 transition-transform shadow-lg">
            <span className="text-4xl block mb-2">👻</span>
            <span className="font-bold text-gray-800 text-lg">Pac-Man</span>
          </button>
        </div>
      </div>
    );
  }

  // Active arcade game
  if (sport === 'arcade' && arcadeGame) {
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f0f23)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(26,26,46,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => setArcadeGame(null)} className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
        {arcadeGame === 'snake' ? <SnakeGame onExit={() => setArcadeGame(null)} /> : <PacManGame onExit={() => setArcadeGame(null)} />}
      </div>
    );
  }

  // Active sport game
  if (sport !== 'menu' && difficulty) {
    const currentSport = sports.find(s => s.id === sport);
    return (
      <div className="h-full w-full overflow-auto" style={{ background: `linear-gradient(135deg, #1a1a2e, #16213e)` }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(26,26,46,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={exitGame} className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-lg">{currentSport?.emoji} {currentSport?.name}</h1>
            <span className="text-white/40 text-xs capitalize ml-auto">{difficulty}</span>
          </div>
        </div>
        {sport === 'baseball' && <Baseball difficulty={difficulty} onExit={exitGame} />}
        {sport === 'basketball' && <Basketball difficulty={difficulty} onExit={exitGame} />}
        {sport === 'boxing' && <Boxing difficulty={difficulty} onExit={exitGame} />}
        {sport === 'tennis' && <Tennis difficulty={difficulty} onExit={exitGame} />}
        {sport === 'golf' && <Golf difficulty={difficulty} onExit={exitGame} />}
      </div>
    );
  }

  // Sport selection menu
  return (
    <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
      <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(59,130,246,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-bold text-lg">🎮 Wii Sports</h1>
        </div>
      </div>

      <div className="px-4 py-6 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
        {sports.map(s => (
          <button key={s.id} onClick={() => selectSport(s.id)}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 text-center text-white hover:scale-105 active:scale-95 transition-transform shadow-lg`}>
            <span className="text-4xl md:text-5xl block mb-2">{s.emoji}</span>
            <span className="font-bold text-sm">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
