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

// Shot positions: x, y (canvas coords), point value
const SHOT_SPOTS = [
  { x: 260, y: 320, pts: 2, label: 'Free Throw' },
  { x: 180, y: 330, pts: 3, label: '3-Point' },
  { x: 100, y: 340, pts: 3, label: 'Deep Three' },
  { x: 320, y: 310, pts: 2, label: 'Mid-Range' },
  { x: 150, y: 350, pts: 3, label: 'Corner 3' },
];

// ═══════ BASKETBALL (Canvas) ═══════
function Basketball({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ player: 0, cpu: 0, time: 45, playerTurn: true, gameOver: false, message: 'Click to shoot!' });

  const threshold = difficulty === 'easy' ? 28 : difficulty === 'medium' ? 18 : 10;
  const cpuMake = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.7;
  const gameTime = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 40 : 30;

  const gRef = useRef({
    phase: 'idle' as 'idle' | 'aiming' | 'flying' | 'result',
    timer: 0, power: 0, powerDir: 1,
    ballT: 0, ballStartX: 0, ballStartY: 0,
    ballEndX: 0, ballEndY: 0, ballArcH: 0,
    made: false, resultText: '', resultColor: '#fff',
    playerScore: 0, cpuScore: 0, playerTurn: true,
    timeLeft: 0, gameOver: false, shotSpot: 0,
    rimBounce: 0, netAnim: 0, clicked: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 600, H = 420;
    canvas.width = W; canvas.height = H;
    const g = gRef.current;
    let raf: number, lastTime = Date.now();

    const rimX = 490, rimY = 168, bbX = 518;

    const syncHud = (msg: string) => {
      setHud({ player: g.playerScore, cpu: g.cpuScore, time: Math.ceil(Math.max(0, g.timeLeft)), playerTurn: g.playerTurn, gameOver: g.gameOver, message: msg });
    };

    const launchBall = (accuracy: number) => {
      const spot = SHOT_SPOTS[g.shotSpot];
      g.ballStartX = spot.x + 10; g.ballStartY = spot.y - 28;
      g.made = accuracy < threshold;
      if (g.made) {
        g.ballEndX = rimX - 12 + (Math.random() - 0.5) * 8;
        g.ballEndY = rimY;
        g.ballArcH = 130 + Math.random() * 30;
      } else {
        const miss = (accuracy > 0 ? 1 : -1) * (0.3 + Math.random() * 0.5);
        g.ballEndX = rimX - 12 + miss * 35;
        g.ballEndY = rimY + Math.abs(miss) * 20 - 15;
        g.ballArcH = 90 + Math.random() * 60;
      }
      g.phase = 'flying'; g.ballT = 0;
    };

    const shotResult = () => {
      const spot = SHOT_SPOTS[g.shotSpot];
      const tag = g.playerTurn ? '' : 'CPU ';
      if (g.made) {
        if (g.playerTurn) g.playerScore += spot.pts; else g.cpuScore += spot.pts;
        g.resultText = `${tag}${spot.pts === 3 ? 'THREE!' : 'BUCKET!'}`;
        g.resultColor = '#ffdd57'; g.netAnim = 1;
        syncHud(`${tag}${spot.pts}-pointer!`);
      } else {
        g.resultText = `${tag}MISS!`; g.resultColor = '#ff6b6b'; g.rimBounce = 1;
        syncHud(`${tag}Missed!`);
      }
      g.phase = 'result'; g.timer = 45;
    };

    const nextTurn = () => {
      g.playerTurn = !g.playerTurn;
      g.shotSpot = (g.shotSpot + 1) % SHOT_SPOTS.length;
      g.phase = 'idle'; g.timer = 25;
      g.rimBounce = 0; g.netAnim = 0;
      syncHud(g.playerTurn ? 'Your shot!' : 'CPU shooting...');
    };

    const onClick = () => { g.clicked = true; };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onClick, { passive: true });

    g.phase = 'idle'; g.timer = 30; g.playerScore = 0; g.cpuScore = 0;
    g.timeLeft = gameTime; g.playerTurn = true; g.gameOver = false; g.shotSpot = 0;
    syncHud('Click to shoot!');

    const loop = () => {
      const now = Date.now(); const dt = (now - lastTime) / 1000; lastTime = now;

      if (!g.gameOver) {
        g.timeLeft -= dt;
        if (g.timeLeft <= 0 && g.phase !== 'flying') {
          g.timeLeft = 0; g.gameOver = true;
          g.resultText = 'TIME!'; g.resultColor = '#ffdd57';
          g.phase = 'result'; g.timer = 70;
          syncHud('Time\'s up!');
        }
      }

      // UPDATE
      if (g.phase === 'idle') {
        g.timer--;
        if (g.timer <= 0 && !g.gameOver) {
          if (g.playerTurn) {
            g.phase = 'aiming'; g.power = 0; g.powerDir = 1;
            syncHud('Click when the bar is green!');
          } else {
            const acc = Math.random() < cpuMake ? Math.random() * threshold * 0.8 : threshold + Math.random() * 20;
            launchBall(acc);
          }
        }
        if (g.playerTurn && g.clicked && g.timer > 0) {
          g.clicked = false; g.timer = 0;
        }
      } else if (g.phase === 'aiming') {
        g.power += g.powerDir * 1.4;
        if (g.power >= 100) { g.power = 100; g.powerDir = -1; }
        if (g.power <= 0) { g.power = 0; g.powerDir = 1; }
        if (g.clicked) {
          g.clicked = false;
          launchBall(Math.abs(g.power - 75));
        }
      } else if (g.phase === 'flying') {
        g.ballT += 0.02;
        if (g.ballT >= 1) shotResult();
      } else if (g.phase === 'result') {
        g.timer--;
        g.rimBounce = Math.max(0, g.rimBounce - 0.04);
        g.netAnim = Math.max(0, g.netAnim - 0.025);
        if (g.timer <= 0) {
          if (g.gameOver) { syncHud('Game Over!'); return; }
          nextTurn();
        }
      }
      g.clicked = false;

      // ── DRAW ── (Wii Sports bright outdoor style)
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      sky.addColorStop(0, '#5baadf'); sky.addColorStop(1, '#9fd4f0');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      [[80, 50, 40], [250, 30, 30], [420, 55, 35], [550, 25, 25]].forEach(([cx, cy, r]) => {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx - r * 0.6, cy + 5, r * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r * 0.6, cy + 5, r * 0.7, 0, Math.PI * 2); ctx.fill();
      });

      // Trees/background
      ctx.fillStyle = '#4aad5a';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.38); ctx.quadraticCurveTo(W * 0.3, H * 0.3, W * 0.5, H * 0.36);
      ctx.quadraticCurveTo(W * 0.7, H * 0.3, W, H * 0.38);
      ctx.lineTo(W, H * 0.45); ctx.lineTo(0, H * 0.45); ctx.fill();

      // Court surface (clean bright hardwood)
      const court = ctx.createLinearGradient(0, H * 0.42, 0, H);
      court.addColorStop(0, '#dea85a'); court.addColorStop(0.5, '#cc9545'); court.addColorStop(1, '#bb8638');
      ctx.fillStyle = court;
      ctx.fillRect(0, H * 0.42, W, H * 0.58);

      // Wood plank lines
      ctx.strokeStyle = 'rgba(160,110,50,0.12)'; ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const y = H * 0.44 + i * 14;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Court lines (white, clean)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5;
      // Key/lane
      ctx.strokeRect(395, H * 0.44, 55, H * 0.56);
      // Free throw arc
      ctx.beginPath(); ctx.ellipse(422, H * 0.72, 55, 18, 0, Math.PI, 0); ctx.stroke();
      // 3-point arc
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rimX + 5, H * 0.8, 210, Math.PI * 0.62, Math.PI * 1.1); ctx.stroke();
      // Baseline
      ctx.beginPath(); ctx.moveTo(W - 10, H * 0.44); ctx.lineTo(W - 10, H); ctx.stroke();

      // Backboard + hoop (clean, simple)
      // Pole
      ctx.fillStyle = '#aaa';
      ctx.fillRect(bbX + 3, rimY + 55, 6, H * 0.56 - 55);
      // Backboard
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(bbX, rimY - 48, 8, 96);
      ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2;
      ctx.strokeRect(bbX, rimY - 48, 8, 96);
      // Red square target
      ctx.strokeStyle = '#e05050'; ctx.lineWidth = 2;
      ctx.strokeRect(bbX - 1, rimY - 18, 8, 36);

      // Rim
      const rBounce = Math.sin(g.rimBounce * Math.PI * 3) * g.rimBounce * 5;
      ctx.strokeStyle = '#e85d04'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bbX - 1, rimY + rBounce);
      ctx.lineTo(rimX - 28, rimY + rBounce);
      ctx.stroke();

      // Net (white, simple)
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
      const nSway = Math.sin(g.netAnim * Math.PI * 5) * g.netAnim * 8;
      for (let i = 0; i < 5; i++) {
        const nx = rimX - 27 + i * 5 + (bbX - rimX + 25) * (i / 4);
        ctx.beginPath();
        ctx.moveTo(nx, rimY + rBounce + 2);
        ctx.quadraticCurveTo(nx + nSway * (1 - i * 0.2), rimY + 25, nx + nSway * 0.3, rimY + 40);
        ctx.stroke();
      }

      // Shot spot marker (subtle circle on court)
      const spot = SHOT_SPOTS[g.shotSpot];
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(spot.x, spot.y, 16, 5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.ellipse(spot.x, spot.y, 16, 5, 0, 0, Math.PI * 2); ctx.fill();

      // Mii character
      const drawMii = (mx: number, my: number, jersey: string, shooting: boolean) => {
        ctx.fillStyle = '#444';
        ctx.fillRect(mx - 5, my + 4, 4, 12); ctx.fillRect(mx + 1, my + 4, 4, 12);
        ctx.fillStyle = jersey;
        ctx.fillRect(mx - 6, my - 12, 12, 17);
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath(); ctx.arc(mx, my - 18, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f5deb3'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        if (shooting) {
          ctx.beginPath(); ctx.moveTo(mx + 6, my - 8); ctx.lineTo(mx + 12, my - 24); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx - 6, my - 8); ctx.lineTo(mx - 2, my - 22); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(mx + 6, my - 6); ctx.lineTo(mx + 11, my + 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx - 6, my - 6); ctx.lineTo(mx - 11, my + 2); ctx.stroke();
        }
        ctx.lineCap = 'butt';
      };
      const isAiming = g.phase === 'aiming' || (g.phase === 'idle' && g.playerTurn);
      drawMii(spot.x, spot.y, g.playerTurn ? '#3b82f6' : '#ef4444', isAiming || g.phase === 'flying');

      // Ball
      const drawBall = (bx: number, by: number, r: number) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - r, by); ctx.lineTo(bx + r, by); ctx.stroke();
      };

      if (g.phase === 'aiming' || (g.phase === 'idle' && g.timer > 5)) {
        drawBall(spot.x + 10, spot.y - 26, 7);
      }
      if (g.phase === 'flying') {
        const t = g.ballT;
        const bx = g.ballStartX + (g.ballEndX - g.ballStartX) * t;
        const by = g.ballStartY + (g.ballEndY - g.ballStartY) * t - Math.sin(t * Math.PI) * g.ballArcH;
        const br = 7 - t * 2;
        if (br > 2) drawBall(bx, by, br);
      }
      if (g.phase === 'result' && g.made && g.timer > 22) {
        const dropT = Math.min(1, (45 - g.timer) / 12);
        drawBall(rimX - 14, rimY + dropT * 42, 5 - dropT * 2);
      }

      // Power meter (clean Wii-style)
      if (g.phase === 'aiming') {
        const pmX = 24, pmY = H * 0.2, pmH = 180, pmW = 14;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.roundRect(pmX - 3, pmY - 14, pmW + 6, pmH + 24, 8); ctx.fill();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(pmX - 3, pmY - 14, pmW + 6, pmH + 24, 8); ctx.stroke();
        // Track
        ctx.fillStyle = '#e5e5e5'; ctx.fillRect(pmX, pmY, pmW, pmH);
        // Sweet zone
        ctx.fillStyle = 'rgba(34,197,94,0.3)';
        ctx.fillRect(pmX, pmY + pmH * 0.15, pmW, pmH * 0.2);
        // Fill
        const fillH = (g.power / 100) * pmH;
        const barColor = g.power > 65 && g.power < 85 ? '#22c55e' : g.power > 45 ? '#eab308' : '#ef4444';
        ctx.fillStyle = barColor;
        ctx.fillRect(pmX, pmY + pmH - fillH, pmW, fillH);
        // Pointer
        ctx.fillStyle = '#333';
        const arrowY = pmY + pmH - fillH;
        ctx.beginPath();
        ctx.moveTo(pmX + pmW + 3, arrowY);
        ctx.lineTo(pmX + pmW + 10, arrowY - 5);
        ctx.lineTo(pmX + pmW + 10, arrowY + 5);
        ctx.closePath(); ctx.fill();
      }

      // ── SCOREBOARD (Wii-clean) ──
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 140, 6, 280, 34, 10); ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(W / 2 - 140, 6, 280, 34, 10); ctx.stroke();
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.fillStyle = '#3b82f6';
      ctx.fillText(`YOU  ${g.playerScore}`, W / 2 - 125, 28);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555'; ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`${Math.ceil(Math.max(0, g.timeLeft))}`, W / 2, 30);
      ctx.font = '8px system-ui, sans-serif'; ctx.fillStyle = '#999';
      ctx.fillText('SEC', W / 2, 17);
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.fillStyle = '#ef4444';
      ctx.fillText(`CPU  ${g.cpuScore}`, W / 2 + 125, 28);

      // Shot label
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 42, H - 26, 84, 18, 5); ctx.fill();
      ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#555';
      ctx.fillText(`${spot.pts}PT • ${g.playerTurn ? 'YOU' : 'CPU'}`, W / 2, H - 13);

      // Result banner
      if (g.phase === 'result' && g.timer > 12) {
        ctx.fillStyle = g.made ? 'rgba(34,197,94,0.85)' : 'rgba(220,50,50,0.8)';
        ctx.beginPath(); ctx.roundRect(W / 2 - 90, H / 2 - 22, 180, 44, 12); ctx.fill();
        ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(g.resultText, W / 2, H / 2 + 8);
      }

      if (!g.gameOver) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('click', onClick); canvas.removeEventListener('touchstart', onClick); };
  }, [difficulty, threshold, cpuMake, gameTime]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[600px] aspect-[600/420] touch-none cursor-pointer" />
      <p className="text-white font-bold text-sm min-h-[1.5rem]">{hud.message}</p>
      <p className="text-white/50 text-xs">{hud.playerTurn ? 'Click when the power bar is green!' : 'CPU shooting...'}</p>
      {hud.gameOver && (
        <div className="space-y-2 text-center">
          <p className="text-yellow-300 font-black text-xl">{hud.player > hud.cpu ? 'YOU WIN! 🏆' : hud.player < hud.cpu ? 'CPU Wins!' : 'TIE!'}</p>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-colors">Back to Sports</button>
        </div>
      )}
    </div>
  );
}

// ═══════ BOXING (Interactive Wii Sports Style) ═══════
interface BoxerState {
  x: number; y: number; hp: number; stamina: number;
  blocking: boolean; stunTimer: number; knockdownCount: number;
  punchAnim: { type: string; hand: 'L' | 'R'; timer: number } | null;
  hitAnim: number; dodgeDir: number; dodgeTimer: number;
  down: boolean; downTimer: number; getUpMashes: number;
  headBob: number; swayOffset: number;
}

function Boxing({ difficulty, onExit }: { difficulty: Difficulty; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    player: BoxerState; cpu: BoxerState;
    round: number; maxRounds: number; roundTimer: number; roundPhase: 'fight' | 'countdown' | 'roundEnd' | 'ko' | 'matchEnd';
    countdownNum: number; countdownTimer: number;
    message: string; messageTimer: number;
    keys: Set<string>; lastCpuAction: number;
    playerScore: number; cpuScore: number;
    koTarget: 'player' | 'cpu' | null;
    knockdownCountDisplay: number;
    slowMo: number;
    shakeTimer: number; shakeIntensity: number;
    comboCount: number; comboTimer: number;
    cpuPattern: number; cpuPatternTimer: number;
    introTimer: number;
  } | null>(null);
  const animRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  const W = 600, H = 440;
  const cpuAggression = difficulty === 'easy' ? 0.012 : difficulty === 'medium' ? 0.025 : 0.04;
  const cpuReaction = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.75;
  const cpuBlockChance = difficulty === 'easy' ? 0.15 : difficulty === 'medium' ? 0.3 : 0.5;
  const cpuDodgeChance = difficulty === 'easy' ? 0.05 : difficulty === 'medium' ? 0.12 : 0.22;

  function makeBoxer(x: number): BoxerState {
    return { x, y: H * 0.55, hp: 100, stamina: 100, blocking: false, stunTimer: 0,
      knockdownCount: 0, punchAnim: null, hitAnim: 0, dodgeDir: 0, dodgeTimer: 0,
      down: false, downTimer: 0, getUpMashes: 0, headBob: 0, swayOffset: 0 };
  }

  function initState() {
    stateRef.current = {
      player: makeBoxer(W * 0.35), cpu: makeBoxer(W * 0.65),
      round: 1, maxRounds: 3, roundTimer: 60 * 60, roundPhase: 'countdown',
      countdownNum: 3, countdownTimer: 60,
      message: '', messageTimer: 0,
      keys: new Set(), lastCpuAction: 0,
      playerScore: 0, cpuScore: 0,
      koTarget: null, knockdownCountDisplay: 0,
      slowMo: 0, shakeTimer: 0, shakeIntensity: 0,
      comboCount: 0, comboTimer: 0,
      cpuPattern: 0, cpuPatternTimer: 0,
      introTimer: 90,
    };
  }

  const punch = useCallback((attacker: BoxerState, defender: BoxerState, type: string, hand: 'L' | 'R') => {
    const s = stateRef.current;
    if (!s || attacker.stunTimer > 0 || attacker.down || defender.down) return false;
    if (attacker.punchAnim) return false;

    const costs: Record<string, number> = { jab: 6, hook: 12, uppercut: 20, body: 8 };
    const damages: Record<string, number> = { jab: 5, hook: 10, uppercut: 18, body: 7 };
    const stuns: Record<string, number> = { jab: 8, hook: 18, uppercut: 30, body: 12 };
    const ranges: Record<string, number> = { jab: 130, hook: 120, uppercut: 100, body: 115 };

    const cost = costs[type] || 6;
    if (attacker.stamina < cost) return false;
    attacker.stamina -= cost;
    attacker.punchAnim = { type, hand, timer: type === 'uppercut' ? 18 : type === 'hook' ? 14 : 10 };

    const dist = Math.abs(attacker.x - defender.x);
    const range = ranges[type] || 120;
    if (dist > range) return true; // whiff

    // Check dodge
    if (defender.dodgeTimer > 0) {
      s.message = 'Dodged!';
      s.messageTimer = 40;
      return true;
    }

    // Check block
    if (defender.blocking && type !== 'uppercut') {
      const blockDmg = Math.floor((damages[type] || 5) * 0.15);
      defender.hp = Math.max(0, defender.hp - blockDmg);
      defender.stamina = Math.max(0, defender.stamina - 4);
      s.message = 'BLOCKED!';
      s.messageTimer = 30;
      attacker.stunTimer = 6;
      s.shakeTimer = 4; s.shakeIntensity = 2;
      return true;
    }

    // Hit!
    const baseDmg = damages[type] || 5;
    const variance = Math.floor(Math.random() * 4) - 1;
    let dmg = baseDmg + variance;

    // Combo bonus
    if (s.comboTimer > 0 && attacker === s.player) {
      s.comboCount++;
      if (s.comboCount >= 3) dmg = Math.floor(dmg * 1.4);
    } else if (attacker === s.player) {
      s.comboCount = 1;
    }
    if (attacker === s.player) s.comboTimer = 45;

    defender.hp = Math.max(0, defender.hp - dmg);
    defender.hitAnim = 12;
    defender.stunTimer = stuns[type] || 8;
    s.shakeTimer = type === 'uppercut' ? 10 : type === 'hook' ? 7 : 4;
    s.shakeIntensity = type === 'uppercut' ? 6 : type === 'hook' ? 4 : 2;

    const hitMsgs: Record<string, string[]> = {
      jab: ['JAB!', 'Quick hit!', 'Snap!'],
      hook: ['HOOK!', 'Big swing!', 'POW!'],
      uppercut: ['UPPERCUT!', 'MASSIVE HIT!', 'BOOM!'],
      body: ['Body blow!', 'To the body!', 'OOF!'],
    };
    const msgs = hitMsgs[type] || ['HIT!'];
    s.message = `${msgs[Math.floor(Math.random() * msgs.length)]} -${dmg}`;
    s.messageTimer = 35;

    if (s.comboCount >= 3 && attacker === s.player) {
      s.message = `${s.comboCount}x COMBO! ${s.message}`;
    }

    // Check knockdown
    if (defender.hp <= 0 || (defender.hp < 20 && type === 'uppercut') || (defender.hp < 10 && type === 'hook')) {
      defender.down = true;
      defender.downTimer = 0;
      defender.getUpMashes = 0;
      defender.knockdownCount++;
      s.roundPhase = 'countdown';
      s.countdownNum = 1;
      s.countdownTimer = 50;
      s.koTarget = defender === s.player ? 'player' : 'cpu';
      s.knockdownCountDisplay = defender.knockdownCount;
      s.slowMo = 30;
      s.message = 'DOWN!';
      s.messageTimer = 80;
      s.shakeTimer = 20; s.shakeIntensity = 10;
    }

    return true;
  }, []);

  useEffect(() => {
    initState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      s.keys.add(e.key.toLowerCase());

      // Mash to get up from knockdown
      if (s.player.down && s.roundPhase === 'countdown' && s.koTarget === 'player') {
        s.player.getUpMashes++;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current?.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function drawRing(ctx: CanvasRenderingContext2D) {
      // Floor
      const floorGrad = ctx.createLinearGradient(0, H * 0.4, 0, H);
      floorGrad.addColorStop(0, '#4a90d9');
      floorGrad.addColorStop(1, '#2d5a8a');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, H * 0.4, W, H * 0.6);

      // Ring mat
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.48);
      ctx.lineTo(W * 0.92, H * 0.48);
      ctx.lineTo(W * 0.98, H * 0.95);
      ctx.lineTo(W * 0.02, H * 0.95);
      ctx.closePath();
      ctx.fill();

      // Ring canvas (blue center)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(W * 0.12, H * 0.50);
      ctx.lineTo(W * 0.88, H * 0.50);
      ctx.lineTo(W * 0.94, H * 0.92);
      ctx.lineTo(W * 0.06, H * 0.92);
      ctx.closePath();
      ctx.fill();

      // Ring lines
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.12, H * 0.50);
      ctx.lineTo(W * 0.88, H * 0.50);
      ctx.lineTo(W * 0.94, H * 0.92);
      ctx.lineTo(W * 0.06, H * 0.92);
      ctx.closePath();
      ctx.stroke();

      // Ropes
      const ropeColors = ['#fff', '#ff4444', '#fff'];
      for (let i = 0; i < 3; i++) {
        const t = 0.52 + i * 0.04;
        ctx.strokeStyle = ropeColors[i];
        ctx.lineWidth = 3;
        ctx.beginPath();
        // left side
        ctx.moveTo(W * 0.04, H * (t - 0.04));
        ctx.lineTo(W * 0.04, H * (t - 0.04));
        // top rope across
        const topY = H * (t - 0.02 + i * 0.005);
        ctx.moveTo(W * 0.04, topY);
        ctx.lineTo(W * 0.96, topY);
        ctx.stroke();
      }

      // Corner posts
      const posts = [
        [W * 0.08, H * 0.46], [W * 0.92, H * 0.46],
        [W * 0.04, H * 0.93], [W * 0.96, H * 0.93]
      ];
      for (const [px, py] of posts) {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(px - 4, py - 30, 8, 30);
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(px, py - 30, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Background - crowd suggestion
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.48);
      bgGrad.addColorStop(0, '#1a1a2e');
      bgGrad.addColorStop(0.5, '#16213e');
      bgGrad.addColorStop(1, '#0f3460');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H * 0.48);

      // Crowd dots
      for (let i = 0; i < 80; i++) {
        const cx = (i * 37 + 13) % W;
        const cy = H * 0.05 + ((i * 23 + 7) % (H * 0.38));
        const size = 3 + (i % 3);
        ctx.fillStyle = `hsl(${(i * 47) % 360}, 60%, ${50 + (i % 20)}%)`;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lights
      for (let i = 0; i < 3; i++) {
        const lx = W * 0.25 + i * W * 0.25;
        ctx.fillStyle = 'rgba(255,255,200,0.15)';
        ctx.beginPath();
        ctx.arc(lx, 10, 60, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBoxer(ctx: CanvasRenderingContext2D, boxer: BoxerState, isPlayer: boolean, s: NonNullable<typeof stateRef.current>) {
      ctx.save();
      const facing = isPlayer ? 1 : -1;
      let bx = boxer.x;
      let by = boxer.y;

      // Dodge offset
      if (boxer.dodgeTimer > 0) {
        bx += boxer.dodgeDir * 25 * (boxer.dodgeTimer / 15);
        by -= 5;
      }

      // Hit reaction
      if (boxer.hitAnim > 0) {
        bx += facing * -6 * (boxer.hitAnim / 12);
      }

      // Sway
      const sway = Math.sin(Date.now() / 800 + (isPlayer ? 0 : 3)) * 2;
      bx += sway;

      // Knockdown
      if (boxer.down) {
        const fallProgress = Math.min(1, boxer.downTimer / 30);
        by += fallProgress * 60;
        ctx.globalAlpha = 0.6 + 0.4 * (1 - fallProgress);
        // Draw fallen boxer
        ctx.translate(bx, by);
        ctx.rotate(facing * fallProgress * Math.PI * 0.4);
        ctx.translate(-bx, -by);
      }

      const skinColor = isPlayer ? '#f4c089' : '#8b6f47';
      const gloveColor = isPlayer ? '#ef4444' : '#3b82f6';
      const shortsColor = isPlayer ? '#22c55e' : '#a855f7';
      const headSize = 22;

      // Body
      ctx.fillStyle = skinColor;
      ctx.fillRect(bx - 12, by - 10, 24, 35);

      // Shorts
      ctx.fillStyle = shortsColor;
      ctx.fillRect(bx - 14, by + 20, 28, 18);
      // Shorts white stripe
      ctx.fillStyle = '#fff';
      ctx.fillRect(bx - 14, by + 20, 28, 3);

      // Legs
      ctx.fillStyle = skinColor;
      ctx.fillRect(bx - 10, by + 38, 8, 25);
      ctx.fillRect(bx + 2, by + 38, 8, 25);

      // Shoes
      ctx.fillStyle = '#333';
      ctx.fillRect(bx - 12, by + 60, 12, 6);
      ctx.fillRect(bx, by + 60, 12, 6);

      // Head
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(bx, by - 22, headSize, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = isPlayer ? '#4a3728' : '#1a1a1a';
      ctx.beginPath();
      ctx.arc(bx, by - 28, headSize - 4, Math.PI, Math.PI * 2);
      ctx.fill();

      // Eyes
      const eyeOff = facing * 4;
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(bx + eyeOff - 6, by - 24, 2.5, 0, Math.PI * 2);
      ctx.arc(bx + eyeOff + 6, by - 24, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      if (boxer.hitAnim > 0) {
        ctx.beginPath();
        ctx.arc(bx + eyeOff, by - 14, 4, 0, Math.PI);
        ctx.stroke();
      } else if (boxer.blocking) {
        ctx.fillStyle = '#333';
        ctx.fillRect(bx + eyeOff - 3, by - 16, 6, 2);
      } else {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(bx + eyeOff, by - 15, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gloves
      const gloveSize = 14;
      let lGloveX = bx - facing * 20;
      let lGloveY = by;
      let rGloveX = bx - facing * 20;
      let rGloveY = by + 12;

      if (boxer.blocking) {
        lGloveX = bx + facing * 8;
        lGloveY = by - 12;
        rGloveX = bx + facing * 8;
        rGloveY = by + 2;
      } else if (boxer.punchAnim) {
        const pa = boxer.punchAnim;
        const progress = 1 - (pa.timer / (pa.type === 'uppercut' ? 18 : pa.type === 'hook' ? 14 : 10));
        const punchExtend = Math.sin(progress * Math.PI);

        if (pa.hand === 'L' || pa.type === 'hook') {
          if (pa.type === 'jab') {
            lGloveX = bx + facing * (20 + punchExtend * 55);
            lGloveY = by - 8;
          } else if (pa.type === 'hook') {
            lGloveX = bx + facing * (15 + punchExtend * 45);
            lGloveY = by - 5 - punchExtend * 10;
          } else if (pa.type === 'uppercut') {
            lGloveX = bx + facing * (10 + punchExtend * 40);
            lGloveY = by + 10 - punchExtend * 40;
          } else {
            lGloveX = bx + facing * (20 + punchExtend * 50);
            lGloveY = by + 10;
          }
        }
        if (pa.hand === 'R' || pa.type === 'uppercut') {
          if (pa.type === 'jab') {
            rGloveX = bx + facing * (20 + punchExtend * 55);
            rGloveY = by + 4;
          } else if (pa.type === 'uppercut') {
            rGloveX = bx + facing * (10 + punchExtend * 40);
            rGloveY = by + 15 - punchExtend * 45;
          } else {
            rGloveX = bx + facing * (15 + punchExtend * 45);
            rGloveY = by + 8;
          }
        }
      } else {
        // Idle stance with slight bob
        const bob = Math.sin(Date.now() / 500 + (isPlayer ? 0 : 2)) * 3;
        lGloveX = bx + facing * 22;
        lGloveY = by - 10 + bob;
        rGloveX = bx + facing * 18;
        rGloveY = by + 5 + bob;
      }

      // Draw gloves with shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.arc(lGloveX + 2, lGloveY + 2, gloveSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rGloveX + 2, rGloveY + 2, gloveSize, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = gloveColor;
      ctx.beginPath(); ctx.arc(lGloveX, lGloveY, gloveSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rGloveX, rGloveY, gloveSize, 0, Math.PI * 2); ctx.fill();

      // Glove highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(lGloveX - 3, lGloveY - 3, gloveSize * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rGloveX - 3, rGloveY - 3, gloveSize * 0.5, 0, Math.PI * 2); ctx.fill();

      // Arms connecting to gloves
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx + facing * 10, by - 5);
      ctx.lineTo(lGloveX, lGloveY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + facing * 10, by + 8);
      ctx.lineTo(rGloveX, rGloveY);
      ctx.stroke();

      // Blocking shield effect
      if (boxer.blocking && !boxer.down) {
        ctx.strokeStyle = 'rgba(100,180,255,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx + facing * 12, by - 5, 30, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }

      // Hit flash
      if (boxer.hitAnim > 8) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(bx, by - 10, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars when stunned
      if (boxer.stunTimer > 15) {
        for (let i = 0; i < 3; i++) {
          const angle = Date.now() / 200 + i * (Math.PI * 2 / 3);
          const sx = bx + Math.cos(angle) * 28;
          const sy = by - 40 + Math.sin(angle) * 8;
          ctx.fillStyle = '#ffd700';
          ctx.font = '12px sans-serif';
          ctx.fillText('★', sx, sy);
        }
      }

      ctx.restore();
    }

    function drawHUD(ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) {
      // Player HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(15, 12, 182, 22);
      const pHpPct = s.player.hp / 100;
      const pHpColor = pHpPct > 0.5 ? '#22c55e' : pHpPct > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillStyle = pHpColor;
      ctx.fillRect(17, 14, 178 * pHpPct, 18);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 12, 182, 22);

      // CPU HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(W - 197, 12, 182, 22);
      const cHpPct = s.cpu.hp / 100;
      const cHpColor = cHpPct > 0.5 ? '#22c55e' : cHpPct > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillStyle = cHpColor;
      ctx.fillRect(W - 195, 14, 178 * cHpPct, 18);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(W - 197, 12, 182, 22);

      // Labels
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('YOU', 18, 27);
      ctx.textAlign = 'right';
      ctx.fillText('CPU', W - 18, 27);

      // Stamina bar (player)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(15, 38, 120, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(16, 39, 118 * (s.player.stamina / 100), 8);
      ctx.fillStyle = '#fff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('STA', 17, 47);

      // Round info
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Round ${s.round}/${s.maxRounds}`, W / 2, 25);

      // Timer
      const secs = Math.ceil(s.roundTimer / 60);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = secs <= 10 ? '#ef4444' : '#fff';
      ctx.fillText(`${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`, W / 2, 42);

      // Score
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#ccc';
      ctx.fillText(`Score: ${s.playerScore} - ${s.cpuScore}`, W / 2, 56);

      // Combo counter
      if (s.comboCount >= 2 && s.comboTimer > 0) {
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`${s.comboCount}x COMBO!`, W / 2, H * 0.42);
      }

      // Message
      if (s.messageTimer > 0) {
        const alpha = Math.min(1, s.messageTimer / 15);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(s.message, W / 2, H * 0.38);
        ctx.fillText(s.message, W / 2, H * 0.38);
        ctx.globalAlpha = 1;
      }

      // Knockdown count
      if (s.roundPhase === 'countdown' && s.koTarget) {
        ctx.font = 'bold 64px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.textAlign = 'center';
        ctx.strokeText(`${s.countdownNum}`, W / 2, H * 0.55);
        ctx.fillText(`${s.countdownNum}`, W / 2, H * 0.55);

        // Mash prompt for player
        if (s.koTarget === 'player') {
          const flashAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
          ctx.globalAlpha = flashAlpha;
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('MASH ANY KEY TO GET UP!', W / 2, H * 0.65);
          ctx.font = '13px sans-serif';
          ctx.fillText(`Mashes: ${s.player.getUpMashes} / ${5 + s.player.knockdownCount * 3}`, W / 2, H * 0.70);
          ctx.globalAlpha = 1;
        }
      }

      // Match end
      if (s.roundPhase === 'matchEnd') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        if (s.koTarget) {
          ctx.fillText(s.koTarget === 'cpu' ? 'KNOCKOUT! YOU WIN!' : 'KO! YOU LOSE...', W / 2, H * 0.4);
        } else {
          ctx.fillText(s.playerScore > s.cpuScore ? 'DECISION: YOU WIN!' : s.cpuScore > s.playerScore ? 'DECISION: CPU WINS!' : 'DRAW!', W / 2, H * 0.4);
        }
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Final Score: ${s.playerScore} - ${s.cpuScore}`, W / 2, H * 0.5);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Press ENTER or click to continue', W / 2, H * 0.62);
      }

      // Round start
      if (s.roundPhase === 'countdown' && !s.koTarget) {
        ctx.font = 'bold 56px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.textAlign = 'center';
        const text = s.countdownNum > 0 ? `${s.countdownNum}` : 'FIGHT!';
        ctx.strokeText(text, W / 2, H * 0.5);
        ctx.fillText(text, W / 2, H * 0.5);
      }

      // Controls hint
      if (s.introTimer > 0) {
        const alpha = Math.min(1, s.introTimer / 30);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(W * 0.1, H * 0.72, W * 0.8, H * 0.22);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CONTROLS', W / 2, H * 0.78);
        ctx.font = '11px sans-serif';
        ctx.fillText('J/K = Left/Right Jab | H = Hook | U = Uppercut | B = Body', W / 2, H * 0.83);
        ctx.fillText('A/D = Move | SPACE = Block | Q/E = Dodge | W = Forward', W / 2, H * 0.88);
        ctx.fillText('Or use the buttons below!', W / 2, H * 0.93);
        ctx.globalAlpha = 1;
      }
    }

    function updateCPU(s: NonNullable<typeof stateRef.current>) {
      const cpu = s.cpu;
      const player = s.player;
      if (cpu.down || player.down || s.roundPhase !== 'fight') return;

      const dist = Math.abs(cpu.x - player.x);

      // Movement AI
      if (dist > 140) {
        cpu.x += cpu.x > player.x ? -1.5 : 1.5;
      } else if (dist < 80) {
        cpu.x += cpu.x > player.x ? 1 : -1;
      }

      // Blocking AI - block when player is punching
      if (player.punchAnim && Math.random() < cpuBlockChance) {
        cpu.blocking = true;
      } else if (!player.punchAnim && cpu.blocking && Math.random() < 0.1) {
        cpu.blocking = false;
      }

      // Dodge AI
      if (player.punchAnim && player.punchAnim.timer > 5 && Math.random() < cpuDodgeChance && cpu.dodgeTimer <= 0) {
        cpu.dodgeDir = Math.random() < 0.5 ? -1 : 1;
        cpu.dodgeTimer = 15;
        cpu.blocking = false;
      }

      // Attack AI
      if (cpu.stunTimer <= 0 && !cpu.punchAnim && !cpu.blocking && dist < 135) {
        const attackRoll = Math.random();
        if (attackRoll < cpuAggression) {
          cpu.blocking = false;
          const r = Math.random();
          const hand: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';
          if (r < 0.4) punch(cpu, player, 'jab', hand);
          else if (r < 0.65) punch(cpu, player, 'hook', hand);
          else if (r < 0.8) punch(cpu, player, 'body', hand);
          else if (cpu.stamina > 25) punch(cpu, player, 'uppercut', hand);
          else punch(cpu, player, 'jab', hand);
        }
      }

      // Pattern changes
      s.cpuPatternTimer--;
      if (s.cpuPatternTimer <= 0) {
        s.cpuPattern = Math.floor(Math.random() * 3);
        s.cpuPatternTimer = 120 + Math.floor(Math.random() * 180);
      }
    }

    function update() {
      const s = stateRef.current;
      if (!s) return;

      // Intro timer
      if (s.introTimer > 0) s.introTimer--;

      // Slow mo
      if (s.slowMo > 0) {
        s.slowMo--;
        if (s.slowMo % 2 !== 0) return;
      }

      // Shake decay
      if (s.shakeTimer > 0) s.shakeTimer--;

      // Message timer
      if (s.messageTimer > 0) s.messageTimer--;

      // Combo timer
      if (s.comboTimer > 0) {
        s.comboTimer--;
        if (s.comboTimer <= 0) s.comboCount = 0;
      }

      // Round countdown (start of round)
      if (s.roundPhase === 'countdown' && !s.koTarget) {
        s.countdownTimer--;
        if (s.countdownTimer <= 0) {
          if (s.countdownNum <= 0) {
            s.roundPhase = 'fight';
          } else {
            s.countdownNum--;
            s.countdownTimer = s.countdownNum > 0 ? 50 : 40;
          }
        }
        return;
      }

      // Knockdown countdown
      if (s.roundPhase === 'countdown' && s.koTarget) {
        const downed = s.koTarget === 'player' ? s.player : s.cpu;
        downed.downTimer++;

        s.countdownTimer--;
        if (s.countdownTimer <= 0) {
          s.countdownNum++;
          s.countdownTimer = 50;

          // Check get up
          const mashNeeded = 5 + downed.knockdownCount * 3;
          const cpuGetsUp = s.koTarget === 'cpu' && downed.hp > 0 && Math.random() < (0.7 - downed.knockdownCount * 0.2);

          if (s.koTarget === 'player' && downed.getUpMashes >= mashNeeded && downed.hp > 0) {
            // Player gets up!
            downed.down = false;
            downed.hp = Math.max(downed.hp, 15);
            downed.stamina = 30;
            s.roundPhase = 'fight';
            s.koTarget = null;
            s.message = "You're back up!";
            s.messageTimer = 50;
          } else if (cpuGetsUp && s.countdownNum >= 4) {
            downed.down = false;
            downed.hp = Math.max(downed.hp, 10);
            downed.stamina = 20;
            s.roundPhase = 'fight';
            s.koTarget = null;
            s.message = 'CPU gets up!';
            s.messageTimer = 50;
          }

          // KO at 10
          if (s.countdownNum >= 10) {
            s.roundPhase = 'matchEnd';
            s.message = s.koTarget === 'cpu' ? 'KNOCKOUT!' : 'KO...';
            s.messageTimer = 120;
            if (s.koTarget === 'cpu') s.playerScore += 3;
            else s.cpuScore += 3;
          }
        }
        return;
      }

      // Round end
      if (s.roundPhase === 'roundEnd') {
        s.countdownTimer--;
        if (s.countdownTimer <= 0) {
          // Score round
          const pDmgDealt = 100 - s.cpu.hp;
          const cDmgDealt = 100 - s.player.hp;
          if (pDmgDealt > cDmgDealt) s.playerScore++;
          else if (cDmgDealt > pDmgDealt) s.cpuScore++;

          if (s.round >= s.maxRounds) {
            s.roundPhase = 'matchEnd';
            s.koTarget = null;
            forceUpdate(n => n + 1);
            return;
          }

          // Next round
          s.round++;
          s.player = makeBoxer(W * 0.35);
          s.cpu = makeBoxer(W * 0.65);
          s.player.knockdownCount = stateRef.current!.player.knockdownCount;
          s.cpu.knockdownCount = stateRef.current!.cpu.knockdownCount;
          s.roundTimer = 60 * 60;
          s.roundPhase = 'countdown';
          s.countdownNum = 3;
          s.countdownTimer = 60;
          s.koTarget = null;
          s.comboCount = 0;
          s.comboTimer = 0;
        }
        return;
      }

      if (s.roundPhase === 'matchEnd') {
        if (s.keys.has('enter')) {
          forceUpdate(n => n + 1);
        }
        return;
      }

      // === FIGHT phase ===
      const p = s.player;
      const cpu = s.cpu;

      // Round timer
      s.roundTimer--;
      if (s.roundTimer <= 0) {
        s.roundPhase = 'roundEnd';
        s.countdownTimer = 90;
        s.message = 'Round Over!';
        s.messageTimer = 60;
        return;
      }

      // Stamina regen
      p.stamina = Math.min(100, p.stamina + 0.12);
      cpu.stamina = Math.min(100, cpu.stamina + 0.1);

      // Stun timers
      if (p.stunTimer > 0) p.stunTimer--;
      if (cpu.stunTimer > 0) cpu.stunTimer--;

      // Hit anim
      if (p.hitAnim > 0) p.hitAnim--;
      if (cpu.hitAnim > 0) cpu.hitAnim--;

      // Punch anim
      if (p.punchAnim) {
        p.punchAnim.timer--;
        if (p.punchAnim.timer <= 0) p.punchAnim = null;
      }
      if (cpu.punchAnim) {
        cpu.punchAnim.timer--;
        if (cpu.punchAnim.timer <= 0) cpu.punchAnim = null;
      }

      // Dodge timer
      if (p.dodgeTimer > 0) p.dodgeTimer--;
      if (cpu.dodgeTimer > 0) cpu.dodgeTimer--;

      // Player input
      if (!p.down && p.stunTimer <= 0) {
        // Movement
        if (s.keys.has('a') || s.keys.has('arrowleft')) p.x = Math.max(W * 0.1, p.x - 2.5);
        if (s.keys.has('d') || s.keys.has('arrowright')) p.x = Math.min(W * 0.55, p.x + 2.5);
        if (s.keys.has('w') || s.keys.has('arrowup')) p.x = Math.min(p.x + 1.5, cpu.x - 60);

        // Block
        p.blocking = s.keys.has(' ');

        // Dodge
        if ((s.keys.has('q')) && p.dodgeTimer <= 0 && !p.blocking) {
          p.dodgeDir = -1;
          p.dodgeTimer = 15;
        }
        if ((s.keys.has('e')) && p.dodgeTimer <= 0 && !p.blocking) {
          p.dodgeDir = 1;
          p.dodgeTimer = 15;
        }
      }

      // CPU AI
      updateCPU(s);

      // Keep boxers in bounds
      p.x = Math.max(W * 0.08, Math.min(W * 0.55, p.x));
      cpu.x = Math.max(W * 0.45, Math.min(W * 0.92, cpu.x));
      if (cpu.x - p.x < 60) {
        cpu.x = p.x + 60;
      }
    }

    function render() {
      const s = stateRef.current;
      if (!s) return;
      const ctx2 = canvasRef.current?.getContext('2d');
      if (!ctx2) return;

      ctx2.save();

      // Screen shake
      if (s.shakeTimer > 0) {
        const sx = (Math.random() - 0.5) * s.shakeIntensity;
        const sy = (Math.random() - 0.5) * s.shakeIntensity;
        ctx2.translate(sx, sy);
      }

      drawRing(ctx2);
      // Draw CPU behind player (perspective)
      drawBoxer(ctx2, s.cpu, false, s);
      drawBoxer(ctx2, s.player, true, s);
      drawHUD(ctx2, s);

      ctx2.restore();
    }

    function gameLoop() {
      update();
      render();
      animRef.current = requestAnimationFrame(gameLoop);
    }
    animRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [punch, cpuAggression, cpuBlockChance, cpuDodgeChance]);

  // Button handlers for mobile/click
  const doAttack = (type: string, hand: 'L' | 'R') => {
    const s = stateRef.current;
    if (!s || s.roundPhase !== 'fight') return;
    punch(s.player, s.cpu, type, hand);
  };

  const doBlock = (active: boolean) => {
    const s = stateRef.current;
    if (!s || s.roundPhase !== 'fight') return;
    s.player.blocking = active;
  };

  const doDodge = (dir: -1 | 1) => {
    const s = stateRef.current;
    if (!s || s.roundPhase !== 'fight') return;
    if (s.player.dodgeTimer <= 0) {
      s.player.dodgeDir = dir;
      s.player.dodgeTimer = 15;
    }
  };

  const doMove = (dir: -1 | 0 | 1) => {
    const s = stateRef.current;
    if (!s || s.roundPhase !== 'fight') return;
    s.player.x = Math.max(W * 0.08, Math.min(W * 0.55, s.player.x + dir * 15));
  };

  const mashGetUp = () => {
    const s = stateRef.current;
    if (!s || !s.player.down) return;
    s.player.getUpMashes++;
  };

  const handleMatchEnd = () => {
    const s = stateRef.current;
    if (s?.roundPhase === 'matchEnd') {
      onExit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border-2 border-white/20 shadow-2xl w-full max-w-[600px] cursor-pointer"
        style={{ imageRendering: 'auto' }}
        onClick={() => {
          const s = stateRef.current;
          if (s?.roundPhase === 'matchEnd') handleMatchEnd();
          if (s?.player.down) mashGetUp();
        }}
        tabIndex={0}
        onFocus={() => {}}
      />

      {/* Mobile Controls */}
      <div className="w-full max-w-[600px] space-y-1.5">
        {/* Punches */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          <button onPointerDown={() => doAttack('jab', 'L')} className="px-3 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 active:scale-90 transition-all text-xs shadow-lg">L Jab</button>
          <button onPointerDown={() => doAttack('jab', 'R')} className="px-3 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 active:scale-90 transition-all text-xs shadow-lg">R Jab</button>
          <button onPointerDown={() => doAttack('hook', 'L')} className="px-3 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 active:scale-90 transition-all text-xs shadow-lg">Hook</button>
          <button onPointerDown={() => doAttack('uppercut', 'R')} className="px-3 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 active:scale-90 transition-all text-xs shadow-lg">Upper</button>
          <button onPointerDown={() => doAttack('body', 'L')} className="px-3 py-2 bg-red-400 text-white font-bold rounded-lg hover:bg-red-500 active:scale-90 transition-all text-xs shadow-lg">Body</button>
        </div>

        {/* Movement & Defense */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          <button onPointerDown={() => doDodge(-1)} className="px-3 py-2 bg-cyan-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">Dodge L</button>
          <button onPointerDown={() => doMove(-1)} className="px-3 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">← Move</button>
          <button
            onPointerDown={() => doBlock(true)}
            onPointerUp={() => doBlock(false)}
            onPointerLeave={() => doBlock(false)}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg active:bg-blue-700 transition-all text-xs shadow-lg"
          >Block (Hold)</button>
          <button onPointerDown={() => doMove(1)} className="px-3 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">Move →</button>
          <button onPointerDown={() => doDodge(1)} className="px-3 py-2 bg-cyan-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">Dodge R</button>
        </div>

        {/* Get Up button (shown during knockdown) */}
        <div className="flex justify-center">
          <button
            onPointerDown={mashGetUp}
            className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg active:scale-90 transition-all text-sm shadow-lg animate-pulse"
          >MASH TO GET UP!</button>
        </div>
      </div>

      <button onClick={onExit} className="px-4 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs hover:bg-white/20 transition-colors">← Back</button>
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
