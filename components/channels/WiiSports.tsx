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

// Fielder positions (canvas coords W=600, H=420)
const FIELDERS = [
  { x: 300, y: 350, label: 'C' },
  { x: 415, y: 228, label: '1B' },
  { x: 358, y: 168, label: '2B' },
  { x: 242, y: 168, label: 'SS' },
  { x: 185, y: 228, label: '3B' },
  { x: 130, y: 115, label: 'LF' },
  { x: 300, y: 88, label: 'CF' },
  { x: 470, y: 115, label: 'RF' },
];
const BASE_POS = [
  { x: 410, y: 0.53 },  // 1B
  { x: 300, y: 0.32 },  // 2B
  { x: 190, y: 0.53 },  // 3B
];

// ═══════ BASEBALL (Canvas) ═══════
function Baseball({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ player: 0, cpu: 0, inning: 1, outs: 0, strikes: 0, balls: 0, batting: true, gameOver: false, message: 'Tap to swing!' });

  const maxInnings = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 9;
  const sweetSpot = difficulty === 'easy' ? 0.18 : difficulty === 'medium' ? 0.12 : 0.08;
  const pitchSpd = difficulty === 'easy' ? 0.012 : difficulty === 'medium' ? 0.016 : 0.022;
  const cpuContact = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.5 : 0.65;

  const gRef = useRef({
    phase: 'idle' as 'idle' | 'pitch' | 'hit_fly' | 'result',
    timer: 60, ballZ: 0, ballTargetX: 0,
    swingAnim: 0, pitchAnim: 0,
    hitBallT: 0, hitDestX: 0, hitDestY: 0,
    resultText: '', resultColor: '#fff',
    strikes: 0, balls: 0, outs: 0, inning: 1,
    playerScore: 0, cpuScore: 0, batting: true, gameOver: false,
    bases: [false, false, false] as boolean[],
    clicked: false, cpuDecided: false, cpuSwingZ: 0.8,
    activeFielder: -1, fielderAnimT: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 600, H = 420;
    canvas.width = W; canvas.height = H;
    const g = gRef.current;
    let raf: number;

    const syncHud = (msg: string) => {
      setHud({ player: g.playerScore, cpu: g.cpuScore, inning: g.inning, outs: g.outs, strikes: g.strikes, balls: g.balls, batting: g.batting, gameOver: g.gameOver, message: msg });
    };

    const startPitch = () => {
      g.phase = 'pitch'; g.ballZ = 0; g.swingAnim = 0; g.pitchAnim = 1;
      g.ballTargetX = W / 2 + (Math.random() - 0.5) * 70;
      g.clicked = false; g.cpuDecided = false;
      g.cpuSwingZ = 0.62 + Math.random() * 0.25;
    };

    const showResult = (text: string, color = '#fff') => {
      g.resultText = text; g.resultColor = color;
      g.phase = 'result'; g.timer = 55;
    };

    // Runner advancement: 1=single, 2=double, 3=triple, 4=HR
    const advanceRunners = (forward: number): number => {
      let runs = 0;
      const nb: boolean[] = [false, false, false];
      for (let i = 2; i >= 0; i--) {
        if (g.bases[i]) { const d = i + forward; if (d >= 3) runs++; else nb[d] = true; }
      }
      if (forward >= 4) runs++; else nb[forward - 1] = true;
      g.bases = nb;
      return runs;
    };

    const walkRunners = (): number => {
      let runs = 0;
      if (g.bases[0] && g.bases[1] && g.bases[2]) runs++;
      if (g.bases[0] && g.bases[1]) g.bases[2] = true;
      if (g.bases[0]) g.bases[1] = true;
      g.bases[0] = true;
      return runs;
    };

    const advanceOut = () => {
      g.outs++;
      if (g.outs >= 3) {
        g.outs = 0; g.strikes = 0; g.balls = 0;
        g.bases = [false, false, false];
        if (!g.batting) {
          if (g.inning >= maxInnings) { g.gameOver = true; return; }
          g.inning++; g.batting = true;
        } else {
          g.batting = false;
        }
      }
    };

    const advanceCount = (isStrike: boolean) => {
      if (isStrike) {
        g.strikes++;
        if (g.strikes >= 3) {
          g.strikes = 0; g.balls = 0;
          advanceOut();
          showResult(g.gameOver ? 'GAME OVER' : 'STRIKEOUT!', g.gameOver ? '#ffdd57' : '#ff6b6b');
          syncHud(g.gameOver ? 'Game Over!' : 'Strikeout!');
          return;
        }
      } else {
        g.balls++;
        if (g.balls >= 4) {
          g.balls = 0; g.strikes = 0;
          const runs = walkRunners();
          if (g.batting) g.playerScore += runs; else g.cpuScore += runs;
          showResult('WALK!', '#90ee90');
          syncHud(`Walk!${runs > 0 ? ` ${runs} scored!` : ''}`);
          return;
        }
      }
      g.phase = 'idle'; g.timer = 30;
      syncHud(isStrike ? `Strike ${g.strikes}` : `Ball ${g.balls}`);
    };

    const nearestFielder = (tx: number, ty: number, outfield: boolean): number => {
      const start = outfield ? 5 : 0; const end = outfield ? 8 : 5;
      let best = start, bestD = Infinity;
      for (let i = start; i < end; i++) {
        const dx = FIELDERS[i].x - tx, dy = FIELDERS[i].y - ty;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    };

    const processSwing = (timing: number, cpu: boolean) => {
      g.swingAnim = 1;
      const quality = 1 - timing / sweetSpot;
      const r = Math.random();
      const tag = cpu ? 'CPU ' : '';
      g.strikes = 0; g.balls = 0;

      if (quality > 0.7 && r < 0.2) {
        const runs = advanceRunners(4);
        if (g.batting) g.playerScore += runs; else g.cpuScore += runs;
        g.hitDestX = W / 2 + (Math.random() - 0.5) * 100; g.hitDestY = -50;
        g.activeFielder = -1;
        g.resultText = `${tag}HOME RUN!`; g.resultColor = '#ffdd57';
        syncHud(`${tag}HOME RUN! ${runs} run${runs !== 1 ? 's' : ''}!`);
      } else if (quality > 0.5 && r < 0.12) {
        const runs = advanceRunners(3);
        if (g.batting) g.playerScore += runs; else g.cpuScore += runs;
        g.hitDestX = Math.random() < 0.5 ? 80 : W - 80; g.hitDestY = H * 0.08;
        g.activeFielder = nearestFielder(g.hitDestX, g.hitDestY, true);
        g.resultText = `${tag}TRIPLE!`; g.resultColor = '#90ee90';
        syncHud(`${tag}Triple!${runs ? ` ${runs} scored!` : ''}`);
      } else if (quality > 0.3 && r < 0.3) {
        const runs = advanceRunners(2);
        if (g.batting) g.playerScore += runs; else g.cpuScore += runs;
        g.hitDestX = W / 2 + (Math.random() - 0.5) * 280; g.hitDestY = H * 0.1 + Math.random() * 40;
        g.activeFielder = nearestFielder(g.hitDestX, g.hitDestY, true);
        g.resultText = `${tag}DOUBLE!`; g.resultColor = '#87ceeb';
        syncHud(`${tag}Double!${runs ? ` ${runs} scored!` : ''}`);
      } else if (quality > 0.1 || r < 0.35) {
        const runs = advanceRunners(1);
        if (g.batting) g.playerScore += runs; else g.cpuScore += runs;
        g.hitDestX = W / 2 + (Math.random() - 0.5) * 200; g.hitDestY = H * 0.15 + Math.random() * 60;
        g.activeFielder = nearestFielder(g.hitDestX, g.hitDestY, Math.random() < 0.5);
        g.resultText = `${tag}SINGLE!`; g.resultColor = '#fff';
        syncHud(`${tag}Single!${runs ? ` ${runs} scored!` : ''}`);
      } else {
        advanceOut();
        const ground = Math.random() < 0.5;
        if (ground) {
          g.hitDestX = W / 2 + (Math.random() - 0.5) * 150; g.hitDestY = H * 0.45 + Math.random() * 25;
          g.activeFielder = nearestFielder(g.hitDestX, g.hitDestY, false);
        } else {
          g.hitDestX = W / 2 + (Math.random() - 0.5) * 200; g.hitDestY = H * 0.12 + Math.random() * 50;
          g.activeFielder = nearestFielder(g.hitDestX, g.hitDestY, true);
        }
        if (g.gameOver) {
          g.resultText = 'GAME OVER'; g.resultColor = '#ffdd57';
          syncHud('Game Over!');
        } else {
          g.resultText = `${tag}${ground ? 'GROUND' : 'FLY'} OUT`; g.resultColor = '#ff6b6b';
          syncHud(`${tag}${ground ? 'Ground' : 'Fly'} out!`);
        }
      }
      g.phase = 'hit_fly'; g.hitBallT = 0; g.fielderAnimT = 0;
    };

    const onClick = () => { g.clicked = true; };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onClick, { passive: true });

    // Init
    g.phase = 'idle'; g.timer = 40;
    g.strikes = 0; g.balls = 0; g.outs = 0; g.inning = 1;
    g.playerScore = 0; g.cpuScore = 0; g.batting = true; g.gameOver = false;
    g.bases = [false, false, false]; g.activeFielder = -1;
    syncHud('Step up to the plate!');

    const loop = () => {
      // ── UPDATE ──
      if (g.phase === 'idle') {
        g.timer--;
        if (g.timer <= 0 && !g.gameOver) startPitch();
      } else if (g.phase === 'pitch') {
        g.ballZ += pitchSpd;
        g.pitchAnim = Math.max(0, g.pitchAnim - 0.04);
        // Player swing
        if (g.batting && g.clicked) {
          g.clicked = false;
          const timing = Math.abs(g.ballZ - 0.82);
          if (timing < sweetSpot) { processSwing(timing, false); }
          else if (timing < sweetSpot * 2.5 && g.ballZ > 0.3) {
            g.swingAnim = 1;
            if (g.strikes < 2) g.strikes++;
            g.phase = 'idle'; g.timer = 25;
            syncHud(`Foul ball! (${g.strikes}-${g.balls})`);
          } else { g.swingAnim = 1; advanceCount(true); }
        }
        // CPU swing
        if (!g.batting && !g.cpuDecided && g.ballZ >= g.cpuSwingZ) {
          g.cpuDecided = true;
          if (Math.random() < cpuContact) {
            processSwing(Math.random() * sweetSpot * 1.5, true);
          } else if (Math.random() < 0.5) {
            g.swingAnim = 1; advanceCount(true);
          }
        }
        // Ball reaches plate
        if (g.ballZ >= 1.0 && g.phase === 'pitch') {
          const inZone = Math.abs(g.ballTargetX - W / 2) < 35;
          advanceCount(inZone);
        }
      } else if (g.phase === 'hit_fly') {
        g.hitBallT += 0.016;
        g.fielderAnimT = Math.min(1, g.fielderAnimT + 0.018);
        if (g.hitBallT >= 1) { g.phase = 'result'; g.timer = 60; g.activeFielder = -1; }
      } else if (g.phase === 'result') {
        g.timer--;
        if (g.timer <= 0) {
          if (g.gameOver) { syncHud('Game Over!'); return; }
          g.phase = 'idle'; g.timer = g.batting ? 40 : 28;
          syncHud(g.batting ? 'You\'re up!' : 'CPU at bat...');
        }
      }
      g.swingAnim = Math.max(0, g.swingAnim - 0.05);

      // ── DRAW ──
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
      sky.addColorStop(0, '#4a90d9'); sky.addColorStop(1, '#87ceeb');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Crowd/stands
      ctx.fillStyle = '#5a4a3a';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.28); ctx.quadraticCurveTo(W / 2, H * 0.18, W, H * 0.28);
      ctx.lineTo(W, H * 0.42); ctx.quadraticCurveTo(W / 2, H * 0.32, 0, H * 0.42);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 80; i++) {
        const cx = (i / 80) * W, cy = H * 0.3 + Math.sin(i * 1.5) * 18 + Math.cos(i * 2.3) * 6;
        ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Outfield grass
      const grass = ctx.createLinearGradient(0, H * 0.35, 0, H);
      grass.addColorStop(0, '#2e8b57'); grass.addColorStop(0.5, '#3cb371'); grass.addColorStop(1, '#228b22');
      ctx.fillStyle = grass;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.38); ctx.quadraticCurveTo(W / 2, H * 0.22, W, H * 0.38);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

      // Mowing lines
      ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 10;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath(); ctx.moveTo(0, H * 0.38 + i * 20); ctx.lineTo(W, H * 0.38 + i * 20); ctx.stroke();
      }

      // Infield dirt
      ctx.fillStyle = '#c4956a';
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.3); ctx.lineTo(W / 2 + 130, H * 0.56);
      ctx.lineTo(W / 2, H * 0.78); ctx.lineTo(W / 2 - 130, H * 0.56);
      ctx.closePath(); ctx.fill();

      // Infield grass
      ctx.fillStyle = '#3cb371';
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.36); ctx.lineTo(W / 2 + 85, H * 0.53);
      ctx.lineTo(W / 2, H * 0.67); ctx.lineTo(W / 2 - 85, H * 0.53);
      ctx.closePath(); ctx.fill();

      // Pitcher's mound
      ctx.fillStyle = '#b8845a';
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.44, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 8, H * 0.44 - 2, 16, 4);

      // Foul lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.78); ctx.lineTo(W / 2 - 300, H * 0.05);
      ctx.moveTo(W / 2, H * 0.78); ctx.lineTo(W / 2 + 300, H * 0.05);
      ctx.stroke();

      // Bases with runners
      const drawBase = (x: number, y: number, occupied: boolean) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
        ctx.fillStyle = occupied ? '#ffdd57' : '#fff';
        ctx.fillRect(-5, -5, 10, 10);
        if (occupied) { ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.strokeRect(-5, -5, 10, 10); }
        ctx.restore();
        if (occupied) {
          // Runner Mii
          ctx.fillStyle = '#cc3333'; ctx.fillRect(x - 3, y - 18, 6, 10);
          ctx.fillStyle = '#f5deb3';
          ctx.beginPath(); ctx.arc(x, y - 21, 4, 0, Math.PI * 2); ctx.fill();
        }
      };
      for (let i = 0; i < 3; i++) drawBase(BASE_POS[i].x, H * BASE_POS[i].y, g.bases[i]);

      // Home plate
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.8); ctx.lineTo(W / 2 + 9, H * 0.78);
      ctx.lineTo(W / 2 + 9, H * 0.76); ctx.lineTo(W / 2 - 9, H * 0.76);
      ctx.lineTo(W / 2 - 9, H * 0.78); ctx.closePath(); ctx.fill();

      // Draw fielders (Mii-style)
      const drawFielder = (fx: number, fy: number, sz: number, jersey: string) => {
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath(); ctx.arc(fx, fy - sz * 2.5, sz * 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = jersey;
        ctx.fillRect(fx - sz * 0.6, fy - sz * 1.5, sz * 1.2, sz * 1.8);
        ctx.fillStyle = '#444';
        ctx.fillRect(fx - sz * 0.45, fy + sz * 0.3, sz * 0.35, sz);
        ctx.fillRect(fx + sz * 0.1, fy + sz * 0.3, sz * 0.35, sz);
      };
      for (let i = 0; i < FIELDERS.length; i++) {
        let fx = FIELDERS[i].x, fy = FIELDERS[i].y;
        if (g.activeFielder === i && g.phase === 'hit_fly') {
          const t = Math.min(1, g.fielderAnimT * 1.5);
          fx += (g.hitDestX - fx) * t * 0.6;
          fy += (g.hitDestY - fy) * t * 0.6;
        }
        const sz = fy > H * 0.5 ? 4 : fy > H * 0.25 ? 3.5 : 3;
        drawFielder(fx, fy, sz, '#e8e8e8');
      }

      // Pitcher Mii
      const pY = H * 0.38;
      ctx.fillStyle = '#f5deb3';
      ctx.beginPath(); ctx.arc(W / 2, pY - 18, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(W / 2 - 5, pY - 11, 10, 16);
      ctx.fillStyle = '#555';
      ctx.fillRect(W / 2 - 5, pY + 5, 4, 10); ctx.fillRect(W / 2 + 1, pY + 5, 4, 10);
      if (g.pitchAnim > 0) {
        ctx.strokeStyle = '#f5deb3'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const arm = g.pitchAnim * Math.PI * 0.8;
        ctx.beginPath(); ctx.moveTo(W / 2 + 5, pY - 6);
        ctx.lineTo(W / 2 + 5 + Math.cos(arm) * 14, pY - 6 - Math.sin(arm) * 14);
        ctx.stroke(); ctx.lineCap = 'butt';
      }

      // Batter Mii
      const bX = W / 2 + 28, bY = H * 0.76;
      ctx.fillStyle = '#f5deb3';
      ctx.beginPath(); ctx.arc(bX, bY - 20, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(bX - 5, bY - 13, 10, 16);
      ctx.fillStyle = '#555';
      ctx.fillRect(bX - 5, bY + 3, 4, 10); ctx.fillRect(bX + 1, bY + 3, 4, 10);
      ctx.fillStyle = '#cc3333';
      ctx.beginPath(); ctx.arc(bX, bY - 22, 8, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const batAngle = -Math.PI * 0.35 + g.swingAnim * Math.PI * 0.9;
      ctx.beginPath(); ctx.moveTo(bX - 8, bY - 8);
      ctx.lineTo(bX - 8 + Math.cos(batAngle) * 32, bY - 8 + Math.sin(batAngle) * 32);
      ctx.stroke(); ctx.lineCap = 'butt';

      // Strike zone
      if (g.batting && (g.phase === 'idle' || g.phase === 'pitch')) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(W / 2 - 30, H * 0.66, 60, H * 0.1);
        ctx.setLineDash([]);
      }

      // Ball during pitch
      if (g.phase === 'pitch') {
        const bz = g.ballZ;
        const bsx = W / 2 + (g.ballTargetX - W / 2) * bz;
        const bsy = H * 0.36 + (H * 0.74 - H * 0.36) * bz;
        const br = 3 + bz * 7;
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.ellipse(bsx + 2, bsy + br + 3, br * 0.8, br * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(bsx, bsy, br, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bsx, bsy, br * 0.7, -0.5, 0.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(bsx, bsy, br * 0.7, Math.PI - 0.5, Math.PI + 0.5); ctx.stroke();
      }

      // Hit ball flying
      if (g.phase === 'hit_fly') {
        const t = g.hitBallT;
        const sx = W / 2, sy = H * 0.74;
        const bx = sx + (g.hitDestX - sx) * t;
        const by = sy + (g.hitDestY - sy) * t - Math.sin(t * Math.PI) * 120;
        const br = 10 - t * 7;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + bx) / 2, by - 40, bx, by); ctx.stroke();
        if (br > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.beginPath(); ctx.arc(bx + 1, by + br + 2, br * 0.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ── SCOREBOARD HUD ──
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 185, 5, 370, 48, 8); ctx.fill();
      // Scores
      ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = '#90ee90'; ctx.fillText(`YOU  ${g.playerScore}`, W / 2 - 170, 24);
      ctx.fillStyle = '#ff9b9b'; ctx.textAlign = 'right';
      ctx.fillText(`CPU  ${g.cpuScore}`, W / 2 + 170, 24);
      // Inning
      ctx.textAlign = 'center'; ctx.fillStyle = '#bbb'; ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(`INNING ${g.inning}`, W / 2, 20);

      // B-S-O indicators (dot style like real scoreboards)
      ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textAlign = 'left';
      const bsoX = W / 2 - 55, bsoY = 40;
      ctx.fillStyle = '#777'; ctx.fillText('B', bsoX, bsoY);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i < g.balls ? '#4ade80' : 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.arc(bsoX + 14 + i * 10, bsoY - 3, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#777'; ctx.fillText('S', bsoX + 58, bsoY);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < g.strikes ? '#f87171' : 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.arc(bsoX + 70 + i * 10, bsoY - 3, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#777'; ctx.fillText('O', bsoX + 100, bsoY);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < g.outs ? '#fbbf24' : 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.arc(bsoX + 113 + i * 10, bsoY - 3, 3.5, 0, Math.PI * 2); ctx.fill();
      }

      // Mini diamond (runners indicator in HUD)
      const dX = W / 2 + 153, dY = 38, dS = 8;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dX, dY - dS); ctx.lineTo(dX + dS, dY); ctx.lineTo(dX, dY + dS); ctx.lineTo(dX - dS, dY); ctx.closePath();
      ctx.stroke();
      const bPts: [number, number][] = [[dX + dS, dY], [dX, dY - dS], [dX - dS, dY]];
      bPts.forEach(([px, py], i) => {
        ctx.fillStyle = g.bases[i] ? '#ffdd57' : 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      });

      // Batting/Pitching label
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 38, H - 26, 76, 19, 5); ctx.fill();
      ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = g.batting ? '#90ee90' : '#87ceeb';
      ctx.fillText(g.batting ? 'BATTING' : 'PITCHING', W / 2, H - 13);

      // Result banner
      if ((g.phase === 'hit_fly' && g.hitBallT > 0.35) || g.phase === 'result') {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath(); ctx.roundRect(W / 2 - 120, H / 2 - 24, 240, 48, 10); ctx.fill();
        ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = g.resultColor;
        ctx.fillText(g.resultText, W / 2, H / 2 + 8);
      }

      if (!g.gameOver) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('click', onClick); canvas.removeEventListener('touchstart', onClick); };
  }, [difficulty, maxInnings, sweetSpot, pitchSpd, cpuContact]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[600px] aspect-[600/420] touch-none cursor-pointer" />
      <p className="text-white font-bold text-sm min-h-[1.5rem]">{hud.message}</p>
      <p className="text-white/50 text-xs">{hud.batting ? 'Click/tap to swing when the ball is close!' : 'Watch the CPU bat...'}</p>
      {hud.gameOver && (
        <div className="space-y-2 text-center">
          <p className="text-yellow-300 font-black text-xl">{hud.player > hud.cpu ? 'YOU WIN! 🏆' : hud.player < hud.cpu ? 'CPU Wins!' : 'TIE!'}</p>
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
