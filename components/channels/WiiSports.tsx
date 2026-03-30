'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import type { WiiTheme } from '@/lib/themes';

interface Props { onBack: () => void; theme: WiiTheme }

type Sport = 'menu' | 'baseball' | 'basketball' | 'boxing' | 'tennis' | 'golf' | 'arcade';
type ArcadeGame = 'snake' | 'pacman';
type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = '1p' | '2p';

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
type PitchType = 'fastball' | 'curve' | 'changeup';
const PITCH_INFO: Record<PitchType, { speed: number; move: number; name: string; color: string }> = {
  fastball: { speed: 1.3, move: 0, name: 'Fastball', color: '#ef4444' },
  curve: { speed: 0.75, move: 1.5, name: 'Curveball', color: '#3b82f6' },
  changeup: { speed: 0.6, move: 0.5, name: 'Changeup', color: '#22c55e' },
};

function Baseball({ difficulty, gameMode, onExit }: { difficulty: Difficulty; gameMode: GameMode; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ player: 0, cpu: 0, inning: 1, outs: 0, strikes: 0, balls: 0, batting: true, gameOver: false, message: 'Tap to swing!' });
  const [gameKey, setGameKey] = useState(0);

  const maxInnings = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 9;
  const sweetSpot = difficulty === 'easy' ? 0.18 : difficulty === 'medium' ? 0.12 : 0.04;
  const pitchSpd = difficulty === 'easy' ? 0.012 : difficulty === 'medium' ? 0.016 : 0.032;
  const cpuContact = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.5 : 0.85;

  const gRef = useRef({
    phase: 'idle' as 'idle' | 'pitch' | 'hit_fly' | 'result' | 'foul_fly' | 'pitchSelect',
    timer: 60, ballZ: 0, ballTargetX: 0,
    swingAnim: 0, pitchAnim: 0,
    hitBallT: 0, hitDestX: 0, hitDestY: 0,
    resultText: '', resultColor: '#fff',
    strikes: 0, balls: 0, outs: 0, inning: 1,
    playerScore: 0, cpuScore: 0, batting: true, gameOver: false,
    bases: [false, false, false] as boolean[],
    clicked: false, cpuDecided: false, cpuSwingZ: 0.8,
    activeFielder: -1, fielderAnimT: 0,
    // New features
    pitchType: 'fastball' as PitchType,
    pitchCurveOffset: 0,
    timingIndicator: 0, // 0-1, shows how close to sweet spot
    foulBallX: 0, foulBallY: 0, foulBallVX: 0, foulBallVY: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    crowdExcitement: 0, // 0-1
    streak: 0, // consecutive hits
    lastHitQuality: '',
    shakeTimer: 0, shakeIntensity: 0,
    pitchLabelTimer: 0,
    // Pitching controls
    pitchAimOscillate: 0,
    selectedPitch: 'fastball' as PitchType,
    mouseX: 300, // mouse position for pitch aiming
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 600, H = 420;
    canvas.width = W; canvas.height = H;
    const g = gRef.current;
    let raf: number;

    const p2Label = gameMode === '2p' ? 'P2' : 'CPU';
    const syncHud = (msg: string) => {
      setHud({ player: g.playerScore, cpu: g.cpuScore, inning: g.inning, outs: g.outs, strikes: g.strikes, balls: g.balls, batting: g.batting, gameOver: g.gameOver, message: msg });
    };

    const startPitch = (playerPitching?: boolean) => {
      g.phase = 'pitch'; g.ballZ = 0; g.swingAnim = 0; g.pitchAnim = 1;
      g.clicked = false; g.cpuDecided = false;
      g.cpuSwingZ = 0.62 + Math.random() * 0.25;
      g.timingIndicator = 0;
      g.pitchCurveOffset = 0;

      if (playerPitching) {
        // Player is pitching — use their selected type and mouse aim
        g.pitchType = g.selectedPitch;
        g.ballTargetX = g.mouseX; // aim from mouse/touch position
      } else {
        // CPU pitching — pick type and aim based on difficulty
        g.ballTargetX = W / 2 + (Math.random() - 0.5) * 70;
        const pitchTypes: PitchType[] = ['fastball', 'curve', 'changeup'];
        const hardPitches: PitchType[] = ['curve', 'changeup', 'curve', 'changeup', 'fastball'];
        g.pitchType = difficulty === 'easy' ? 'fastball' : difficulty === 'hard' ? hardPitches[Math.floor(Math.random() * hardPitches.length)] : pitchTypes[Math.floor(Math.random() * pitchTypes.length)];
      }
      g.pitchLabelTimer = 70;
    };

    const spawnParticles = (x: number, y: number, count: number, color: string) => {
      for (let i = 0; i < count; i++) {
        g.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 4 - 1,
          life: 20 + Math.random() * 15,
          color,
        });
      }
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
      const tag = cpu ? `${p2Label} ` : (gameMode === '2p' ? 'P1 ' : '');
      g.strikes = 0; g.balls = 0;
      g.shakeTimer = 6; g.shakeIntensity = quality > 0.5 ? 4 : 2;
      spawnParticles(W / 2, H * 0.74, 6, '#fff');

      if (quality > 0.7 && r < 0.2) {
        const runs = advanceRunners(4);
        if (g.batting) g.playerScore += runs; else g.cpuScore += runs;
        g.hitDestX = W / 2 + (Math.random() - 0.5) * 100; g.hitDestY = -50;
        g.activeFielder = -1;
        g.resultText = `${tag}HOME RUN!`; g.resultColor = '#ffdd57';
        syncHud(`${tag}HOME RUN! ${runs} run${runs !== 1 ? 's' : ''}!`);
        g.crowdExcitement = 1;
        g.shakeTimer = 15; g.shakeIntensity = 6;
        spawnParticles(W / 2, H * 0.74, 20, '#ffdd57');
        if (!cpu) g.streak++;
        g.lastHitQuality = 'HOME RUN';
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
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      g.mouseX = ((e.clientX - rect.left) / rect.width) * W;
    };
    const onTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      g.mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onClick, { passive: true });
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    // Init
    g.phase = 'idle'; g.timer = 40;
    g.strikes = 0; g.balls = 0; g.outs = 0; g.inning = 1;
    g.playerScore = 0; g.cpuScore = 0; g.batting = true; g.gameOver = false;
    g.bases = [false, false, false]; g.activeFielder = -1;
    g.particles = []; g.pitchLabelTimer = 0; g.streak = 0; g.crowdExcitement = 0;
    syncHud('Step up to the plate!');

    const loop = () => {
      // ── UPDATE ──
      if (g.phase === 'idle') {
        g.timer--;
        if (g.timer <= 0 && !g.gameOver) {
          if (g.batting || gameMode === '2p') {
            startPitch(); // CPU pitches to player
          } else {
            g.phase = 'pitchSelect'; // Player's turn to pitch
            g.pitchAimOscillate = 0;
            syncHud('Pick your pitch!');
          }
        }
      } else if (g.phase === 'pitchSelect') {
        // Oscillate aim target (for mobile fallback if no mouse)
        g.pitchAimOscillate += 0.04;
        // Mouse aim is tracked via mousemove — clamp to strike zone area
        g.mouseX = Math.max(W / 2 - 50, Math.min(W / 2 + 50, g.mouseX));
        // Keyboard pitch selection
        if (g.clicked) {
          g.clicked = false;
          // Click = throw with current selection and aim
          startPitch(true);
        }
      } else if (g.phase === 'foul_fly') {
        g.foulBallX += g.foulBallVX;
        g.foulBallY += g.foulBallVY;
        g.foulBallVY += 0.25;
        g.timer--;
        if (g.timer <= 0) { g.phase = 'idle'; g.timer = 30; }
      } else if (g.phase === 'pitch') {
        const pi = PITCH_INFO[g.pitchType];
        g.ballZ += pitchSpd * pi.speed;
        g.pitchCurveOffset = Math.sin(g.ballZ * Math.PI) * pi.move * 20;
        g.pitchAnim = Math.max(0, g.pitchAnim - 0.04);
        // Human swing (P1 when batting, P2 when not batting in 2P)
        const isHumanBatting = g.batting || (gameMode === '2p' && !g.batting);
        // Timing indicator for human batter
        if (isHumanBatting) {
          const dist = Math.abs(g.ballZ - 0.82);
          g.timingIndicator = Math.max(0, 1 - dist / 0.3);
        }
        if (isHumanBatting && g.clicked) {
          g.clicked = false;
          const isCpu = !g.batting; // P2 is on the "cpu" side
          const timing = Math.abs(g.ballZ - 0.82);
          if (timing < sweetSpot) { processSwing(timing, isCpu); }
          else if (timing < sweetSpot * 2.5 && g.ballZ > 0.3) {
            g.swingAnim = 1;
            if (g.strikes < 2) g.strikes++;
            g.foulBallX = W / 2;
            g.foulBallY = H * 0.74;
            g.foulBallVX = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4);
            g.foulBallVY = -6 - Math.random() * 3;
            g.phase = 'foul_fly'; g.timer = 40;
            spawnParticles(W / 2, H * 0.74, 4, '#aaa');
            syncHud(`Foul ball! (${g.strikes}-${g.balls})`);
          } else { g.swingAnim = 1; g.streak = 0; advanceCount(true); }
        }
        // CPU swing (1P only)
        if (gameMode === '1p' && !g.batting && !g.cpuDecided && g.ballZ >= g.cpuSwingZ) {
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
          syncHud(g.batting ? (gameMode === '2p' ? 'P1 at bat!' : 'You\'re up!') : `${p2Label} at bat...`);
        }
      }
      g.swingAnim = Math.max(0, g.swingAnim - 0.05);
      if (g.shakeTimer > 0) g.shakeTimer--;
      if (g.pitchLabelTimer > 0) g.pitchLabelTimer--;
      g.crowdExcitement = Math.max(0, g.crowdExcitement - 0.005);

      // Update particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
        return p.life > 0;
      });

      // ── DRAW ──
      ctx.save();
      if (g.shakeTimer > 0) {
        ctx.translate((Math.random() - 0.5) * g.shakeIntensity, (Math.random() - 0.5) * g.shakeIntensity);
      }
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
        const crowdBounce = g.crowdExcitement * Math.sin(Date.now() / 100 + i * 0.5) * 4;
        const cx = (i / 80) * W, cy = H * 0.3 + Math.sin(i * 1.5) * 18 + Math.cos(i * 2.3) * 6 + crowdBounce;
        ctx.fillStyle = g.crowdExcitement > 0.5 ? `hsl(${(i * 30 + Date.now() / 10) % 360}, 70%, 70%)` : 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.arc(cx, cy, 2.5 + g.crowdExcitement, 0, Math.PI * 2); ctx.fill();
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
      if (g.phase === 'idle' || g.phase === 'pitch' || g.phase === 'pitchSelect') {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(W / 2 - 30, H * 0.66, 60, H * 0.1);
        ctx.setLineDash([]);
      }

      // Pitch aiming crosshair (when player is pitching)
      if (g.phase === 'pitchSelect') {
        const aimX = Math.max(W / 2 - 50, Math.min(W / 2 + 50, g.mouseX));
        const aimY = H * 0.71;
        const pulse = 0.5 + 0.3 * Math.sin(Date.now() / 150);
        const pc = PITCH_INFO[g.selectedPitch].color;
        ctx.strokeStyle = pc;
        ctx.lineWidth = 2;
        ctx.globalAlpha = pulse;
        ctx.beginPath(); ctx.arc(aimX, aimY, 10, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(aimX - 15, aimY); ctx.lineTo(aimX + 15, aimY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(aimX, aimY - 15); ctx.lineTo(aimX, aimY + 15); ctx.stroke();
        ctx.globalAlpha = 1;
        // Label
        ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = pc;
        ctx.fillText(PITCH_INFO[g.selectedPitch].name, aimX, aimY - 18);
        // Prompt
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px system-ui, sans-serif';
        const flashA = 0.5 + 0.5 * Math.sin(Date.now() / 200);
        ctx.globalAlpha = flashA;
        ctx.fillText('TAP TO THROW!', W / 2, H - 15);
        ctx.globalAlpha = 1;
      }

      // Ball during pitch
      if (g.phase === 'pitch') {
        const bz = g.ballZ;
        const bsx = W / 2 + (g.ballTargetX - W / 2) * bz + g.pitchCurveOffset;
        const bsy = H * 0.36 + (H * 0.74 - H * 0.36) * bz;
        const br = 3 + bz * 7;
        // Ball trail
        const pi = PITCH_INFO[g.pitchType];
        ctx.strokeStyle = `${pi.color}40`;
        ctx.lineWidth = br * 0.6;
        ctx.beginPath();
        for (let t = Math.max(0, bz - 0.15); t < bz; t += 0.02) {
          const tx = W / 2 + (g.ballTargetX - W / 2) * t + Math.sin(t * Math.PI) * pi.move * 20;
          const ty = H * 0.36 + (H * 0.74 - H * 0.36) * t;
          if (t === Math.max(0, bz - 0.15)) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.ellipse(bsx + 2, bsy + br + 3, br * 0.8, br * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        // Ball
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(bsx, bsy, br, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bsx, bsy, br * 0.7, -0.5, 0.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(bsx, bsy, br * 0.7, Math.PI - 0.5, Math.PI + 0.5); ctx.stroke();
        // Pitch type label (fades in then out)
        if (g.pitchLabelTimer > 0) {
          const alpha = Math.min(1, g.pitchLabelTimer / 20);
          const pi2 = PITCH_INFO[g.pitchType];
          ctx.globalAlpha = alpha;
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.beginPath(); ctx.roundRect(W / 2 - 60, H * 0.5 - 17, 120, 30, 7); ctx.fill();
          ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = pi2.color;
          ctx.fillText(pi2.name, W / 2, H * 0.5 + 6);
          ctx.globalAlpha = 1;
        }
      }

      // Foul ball flight
      if (g.phase === 'foul_fly') {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(g.foulBallX, g.foulBallY, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('FOUL!', W / 2, H * 0.5);
      }

      // Timing indicator (when batting)
      if ((g.batting || (gameMode === '2p' && !g.batting)) && g.phase === 'pitch' && g.timingIndicator > 0.2) {
        const tAlpha = g.timingIndicator;
        const tColor = tAlpha > 0.8 ? '#22c55e' : tAlpha > 0.5 ? '#eab308' : '#ef4444';
        ctx.strokeStyle = tColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = tAlpha * 0.6;
        ctx.beginPath();
        ctx.arc(W / 2, H * 0.72, 20 + (1 - tAlpha) * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
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

      // Particles
      for (const p of g.particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Streak counter
      if (g.streak >= 2 && g.batting) {
        ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillStyle = g.streak >= 5 ? '#ef4444' : '#fbbf24';
        ctx.fillText(`${g.streak} hit streak!`, 10, H - 8);
      }

      // ── SCOREBOARD HUD ──
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 185, 5, 370, 48, 8); ctx.fill();
      // Scores
      ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = '#90ee90'; ctx.fillText(`${gameMode === '2p' ? 'P1' : 'YOU'}  ${g.playerScore}`, W / 2 - 170, 24);
      ctx.fillStyle = '#ff9b9b'; ctx.textAlign = 'right';
      ctx.fillText(`${p2Label}  ${g.cpuScore}`, W / 2 + 170, 24);
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
      ctx.fillText(g.batting ? (gameMode === '2p' ? 'P1 BATTING' : 'BATTING') : (gameMode === '2p' ? 'P2 BATTING' : 'PITCHING'), W / 2, H - 13);

      // Result banner
      if ((g.phase === 'hit_fly' && g.hitBallT > 0.35) || g.phase === 'result') {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath(); ctx.roundRect(W / 2 - 120, H / 2 - 24, 240, 48, 10); ctx.fill();
        ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = g.resultColor;
        ctx.fillText(g.resultText, W / 2, H / 2 + 8);
      }

      ctx.restore(); // screen shake
      if (!g.gameOver) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('click', onClick); canvas.removeEventListener('touchstart', onClick); canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('touchmove', onTouchMove); };
  }, [difficulty, gameMode, maxInnings, sweetSpot, pitchSpd, cpuContact, gameKey]);

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[600px] aspect-[600/420] touch-none cursor-pointer" />
      <p className="text-white font-bold text-sm min-h-[1.5rem]">{hud.message}</p>
      {hud.batting ? (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-2 justify-center">
            <button onPointerDown={() => { gRef.current.clicked = true; }}
              className="px-8 py-3 bg-white text-red-600 font-bold rounded-xl hover:scale-105 active:scale-90 transition-transform shadow-lg text-sm">SWING!</button>
          </div>
          <p className="text-white/50 text-xs">{gameMode === '2p' ? 'P1: Tap to swing!' : 'Tap to swing!'}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5 justify-center">
            <button onPointerDown={() => { gRef.current.selectedPitch = 'fastball'; gRef.current.clicked = true; }}
              className="px-4 py-2.5 bg-red-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">⚡ Fast</button>
            <button onPointerDown={() => { gRef.current.selectedPitch = 'curve'; gRef.current.clicked = true; }}
              className="px-4 py-2.5 bg-blue-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">🌀 Curve</button>
            <button onPointerDown={() => { gRef.current.selectedPitch = 'changeup'; gRef.current.clicked = true; }}
              className="px-4 py-2.5 bg-green-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">🐢 Change</button>
          </div>
          <p className="text-white/50 text-xs">Aim with mouse/touch, tap pitch to throw!</p>
        </div>
      )}
      {hud.gameOver && (
        <div className="bg-black/40 rounded-2xl p-4 text-center space-y-3 w-full max-w-[600px]">
          <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Final Score</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-white/50 text-xs font-bold mb-0.5">{gameMode === '2p' ? 'P1' : 'YOU'}</p>
              <p className="text-white font-black text-4xl">{hud.player}</p>
            </div>
            <p className="text-white/30 text-2xl font-bold">—</p>
            <div className="text-center">
              <p className="text-white/50 text-xs font-bold mb-0.5">{gameMode === '2p' ? 'P2' : 'CPU'}</p>
              <p className="text-white font-black text-4xl">{hud.cpu}</p>
            </div>
          </div>
          <p className="text-yellow-300 font-black text-xl">
            {hud.player > hud.cpu ? (gameMode === '2p' ? 'P1 WINS!' : 'YOU WIN!') : hud.player < hud.cpu ? (gameMode === '2p' ? 'P2 WINS!' : 'CPU WINS') : 'TIE GAME!'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setGameKey(k => k + 1)}
              className="px-6 py-2 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all"
            >Play Again</button>
            <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 active:scale-95 transition-all">Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Shot positions: x, y (canvas coords), point value
const SHOT_SPOTS = [
  { x: 260, y: 320, pts: 2, label: 'Free Throw' },
  { x: 180, y: 330, pts: 3, label: '3-Point Left' },
  { x: 100, y: 340, pts: 3, label: 'Deep Three' },
  { x: 320, y: 310, pts: 2, label: 'Mid-Range' },
  { x: 150, y: 370, pts: 3, label: 'Corner 3' },
  { x: 350, y: 340, pts: 2, label: 'Elbow' },
  { x: 400, y: 280, pts: 2, label: 'Paint' },
  { x: 440, y: 250, pts: 2, label: 'Layup', dunk: true },
  { x: 200, y: 290, pts: 3, label: 'Wing 3' },
  { x: 80, y: 370, pts: 3, label: 'Deep Corner' },
];

// ═══════ BASKETBALL (Canvas) ═══════
function Basketball({ difficulty, gameMode, onExit }: { difficulty: Difficulty; gameMode: GameMode; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ player: 0, cpu: 0, time: 45, playerTurn: true, gameOver: false, message: 'Click to shoot!' });
  const [gameKey, setGameKey] = useState(0);

  const threshold = difficulty === 'easy' ? 28 : difficulty === 'medium' ? 18 : 5;
  const cpuMake = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.88;
  const gameTime = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 40 : 24;

  const gRef = useRef({
    phase: 'idle' as 'idle' | 'aiming' | 'aim2' | 'flying' | 'result' | 'moving' | 'dunk',
    timer: 0, power: 0, powerDir: 1,
    aim: 50, aimDir: 1.2,
    ballT: 0, ballStartX: 0, ballStartY: 0,
    ballEndX: 0, ballEndY: 0, ballArcH: 0,
    made: false, resultText: '', resultColor: '#fff',
    playerScore: 0, cpuScore: 0, playerTurn: true,
    timeLeft: 0, gameOver: false, shotSpot: 0,
    rimBounce: 0, netAnim: 0, clicked: false,
    streak: 0, onFire: false,
    playerX: 260, playerY: 320, targetSpot: 0,
    moveProgress: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    dunkPhase: 0,
    perfectShots: 0,
    swish: false,
    lastShotPerfect: false,
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

    const p2Label = gameMode === '2p' ? 'P2' : 'CPU';
    const syncHud = (msg: string) => {
      setHud({ player: g.playerScore, cpu: g.cpuScore, time: Math.ceil(Math.max(0, g.timeLeft)), playerTurn: g.playerTurn, gameOver: g.gameOver, message: msg });
    };

    const launchBall = (powerErr: number, aimErr: number) => {
      g.ballStartX = g.playerX + 10; g.ballStartY = g.playerY - 28;
      const fireBonus = g.onFire ? threshold * 0.4 : 0;
      const totalErr = powerErr + aimErr * 0.6;
      g.made = totalErr < (threshold + fireBonus);
      g.swish = g.made && totalErr < threshold * 0.2;
      g.lastShotPerfect = g.made && totalErr < threshold * 0.3;
      if (g.made) {
        g.ballEndX = rimX - 12 + (Math.random() - 0.5) * 6;
        g.ballEndY = rimY;
        g.ballArcH = 130 + Math.random() * 30;
      } else {
        const missDir = aimErr > 25 ? (g.aim > 50 ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
        const miss = missDir * (0.3 + Math.random() * 0.5);
        g.ballEndX = rimX - 12 + miss * 35;
        g.ballEndY = rimY + Math.abs(miss) * 20 - 15;
        g.ballArcH = 90 + Math.random() * 60;
      }
      g.phase = 'flying'; g.ballT = 0;
    };

    const spawnBBParticles = (x: number, y: number, count: number, color: string) => {
      for (let i = 0; i < count; i++) {
        g.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 3 - 1, life: 20 + Math.random() * 10, color });
      }
    };

    const shotResult = () => {
      const spot = SHOT_SPOTS[g.shotSpot];
      const tag = g.playerTurn ? '' : `${p2Label} `;
      if (g.made) {
        const pts = spot.pts;
        if (g.playerTurn) g.playerScore += pts; else g.cpuScore += pts;
        if (g.playerTurn) {
          g.streak++;
          if (g.streak >= 3) g.onFire = true;
          g.perfectShots++;
        }
        g.netAnim = 1;
        spawnBBParticles(rimX - 12, rimY + 20, 8, g.onFire && g.playerTurn ? '#f97316' : '#ffdd57');
        const msgs = g.swish ? `${tag}SWISH!` : pts === 3 ? `${tag}THREE!` : `${tag}BUCKET!`;
        g.resultText = g.onFire && g.playerTurn ? `ON FIRE! ${msgs}` : msgs;
        g.resultColor = g.onFire && g.playerTurn ? '#f97316' : '#ffdd57';
        syncHud(`${tag}${pts}-pointer!${g.streak >= 3 && g.playerTurn ? ' ON FIRE!' : ''}`);
      } else {
        if (g.playerTurn) { g.streak = 0; g.onFire = false; }
        g.resultText = `${tag}MISS!`; g.resultColor = '#ff6b6b'; g.rimBounce = 1;
        syncHud(`${tag}Missed!`);
      }
      g.phase = 'result'; g.timer = 45;
    };

    const nextTurn = () => {
      g.playerTurn = !g.playerTurn;
      g.targetSpot = (g.shotSpot + 1 + Math.floor(Math.random() * 2)) % SHOT_SPOTS.length;
      g.phase = 'moving'; g.moveProgress = 0;
      g.rimBounce = 0; g.netAnim = 0;
      syncHud(g.playerTurn ? 'Moving to spot...' : `${p2Label} moving...`);
    };

    const onClick = () => { g.clicked = true; };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onClick, { passive: true });

    g.phase = 'idle'; g.timer = 30; g.playerScore = 0; g.cpuScore = 0;
    g.timeLeft = gameTime; g.playerTurn = true; g.gameOver = false; g.shotSpot = 0;
    g.particles = []; g.streak = 0; g.onFire = false; g.lastShotPerfect = false;
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

      // Update particles
      g.particles = g.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--; return p.life > 0; });

      // UPDATE
      if (g.phase === 'moving') {
        g.moveProgress += 0.04;
        const from = SHOT_SPOTS[g.shotSpot];
        const to = SHOT_SPOTS[g.targetSpot];
        g.playerX = from.x + (to.x - from.x) * Math.min(1, g.moveProgress);
        g.playerY = from.y + (to.y - from.y) * Math.min(1, g.moveProgress);
        if (g.moveProgress >= 1) {
          g.shotSpot = g.targetSpot;
          g.playerX = to.x; g.playerY = to.y;
          g.phase = 'idle'; g.timer = 15;
          syncHud(g.playerTurn ? 'Click to shoot!' : `${p2Label} shooting...`);
        }
      } else if (g.phase === 'idle') {
        g.timer--;
        if (g.timer <= 0 && !g.gameOver) {
          const spot = SHOT_SPOTS[g.shotSpot];
          const isHuman = g.playerTurn || gameMode === '2p';
          // Dunk check
          if (isHuman && (spot as { dunk?: boolean }).dunk) {
            g.phase = 'aiming'; g.power = 0; g.powerDir = 1.8;
            syncHud(g.playerTurn ? 'Stop the POWER!' : `${p2Label}: Stop the POWER!`);
          } else if (isHuman) {
            g.phase = 'aiming'; g.power = 0; g.powerDir = 1.4;
            syncHud(g.playerTurn ? 'Stop the POWER!' : `${p2Label}: Stop the POWER!`);
          } else {
            const acc = Math.random() < cpuMake ? Math.random() * threshold * 0.8 : threshold + Math.random() * 20;
            const aimAcc = Math.random() < cpuMake ? Math.random() * threshold * 0.9 : threshold + Math.random() * 15;
            launchBall(acc, aimAcc);
          }
        }
        if ((g.playerTurn || gameMode === '2p') && g.clicked && g.timer > 0) { g.clicked = false; g.timer = 0; }
      } else if (g.phase === 'aiming') {
        g.power += g.powerDir * (difficulty === 'hard' ? 2.8 : 1.4);
        if (g.power >= 100) { g.power = 100; g.powerDir = -1; }
        if (g.power <= 0) { g.power = 0; g.powerDir = 1; }
        if (g.clicked) {
          g.clicked = false;
          // Click 1: lock power, start aim bar
          g.aim = 50;
          g.aimDir = (Math.random() < 0.5 ? 1 : -1) * (difficulty === 'hard' ? 2.6 : difficulty === 'medium' ? 1.8 : 1.2);
          g.phase = 'aim2';
          syncHud(g.playerTurn ? 'Now stop the AIM!' : `${p2Label}: Stop the AIM!`);
        }
      } else if (g.phase === 'aim2') {
        g.aim += g.aimDir;
        if (g.aim >= 100) { g.aim = 100; g.aimDir = -Math.abs(g.aimDir); }
        if (g.aim <= 0) { g.aim = 0; g.aimDir = Math.abs(g.aimDir); }
        if (g.clicked) {
          g.clicked = false;
          const spot2 = SHOT_SPOTS[g.shotSpot];
          const powerErr = Math.abs(g.power - 75);
          const aimErr = Math.abs(g.aim - 50);
          if ((spot2 as { dunk?: boolean }).dunk && powerErr < threshold && aimErr < threshold * 1.5) {
            g.phase = 'dunk'; g.dunkPhase = 0;
          } else {
            launchBall(powerErr, aimErr);
          }
        }
      } else if (g.phase === 'dunk') {
        g.dunkPhase += 0.03;
        if (g.dunkPhase >= 1) {
          g.made = true; g.swish = false;
          const spot = SHOT_SPOTS[g.shotSpot];
          if (g.playerTurn) { g.playerScore += spot.pts; g.streak++; if (g.streak >= 3) g.onFire = true; }
          else g.cpuScore += spot.pts;
          g.resultText = g.playerTurn ? 'SLAM DUNK!' : `${p2Label} DUNK!`;
          g.resultColor = '#f97316';
          g.netAnim = 1; g.rimBounce = 0.8;
          spawnBBParticles(rimX - 12, rimY, 15, '#f97316');
          syncHud(g.playerTurn ? 'SLAM DUNK!' : `${p2Label} Dunks!`);
          g.phase = 'result'; g.timer = 55;
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

      // On-fire effect around rim
      if (g.onFire && g.playerTurn) {
        ctx.strokeStyle = `rgba(249,115,22,${0.3 + 0.2 * Math.sin(Date.now() / 100)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rimX - 14, rimY, 30 + Math.sin(Date.now() / 150) * 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dunk animation
      if (g.phase === 'dunk') {
        const t = g.dunkPhase;
        const sx = g.playerX, sy = g.playerY;
        const ex = rimX - 15, ey = rimY;
        const mx2 = sx + (ex - sx) * t;
        const my2 = sy + (ey - sy) * t - Math.sin(t * Math.PI) * 100;
        // Dunk player
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(mx2 - 6, my2 - 12, 12, 17);
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath(); ctx.arc(mx2, my2 - 18, 7, 0, Math.PI * 2); ctx.fill();
        // Ball in hand
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(mx2 + 8, my2 - 24, 6, 0, Math.PI * 2); ctx.fill();
      }

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
      const isAiming = g.phase === 'aiming' || g.phase === 'aim2' || (g.phase === 'idle' && g.playerTurn);
      drawMii(spot.x, spot.y, g.playerTurn ? '#3b82f6' : '#ef4444', isAiming || g.phase === 'flying');

      // Streak counter above player
      if (g.streak >= 2 && g.playerTurn) {
        ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3;
        const st = `🔥 ${g.streak}x`;
        ctx.strokeText(st, spot.x, spot.y - 48);
        ctx.fillStyle = g.onFire ? '#f97316' : '#ffe082';
        ctx.fillText(st, spot.x, spot.y - 48);
      }

      // Shot spot name during aiming
      if ((g.phase === 'aiming' || g.phase === 'aim2') && (g.playerTurn || gameMode === '2p')) {
        ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(SHOT_SPOTS[g.shotSpot].label.toUpperCase(), spot.x, spot.y - 62);
      }

      // Ball
      const drawBall = (bx: number, by: number, r: number) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - r, by); ctx.lineTo(bx + r, by); ctx.stroke();
      };

      if (g.phase === 'aiming' || g.phase === 'aim2' || (g.phase === 'idle' && g.timer > 5)) {
        drawBall(spot.x + 10, spot.y - 26, 7);
      }
      if (g.phase === 'flying') {
        const t = g.ballT;
        const bx = g.ballStartX + (g.ballEndX - g.ballStartX) * t;
        const by = g.ballStartY + (g.ballEndY - g.ballStartY) * t - Math.sin(t * Math.PI) * g.ballArcH;
        const br = 7 - t * 2;
        // Ball shadow on court
        const shadowScale = 0.8 + (1 - t) * 0.4;
        ctx.fillStyle = `rgba(0,0,0,${0.12 * shadowScale})`;
        ctx.beginPath(); ctx.ellipse(bx, H * 0.86, 11 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();
        if (br > 2) drawBall(bx, by, br);
      }
      if (g.phase === 'result' && g.made && g.timer > 22) {
        const dropT = Math.min(1, (45 - g.timer) / 12);
        drawBall(rimX - 14, rimY + dropT * 42, 5 - dropT * 2);
      }

      // Particles
      for (const p of g.particles) {
        ctx.globalAlpha = p.life / 25;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // (streak tracked via on-fire rim effect only - no text)

      // Power meter — vertical, click 1
      if (g.phase === 'aiming' || g.phase === 'aim2') {
        const pmX = 24, pmY = H * 0.2, pmH = 180, pmW = 14;
        const locked = g.phase === 'aim2';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.roundRect(pmX - 3, pmY - 18, pmW + 6, pmH + 28, 8); ctx.fill();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(pmX - 3, pmY - 18, pmW + 6, pmH + 28, 8); ctx.stroke();
        ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = locked ? '#22c55e' : '#888';
        ctx.fillText('PWR', pmX + pmW / 2, pmY - 5);
        ctx.fillStyle = '#e5e5e5'; ctx.fillRect(pmX, pmY, pmW, pmH);
        ctx.fillStyle = 'rgba(34,197,94,0.3)';
        ctx.fillRect(pmX, pmY + pmH * 0.15, pmW, pmH * 0.2);
        const fillH = (g.power / 100) * pmH;
        const barColor = locked ? '#22c55e' : (g.power > 65 && g.power < 85 ? '#22c55e' : g.power > 45 ? '#eab308' : '#ef4444');
        ctx.fillStyle = barColor;
        ctx.fillRect(pmX, pmY + pmH - fillH, pmW, fillH);
        if (!locked) {
          ctx.fillStyle = '#333';
          const arrowY = pmY + pmH - fillH;
          ctx.beginPath();
          ctx.moveTo(pmX + pmW + 3, arrowY);
          ctx.lineTo(pmX + pmW + 10, arrowY - 5);
          ctx.lineTo(pmX + pmW + 10, arrowY + 5);
          ctx.closePath(); ctx.fill();
        }
      }

      // Aim meter — horizontal, click 2
      if (g.phase === 'aim2') {
        const amX = 60, amY = H - 48, amW = W - 120, amH = 14;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.beginPath(); ctx.roundRect(amX - 4, amY - 18, amW + 8, amH + 26, 8); ctx.fill();
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(amX - 4, amY - 18, amW + 8, amH + 26, 8); ctx.stroke();
        ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.fillText('AIM — TAP when centered!', amX + amW / 2, amY - 5);
        ctx.fillStyle = '#e5e5e5'; ctx.fillRect(amX, amY, amW, amH);
        // Sweet zone (center)
        const szW = amW * 0.12;
        ctx.fillStyle = 'rgba(34,197,94,0.35)';
        ctx.fillRect(amX + amW * 0.5 - szW / 2, amY, szW, amH);
        // Indicator
        const aimPx = amX + (g.aim / 100) * amW;
        const aimErr2 = Math.abs(g.aim - 50);
        ctx.fillStyle = aimErr2 < 8 ? '#22c55e' : aimErr2 < 20 ? '#eab308' : '#ef4444';
        ctx.fillRect(aimPx - 5, amY - 2, 10, amH + 4);
        ctx.font = '8px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#555';
        ctx.fillText('◀ LEFT', amX + 18, amY + amH + 8);
        ctx.fillText('CENTER', amX + amW / 2, amY + amH + 8);
        ctx.fillText('RIGHT ▶', amX + amW - 18, amY + amH + 8);
      }

      // ── SCOREBOARD (Wii-clean) ──
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 140, 6, 280, 34, 10); ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(W / 2 - 140, 6, 280, 34, 10); ctx.stroke();
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.fillStyle = '#3b82f6';
      ctx.fillText(`${gameMode === '2p' ? 'P1' : 'YOU'}  ${g.playerScore}`, W / 2 - 125, 28);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555'; ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`${Math.ceil(Math.max(0, g.timeLeft))}`, W / 2, 30);
      ctx.font = '8px system-ui, sans-serif'; ctx.fillStyle = '#999';
      ctx.fillText('SEC', W / 2, 17);
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.fillStyle = '#ef4444';
      ctx.fillText(`${p2Label}  ${g.cpuScore}`, W / 2 + 125, 28);

      // Shot label
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 42, H - 26, 84, 18, 5); ctx.fill();
      ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#555';
      ctx.fillText(`${spot.pts}PT • ${g.playerTurn ? (gameMode === '2p' ? 'P1' : 'YOU') : p2Label}`, W / 2, H - 13);

      // Result banner
      if (g.phase === 'result' && g.timer > 12) {
        const bannerH = g.lastShotPerfect && g.made ? 62 : 44;
        ctx.fillStyle = g.made ? 'rgba(34,197,94,0.85)' : 'rgba(220,50,50,0.8)';
        ctx.beginPath(); ctx.roundRect(W / 2 - 100, H / 2 - 22, 200, bannerH, 12); ctx.fill();
        ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(g.resultText, W / 2, H / 2 + (g.lastShotPerfect && g.made ? 0 : 8));
        if (g.lastShotPerfect && g.made) {
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('✦ PERFECT RELEASE ✦', W / 2, H / 2 + 20);
        }
      }

      if (!g.gameOver) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('click', onClick); canvas.removeEventListener('touchstart', onClick); };
  }, [difficulty, gameMode, threshold, cpuMake, gameTime, gameKey]);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[600px] aspect-[600/420] touch-none cursor-pointer" />
      <p className="text-white font-bold text-sm min-h-[1.5rem]">{hud.message}</p>
      <p className="text-white/50 text-xs">{hud.playerTurn ? 'Tap: stop POWER → stop AIM → shoot!' : `${gameMode === '2p' ? 'P2' : 'CPU'} shooting...`}</p>
      {hud.gameOver && (
        <div className="bg-black/40 rounded-2xl p-4 text-center space-y-3 w-full max-w-[600px]">
          <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Final Score</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-white/50 text-xs font-bold mb-0.5">{gameMode === '2p' ? 'P1' : 'YOU'}</p>
              <p className="text-white font-black text-4xl">{hud.player}</p>
            </div>
            <p className="text-white/30 text-2xl font-bold">—</p>
            <div className="text-center">
              <p className="text-white/50 text-xs font-bold mb-0.5">{gameMode === '2p' ? 'P2' : 'CPU'}</p>
              <p className="text-white font-black text-4xl">{hud.cpu}</p>
            </div>
          </div>
          <p className="text-yellow-300 font-black text-xl">
            {hud.player > hud.cpu ? (gameMode === '2p' ? 'P1 WINS!' : 'YOU WIN!') : hud.player < hud.cpu ? (gameMode === '2p' ? 'P2 WINS!' : 'CPU WINS') : 'TIE GAME!'}
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setGameKey(k => k + 1)} className="px-6 py-2 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all">Play Again</button>
            <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 active:scale-95 transition-all">Back</button>
          </div>
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
  // New
  counterWindow: number; // frames where counter is available after blocking
  damage: number; // accumulated damage for visual redness (0-100)
  lastBlockTime: number;
}

function Boxing({ difficulty, gameMode, onExit }: { difficulty: Difficulty; gameMode: GameMode; onExit: () => void }) {
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
    particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[];
    cornerRest: boolean; cornerTimer: number;
    roundResults: ('player' | 'cpu' | 'draw')[];
    stars: number;
    cpuWindup: number; cpuWindupType: string; cpuWindupHand: 'L' | 'R';
  } | null>(null);
  const animRef = useRef<number>(0);
  const [tick, forceUpdate] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const W = 600, H = 440;
  const cpuAggression = difficulty === 'easy' ? 0.012 : difficulty === 'medium' ? 0.025 : 0.065;
  const cpuReaction = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.5 : 0.92;
  const cpuBlockChance = difficulty === 'easy' ? 0.15 : difficulty === 'medium' ? 0.3 : 0.7;
  const cpuDodgeChance = difficulty === 'easy' ? 0.05 : difficulty === 'medium' ? 0.12 : 0.38;

  function makeBoxer(x: number): BoxerState {
    return { x, y: H * 0.55, hp: 100, stamina: 100, blocking: false, stunTimer: 0,
      knockdownCount: 0, punchAnim: null, hitAnim: 0, dodgeDir: 0, dodgeTimer: 0,
      down: false, downTimer: 0, getUpMashes: 0, headBob: 0, swayOffset: 0,
      counterWindow: 0, damage: 0, lastBlockTime: 0 };
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
      particles: [],
      cornerRest: false, cornerTimer: 0,
      roundResults: [],
      stars: 0,
      cpuWindup: 0, cpuWindupType: '', cpuWindupHand: 'L',
    };
  }

  const punch = useCallback((attacker: BoxerState, defender: BoxerState, type: string, hand: 'L' | 'R') => {
    const s = stateRef.current;
    if (!s || attacker.stunTimer > 0 || attacker.down || defender.down) return false;
    if (attacker.punchAnim) return false;

    const costs: Record<string, number> = { jab: 6, hook: 12, uppercut: 20, body: 8, star: 8 };
    const damages: Record<string, number> = { jab: 5, hook: 10, uppercut: 18, body: 7, star: 38 };
    const stuns: Record<string, number> = { jab: 8, hook: 18, uppercut: 30, body: 12, star: 50 };
    const ranges: Record<string, number> = { jab: 130, hook: 120, uppercut: 100, body: 115, star: 140 };

    // Star punch requires a star
    if (type === 'star') {
      if (!s || s.stars < 1) return false;
      s.stars--;
    }

    const cost = costs[type] || 6;
    if (attacker.stamina < cost) return false;
    attacker.stamina -= cost;
    attacker.punchAnim = { type, hand, timer: type === 'star' ? 22 : type === 'uppercut' ? 18 : type === 'hook' ? 14 : 10 };

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
      defender.counterWindow = 20; // counter-punch window after block
      defender.lastBlockTime = Date.now();
      s.message = 'BLOCKED!';
      s.messageTimer = 30;
      attacker.stunTimer = 6;
      s.shakeTimer = 4; s.shakeIntensity = 2;
      s.particles.push({ x: (attacker.x + defender.x) / 2, y: defender.y - 10, vx: 0, vy: -2, life: 15, color: '#60a5fa', size: 8 });
      return true;
    }

    // Hit!
    const baseDmg = damages[type] || 5;
    const variance = Math.floor(Math.random() * 4) - 1;
    let dmg = baseDmg + variance;
    // CPU hits harder on hard
    if (attacker !== s.player && difficulty === 'hard') dmg = Math.floor(dmg * 1.5);

    // Counter-punch bonus (hitting within counter window after blocking)
    if (attacker.counterWindow > 0) {
      dmg = Math.floor(dmg * 1.6);
      attacker.counterWindow = 0;
      s.message = 'COUNTER!';
      s.messageTimer = 35;
    }

    // Combo bonus
    if (s.comboTimer > 0 && attacker === s.player) {
      s.comboCount++;
      if (s.comboCount >= 3) dmg = Math.floor(dmg * 1.4);
    } else if (attacker === s.player) {
      s.comboCount = 1;
    }
    if (attacker === s.player) s.comboTimer = 45;

    defender.hp = Math.max(0, defender.hp - dmg);
    defender.damage = Math.min(100, defender.damage + dmg * 0.8);
    defender.hitAnim = 12;
    defender.stunTimer = stuns[type] || 8;

    // Impact particles
    const impactX = (attacker.x + defender.x) / 2;
    const impactY = type === 'body' ? defender.y + 5 : type === 'uppercut' ? defender.y - 25 : defender.y - 10;
    for (let i = 0; i < 5 + dmg; i++) {
      s.particles.push({
        x: impactX, y: impactY,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2,
        life: 12 + Math.random() * 10,
        color: dmg > 15 ? '#ef4444' : '#fbbf24',
        size: 2 + Math.random() * 3,
      });
    }
    s.shakeTimer = type === 'star' ? 16 : type === 'uppercut' ? 10 : type === 'hook' ? 7 : 4;
    s.shakeIntensity = type === 'star' ? 12 : type === 'uppercut' ? 6 : type === 'hook' ? 4 : 2;
    if (type === 'star') s.slowMo = 20;

    const hitMsgs: Record<string, string[]> = {
      jab: ['JAB!', 'Quick hit!', 'Snap!'],
      hook: ['HOOK!', 'Big swing!', 'POW!'],
      uppercut: ['UPPERCUT!', 'MASSIVE HIT!', 'BOOM!'],
      body: ['Body blow!', 'To the body!', 'OOF!'],
      star: ['★ STAR PUNCH!', '★ DEVASTATING!', '★ CRUSHING BLOW!'],
    };
    const msgs = hitMsgs[type] || ['HIT!'];
    s.message = `${msgs[Math.floor(Math.random() * msgs.length)]} -${dmg}`;
    s.messageTimer = 35;

    if (s.comboCount >= 3 && attacker === s.player) {
      s.message = `${s.comboCount}x COMBO! ${s.message}`;
    }

    // Earn star at 5+ combo
    if (s.comboCount >= 5 && attacker === s.player && s.stars < 3) {
      s.stars++;
      s.comboCount = 0; // reset so they need another streak
    }

    // Crowd camera flashes on big hits
    if (dmg > 12) {
      for (let i = 0; i < 5; i++) {
        s.particles.push({
          x: Math.random() * W, y: 10 + Math.random() * (H * 0.35),
          vx: 0, vy: 0, life: 4 + Math.random() * 4, color: '#fff', size: 3 + Math.random() * 3,
        });
      }
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
      const key = e.key.toLowerCase();
      s.keys.add(key);

      // Mash to get up from knockdown
      if (s.player.down && s.roundPhase === 'countdown' && s.koTarget === 'player') {
        if (gameMode === '1p' || 'wasdqerfgt '.includes(key)) s.player.getUpMashes++;
      }
      // P2 mash to get up
      if (gameMode === '2p' && s.cpu.down && s.roundPhase === 'countdown' && s.koTarget === 'cpu') {
        if ('arrowup arrowdown arrowleft arrowright jkui,.shift'.includes(key) || key.startsWith('arrow')) s.cpu.getUpMashes++;
      }

      if (s.roundPhase !== 'fight') return;
      const hand: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';

      // P1 keyboard punches
      if (gameMode === '2p') {
        // 2P: P1 uses F/G/R/T
        if (key === 'f') punch(s.player, s.cpu, 'jab', hand);
        else if (key === 'g') punch(s.player, s.cpu, 'hook', 'L');
        else if (key === 'r') punch(s.player, s.cpu, 'uppercut', 'R');
        else if (key === 't') punch(s.player, s.cpu, 'body', 'L');
      } else {
        // 1P: P1 uses J/K/H/U/B/N
        if (key === 'j') punch(s.player, s.cpu, 'jab', 'L');
        else if (key === 'k') punch(s.player, s.cpu, 'jab', 'R');
        else if (key === 'h') punch(s.player, s.cpu, 'hook', 'L');
        else if (key === 'u') punch(s.player, s.cpu, 'uppercut', 'R');
        else if (key === 'b') punch(s.player, s.cpu, 'body', 'L');
        else if (key === 'n') punch(s.player, s.cpu, 'star', 'R');
      }

      // P2 keyboard punches (2P only)
      if (gameMode === '2p') {
        if (key === 'j') punch(s.cpu, s.player, 'jab', hand);
        else if (key === 'k') punch(s.cpu, s.player, 'hook', 'L');
        else if (key === 'u') punch(s.cpu, s.player, 'uppercut', 'R');
        else if (key === 'i') punch(s.cpu, s.player, 'body', 'L');
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

      // Sway (more when fatigued)
      const fatigueMult = boxer.stamina < 25 ? 2.5 : boxer.stamina < 50 ? 1.5 : 1;
      const sway = Math.sin(Date.now() / (boxer.stamina < 25 ? 500 : 800) + (isPlayer ? 0 : 3)) * 2 * fatigueMult;
      bx += sway;

      // Dodge afterimage
      if (boxer.dodgeTimer > 8) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = isPlayer ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(bx - boxer.dodgeDir * 20, by - 10, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

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

      // Damage redness on skin
      const dmgPct = boxer.damage / 100;
      const baseSkin = isPlayer ? [244, 192, 137] : [139, 111, 71];
      const r = Math.min(255, Math.floor(baseSkin[0] + dmgPct * 60));
      const g = Math.max(0, Math.floor(baseSkin[1] - dmgPct * 40));
      const b = Math.max(0, Math.floor(baseSkin[2] - dmgPct * 30));
      const skinColor = `rgb(${r},${g},${b})`;
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
          } else if (pa.type === 'star') {
            lGloveX = bx + facing * (10 + punchExtend * 50);
            lGloveY = by + 5 - punchExtend * 45;
          } else {
            lGloveX = bx + facing * (20 + punchExtend * 50);
            lGloveY = by + 10;
          }
        }
        if (pa.hand === 'R' || pa.type === 'uppercut' || pa.type === 'star') {
          if (pa.type === 'jab') {
            rGloveX = bx + facing * (20 + punchExtend * 55);
            rGloveY = by + 4;
          } else if (pa.type === 'uppercut' || pa.type === 'star') {
            rGloveX = bx + facing * (10 + punchExtend * 45);
            rGloveY = by + 15 - punchExtend * 50;
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

      // Star punch glow
      const isStarPunch = boxer.punchAnim?.type === 'star';
      const activeGloveColor = isStarPunch ? '#ffd700' : gloveColor;
      if (isStarPunch) {
        const glow = 0.3 + 0.3 * Math.sin(Date.now() / 60);
        ctx.fillStyle = `rgba(255,215,0,${glow})`;
        ctx.beginPath(); ctx.arc(lGloveX, lGloveY, gloveSize + 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rGloveX, rGloveY, gloveSize + 6, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = activeGloveColor;
      ctx.beginPath(); ctx.arc(lGloveX, lGloveY, gloveSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rGloveX, rGloveY, gloveSize, 0, Math.PI * 2); ctx.fill();

      // Glove highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(lGloveX - 3, lGloveY - 3, gloveSize * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rGloveX - 3, rGloveY - 3, gloveSize * 0.5, 0, Math.PI * 2); ctx.fill();

      // CPU windup tell — glowing glove
      if (!isPlayer && s.cpuWindup > 0) {
        const tellPulse = 0.3 + 0.4 * Math.sin(Date.now() / 60);
        const tellColor = s.cpuWindupType === 'uppercut' ? `rgba(239,68,68,${tellPulse})` :
          s.cpuWindupType === 'hook' ? `rgba(251,191,36,${tellPulse})` : `rgba(255,255,255,${tellPulse * 0.7})`;
        ctx.fillStyle = tellColor;
        if (s.cpuWindupHand === 'L') {
          ctx.beginPath(); ctx.arc(lGloveX, lGloveY, gloveSize + 5, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(rGloveX, rGloveY, gloveSize + 5, 0, Math.PI * 2); ctx.fill();
        }
      }

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
      ctx.fillText(gameMode === '2p' ? 'P1' : 'YOU', 18, 27);
      ctx.textAlign = 'right';
      ctx.fillText(gameMode === '2p' ? 'P2' : 'CPU', W - 18, 27);

      // Stamina bar (player)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(15, 38, 120, 10);
      ctx.fillStyle = s.player.stamina < 25 ? '#ef4444' : '#facc15';
      ctx.fillRect(16, 39, 118 * (s.player.stamina / 100), 8);
      ctx.fillStyle = '#fff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('STA', 17, 47);

      // Stamina bar (CPU)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(W - 135, 38, 120, 10);
      ctx.fillStyle = s.cpu.stamina < 25 ? '#ef4444' : '#facc15';
      ctx.fillRect(W - 134, 39, 118 * (s.cpu.stamina / 100), 8);
      ctx.fillStyle = '#fff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('STA', W - 17, 47);

      // Star indicators (player)
      if (s.stars > 0) {
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        const starFlash = 0.7 + 0.3 * Math.sin(Date.now() / 200);
        ctx.globalAlpha = starFlash;
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★'.repeat(s.stars), 15, 62);
        ctx.globalAlpha = 1;
      }

      // Combo counter
      if (s.comboCount >= 2 && s.comboTimer > 0) {
        const scale = Math.min(1.6, 1 + s.comboCount * 0.12);
        ctx.font = `bold ${Math.floor(18 * scale)}px sans-serif`;
        ctx.fillStyle = s.comboCount >= 5 ? '#ef4444' : s.comboCount >= 3 ? '#fbbf24' : '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'left';
        const comboY = s.stars > 0 ? 78 : 62;
        ctx.strokeText(`${s.comboCount}x COMBO`, 15, comboY);
        ctx.fillText(`${s.comboCount}x COMBO`, 15, comboY);
      }

      // Round scorecard (between rounds)
      if (s.roundResults.length > 0 && (s.roundPhase === 'roundEnd' || s.roundPhase === 'countdown')) {
        ctx.textAlign = 'center';
        ctx.font = '10px sans-serif';
        for (let i = 0; i < s.roundResults.length; i++) {
          const rx = W / 2 - ((s.roundResults.length - 1) * 30) / 2 + i * 30;
          ctx.fillStyle = s.roundResults[i] === 'player' ? '#22c55e' : s.roundResults[i] === 'cpu' ? '#ef4444' : '#888';
          ctx.fillText(`R${i + 1}`, rx, 55);
          ctx.fillText(s.roundResults[i] === 'player' ? (gameMode === '2p' ? 'P1' : 'YOU') : s.roundResults[i] === 'cpu' ? (gameMode === '2p' ? 'P2' : 'CPU') : 'TIE', rx, 65);
        }
      }

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

        // Mash prompt
        if (s.koTarget === 'player' || (s.koTarget === 'cpu' && gameMode === '2p')) {
          const downed = s.koTarget === 'player' ? s.player : s.cpu;
          const label = s.koTarget === 'player' ? (gameMode === '2p' ? 'P1' : 'YOU') : 'P2';
          const flashAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100);
          ctx.globalAlpha = flashAlpha;
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`${label}: MASH KEYS TO GET UP!`, W / 2, H * 0.65);
          ctx.font = '13px sans-serif';
          ctx.fillText(`Mashes: ${downed.getUpMashes} / ${5 + downed.knockdownCount * 3}`, W / 2, H * 0.70);
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
          const p1Win = s.koTarget === 'cpu';
          ctx.fillText(p1Win ? `KNOCKOUT! ${gameMode === '2p' ? 'P1' : 'YOU'} WIN!` : `KO! ${gameMode === '2p' ? 'P2' : 'CPU'} WINS!`, W / 2, H * 0.4);
        } else {
          const p1Win = s.playerScore > s.cpuScore;
          const tie = s.playerScore === s.cpuScore;
          ctx.fillText(tie ? 'DRAW!' : p1Win ? `DECISION: ${gameMode === '2p' ? 'P1' : 'YOU'} WIN!` : `DECISION: ${gameMode === '2p' ? 'P2' : 'CPU'} WINS!`, W / 2, H * 0.4);
        }
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Final Score: ${s.playerScore} - ${s.cpuScore}`, W / 2, H * 0.5);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Use buttons below', W / 2, H * 0.62);
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
        if (gameMode === '2p') {
          ctx.fillText('P1: WASD=Move | SPACE=Block | Q/E=Dodge | F=Jab G=Hook R=Upper T=Body', W / 2, H * 0.83);
          ctx.fillText('P2: Arrows=Move | SHIFT=Block | ,/.=Dodge | J=Jab K=Hook U=Upper I=Body', W / 2, H * 0.88);
        } else {
          ctx.fillText('J = Left Punch | K = Right Punch | H = Hook | U = Upper | N = ★ Star', W / 2, H * 0.83);
          ctx.fillText('A/D = Move | SPACE = Block | Q/E = Dodge | Watch for glowing glove tells!', W / 2, H * 0.88);
          ctx.fillText('Punch type auto-picks based on distance & timing!', W / 2, H * 0.93);
        }
        ctx.globalAlpha = 1;
      }
    }

    function updateCPU(s: NonNullable<typeof stateRef.current>) {
      const cpu = s.cpu;
      const player = s.player;
      if (cpu.down || player.down || s.roundPhase !== 'fight') return;

      const dist = Math.abs(cpu.x - player.x);
      const windupTime = difficulty === 'easy' ? 28 : difficulty === 'medium' ? 18 : 10;

      // Movement AI — approach, maintain fighting distance
      const idealDist = 100 + (s.cpuPattern === 0 ? -20 : s.cpuPattern === 1 ? 15 : 0);
      if (dist > idealDist + 30) {
        cpu.x += cpu.x > player.x ? -1.8 : 1.8;
      } else if (dist < idealDist - 20) {
        cpu.x += cpu.x > player.x ? 1.2 : -1.2;
      } else {
        // Side-to-side movement when at range
        cpu.x += Math.sin(Date.now() / 600) * 0.8;
      }

      // Blocking AI — react to player punches
      if (player.punchAnim && Math.random() < cpuBlockChance) {
        cpu.blocking = true;
        s.cpuWindup = 0; // cancel windup if blocking
      } else if (!player.punchAnim && cpu.blocking && Math.random() < 0.08) {
        cpu.blocking = false;
      }

      // Dodge AI — dodge big punches
      if (player.punchAnim && player.punchAnim.timer > 5 && Math.random() < cpuDodgeChance && cpu.dodgeTimer <= 0) {
        cpu.dodgeDir = Math.random() < 0.5 ? -1 : 1;
        cpu.dodgeTimer = 15;
        cpu.blocking = false;
        s.cpuWindup = 0;
      }

      // Windup countdown — telegraph then execute
      if (s.cpuWindup > 0) {
        s.cpuWindup--;
        if (s.cpuWindup <= 0 && cpu.stunTimer <= 0 && !cpu.punchAnim && !cpu.blocking) {
          punch(cpu, player, s.cpuWindupType, s.cpuWindupHand);
        }
        return; // don't start new attacks while winding up
      }

      // Attack AI — start windup instead of instant punch
      if (cpu.stunTimer <= 0 && !cpu.punchAnim && !cpu.blocking && dist < 140 && s.cpuWindup <= 0) {
        const attackRoll = Math.random();
        if (attackRoll < cpuAggression) {
          cpu.blocking = false;
          const r = Math.random();
          const hand: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';
          let type: string;
          if (r < 0.4) type = 'jab';
          else if (r < 0.65) type = 'hook';
          else if (r < 0.8) type = 'body';
          else if (cpu.stamina > 25) type = 'uppercut';
          else type = 'jab';

          // Big punches get longer telegraph
          const extraTime = type === 'uppercut' ? 8 : type === 'hook' ? 4 : 0;
          s.cpuWindup = windupTime + extraTime;
          s.cpuWindupType = type;
          s.cpuWindupHand = hand;
        }
      }

      // Counter-attack after blocking — shorter windup
      if (cpu.counterWindow > 0 && !cpu.punchAnim && s.cpuWindup <= 0) {
        s.cpuWindup = Math.floor(windupTime * 0.4);
        s.cpuWindupType = Math.random() < 0.5 ? 'hook' : 'uppercut';
        s.cpuWindupHand = Math.random() < 0.5 ? 'L' : 'R';
        cpu.counterWindow = 0;
        cpu.blocking = false;
      }

      // Pattern changes — affects spacing preference
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
          const cpuGetsUp = s.koTarget === 'cpu' && downed.hp > 0 && (
            gameMode === '2p' ? downed.getUpMashes >= mashNeeded : Math.random() < (0.7 - downed.knockdownCount * 0.2)
          );

          if (s.koTarget === 'player' && downed.getUpMashes >= mashNeeded && downed.hp > 0) {
            // Player gets up!
            downed.down = false;
            downed.hp = Math.max(downed.hp, 15);
            downed.stamina = 30;
            s.roundPhase = 'fight';
            s.koTarget = null;
            s.message = "You're back up!";
            s.messageTimer = 50;
          } else if (cpuGetsUp && (gameMode === '2p' || s.countdownNum >= 4)) {
            downed.down = false;
            downed.hp = Math.max(downed.hp, 10);
            downed.stamina = 20;
            s.roundPhase = 'fight';
            s.koTarget = null;
            s.message = `${gameMode === '2p' ? 'P2' : 'CPU'} gets up!`;
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

      // Round end - corner rest
      if (s.roundPhase === 'roundEnd') {
        s.countdownTimer--;
        // Corner rest: heal a bit between rounds
        if (s.countdownTimer === 60) {
          s.cornerRest = true;
          s.player.hp = Math.min(100, s.player.hp + 8);
          s.cpu.hp = Math.min(100, s.cpu.hp + 5);
          s.player.stamina = Math.min(100, s.player.stamina + 30);
          s.cpu.stamina = Math.min(100, s.cpu.stamina + 25);
          s.player.damage = Math.max(0, s.player.damage - 10);
          s.cpu.damage = Math.max(0, s.cpu.damage - 10);
          s.message = 'Corner rest...';
          s.messageTimer = 50;
        }
        if (s.countdownTimer <= 0) {
          s.cornerRest = false;
          // Score round
          const pDmgDealt = 100 - s.cpu.hp;
          const cDmgDealt = 100 - s.player.hp;
          if (pDmgDealt > cDmgDealt) { s.playerScore++; s.roundResults.push('player'); }
          else if (cDmgDealt > pDmgDealt) { s.cpuScore++; s.roundResults.push('cpu'); }
          else s.roundResults.push('draw');

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

      // Particles update
      s.particles = s.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; pt.life--; return pt.life > 0; });

      // Counter window decay
      if (p.counterWindow > 0) p.counterWindow--;
      if (cpu.counterWindow > 0) cpu.counterWindow--;

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

      // P1 input
      if (!p.down && p.stunTimer <= 0) {
        // Movement (WASD; arrows only in 1P)
        if (s.keys.has('a') || (gameMode === '1p' && s.keys.has('arrowleft'))) p.x = Math.max(W * 0.1, p.x - 2.5);
        if (s.keys.has('d') || (gameMode === '1p' && s.keys.has('arrowright'))) p.x = Math.min(W * 0.55, p.x + 2.5);
        if (s.keys.has('w') || (gameMode === '1p' && s.keys.has('arrowup'))) p.x = Math.min(p.x + 1.5, cpu.x - 60);

        // Block (keyboard = hold SPACE; mobile toggle handled separately)
        if (s.keys.has(' ')) p.blocking = true;
        else if (s.keys.size > 0) p.blocking = false; // only unblock from keyboard if keys are being used

        // Dodge
        if (s.keys.has('q') && p.dodgeTimer <= 0 && !p.blocking) {
          p.dodgeDir = -1; p.dodgeTimer = 15;
        }
        if (s.keys.has('e') && p.dodgeTimer <= 0 && !p.blocking) {
          p.dodgeDir = 1; p.dodgeTimer = 15;
        }
      }

      // P2 input (2P) or CPU AI (1P)
      if (gameMode === '2p') {
        if (!cpu.down && cpu.stunTimer <= 0) {
          // P2 movement: arrow keys
          if (s.keys.has('arrowleft')) cpu.x = Math.max(W * 0.45, cpu.x - 2.5);
          if (s.keys.has('arrowright')) cpu.x = Math.min(W * 0.92, cpu.x + 2.5);
          if (s.keys.has('arrowdown')) cpu.x = Math.max(cpu.x - 1.5, p.x + 60);
          // P2 block: Shift
          cpu.blocking = s.keys.has('shift');
          // P2 dodge: comma/period
          if (s.keys.has(',') && cpu.dodgeTimer <= 0 && !cpu.blocking) {
            cpu.dodgeDir = -1; cpu.dodgeTimer = 15;
          }
          if (s.keys.has('.') && cpu.dodgeTimer <= 0 && !cpu.blocking) {
            cpu.dodgeDir = 1; cpu.dodgeTimer = 15;
          }
        }
      } else {
        updateCPU(s);
      }

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

      // Draw particles
      for (const pt of s.particles) {
        ctx2.globalAlpha = pt.life / 20;
        ctx2.fillStyle = pt.color;
        ctx2.beginPath(); ctx2.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx2.fill();
      }
      ctx2.globalAlpha = 1;

      // Counter window indicator (subtle glow only)
      if (s.player.counterWindow > 0) {
        const flash = 0.5 + 0.5 * Math.sin(Date.now() / 50);
        ctx2.fillStyle = `rgba(255,200,0,${flash * 0.2})`;
        ctx2.beginPath();
        ctx2.arc(s.player.x, s.player.y - 10, 30, 0, Math.PI * 2);
        ctx2.fill();
      }

      // Corner rest visual (subtle dim only)
      if (s.cornerRest) {
        ctx2.fillStyle = 'rgba(0,0,0,0.2)';
        ctx2.fillRect(0, 0, W, H);
      }

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
  }, [punch, gameMode, cpuAggression, cpuBlockChance, cpuDodgeChance, gameKey]);

  // Button handlers for mobile/click
  const doAttack = (type: string, hand: 'L' | 'R') => {
    const s = stateRef.current;
    if (!s || s.roundPhase !== 'fight') return;
    punch(s.player, s.cpu, type, hand);
  };

  // Smart punch — auto-picks type based on distance and context
  const doSmartPunch = (hand: 'L' | 'R') => {
    const s = stateRef.current;
    if (!s || s.roundPhase !== 'fight') return;
    if (s.player.blocking) { s.player.blocking = false; forceUpdate(n => n + 1); } // drop guard to punch
    const dist = Math.abs(s.player.x - s.cpu.x);
    let type = 'jab';
    if (s.cpu.stunTimer > 12 && dist < 115) type = 'uppercut';
    else if (dist < 85) type = 'hook';
    else if (s.cpu.hp < 20 && dist < 120) type = 'body';
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

      {/* Mobile Controls - Simplified Wii-style */}
      <div className="w-full max-w-[600px] space-y-1.5">
        <div className="flex gap-1.5 justify-center">
          <button onPointerDown={() => doSmartPunch('L')} className="px-5 py-3 bg-red-500 text-white font-bold rounded-lg active:scale-90 transition-all text-sm shadow-lg">👊 Left</button>
          <button onPointerDown={() => doSmartPunch('R')} className="px-5 py-3 bg-red-500 text-white font-bold rounded-lg active:scale-90 transition-all text-sm shadow-lg">Right 👊</button>
          <button
            onPointerDown={() => {
              const s = stateRef.current;
              if (s) { s.player.blocking = !s.player.blocking; forceUpdate(n => n + 1); }
            }}
            className={`px-5 py-3 font-bold rounded-lg active:scale-95 transition-all text-sm shadow-lg ${tick >= 0 && stateRef.current?.player.blocking ? 'bg-blue-700 text-white ring-2 ring-blue-300' : 'bg-blue-500 text-white'}`}
          >{tick >= 0 && stateRef.current?.player.blocking ? '🛡 UP' : '🛡 Block'}</button>
        </div>
        <div className="flex gap-1.5 justify-center">
          <button onPointerDown={() => { doMove(-1); doDodge(-1); }} className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">← Dodge</button>
          <button onPointerDown={() => doAttack('star', 'R')} className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg border-2 border-yellow-300">★ Star</button>
          <button onPointerDown={mashGetUp} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">Mash!</button>
          <button onPointerDown={() => { doMove(1); doDodge(1); }} className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg">Dodge →</button>
        </div>
      </div>

      {tick >= 0 && stateRef.current?.roundPhase === 'matchEnd' && (
        <div className="bg-black/40 rounded-2xl px-4 py-3 text-center w-full max-w-[600px] flex gap-2 justify-center">
          <button onClick={() => setGameKey(k => k + 1)} className="px-6 py-2 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all">Play Again</button>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 active:scale-95 transition-all">Back</button>
        </div>
      )}
      <button onClick={onExit} className="px-4 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs hover:bg-white/20 transition-colors">← Back</button>
    </div>
  );
}

// ═══════ TENNIS (Wii Sports Style) ═══════
function Tennis({ difficulty, gameMode, onExit }: { difficulty: Difficulty; gameMode: GameMode; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [tick, forceUpdate] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const W = 600, H = 420;
  const COURT_LEFT = 60, COURT_RIGHT = W - 60, COURT_TOP = 70, COURT_BOTTOM = H - 50;
  const NET_Y = (COURT_TOP + COURT_BOTTOM) / 2;
  const cpuSkill = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.97;

  const stateRef = useRef<{
    // Players
    playerX: number; playerY: number; playerSwing: number; playerSwingType: string;
    cpuX: number; cpuY: number; cpuSwing: number; cpuSwingType: string;
    // Ball
    ballX: number; ballY: number; ballZ: number; ballVX: number; ballVY: number; ballVZ: number;
    ballSpin: number; ballActive: boolean; ballShadowX: number; ballShadowY: number;
    // Scoring - proper tennis
    playerPoints: number; cpuPoints: number;
    playerGames: number; cpuGames: number;
    playerSets: number; cpuSets: number;
    // State
    serving: boolean; server: 'player' | 'cpu'; serveSide: 'left' | 'right';
    rally: number; lastHitter: 'player' | 'cpu' | null;
    phase: 'playing' | 'point' | 'gameOver';
    message: string; messageTimer: number;
    bounced: boolean; bouncedInCourt: boolean;
    // Input
    mouseX: number; mouseY: number; keys: Set<string>;
    // Match
    matchOver: boolean; winner: string;
    introTimer: number;
    serveTimer: number;
    pointDelay: number;
    // Swing timing
    swingReadyTimer: number; swingQuality: string; swingQualityTimer: number;
    // New
    playerStamina: number; cpuStamina: number;
    servePower: number; servePowerDir: number; servePowerPhase: boolean;
    spinType: 'flat' | 'topspin' | 'slice';
    umpireCall: string; umpireTimer: number;
    ballMarks: { x: number; y: number; life: number }[];
    particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
  } | null>(null);

  function pointName(pts: number): string {
    return ['0', '15', '30', '40'][pts] || '40';
  }

  const p1Label = gameMode === '2p' ? 'P1' : 'YOU';
  const p2Label = gameMode === '2p' ? 'P2' : 'CPU';

  function scoreString(s: NonNullable<typeof stateRef.current>): string {
    if (s.playerPoints >= 3 && s.cpuPoints >= 3) {
      if (s.playerPoints === s.cpuPoints) return 'Deuce';
      if (s.playerPoints > s.cpuPoints) return `Ad - ${p1Label}`;
      return `Ad - ${p2Label}`;
    }
    return `${pointName(s.playerPoints)} - ${pointName(s.cpuPoints)}`;
  }

  function initState() {
    stateRef.current = {
      playerX: W / 2, playerY: COURT_BOTTOM - 30, playerSwing: 0, playerSwingType: 'fore',
      cpuX: W / 2, cpuY: COURT_TOP + 30, cpuSwing: 0, cpuSwingType: 'fore',
      ballX: W / 2, ballY: COURT_BOTTOM - 50, ballZ: 0, ballVX: 0, ballVY: 0, ballVZ: 0,
      ballSpin: 0, ballActive: false, ballShadowX: W / 2, ballShadowY: COURT_BOTTOM - 50,
      playerPoints: 0, cpuPoints: 0, playerGames: 0, cpuGames: 0, playerSets: 0, cpuSets: 0,
      serving: true, server: 'player', serveSide: 'right',
      rally: 0, lastHitter: null,
      phase: 'playing', message: '', messageTimer: 0,
      bounced: false, bouncedInCourt: false,
      mouseX: W / 2, mouseY: COURT_BOTTOM - 30, keys: new Set(),
      matchOver: false, winner: '',
      introTimer: 120, serveTimer: 60, pointDelay: 0,
      // New
      playerStamina: 100, cpuStamina: 100,
      servePower: 0, servePowerDir: 1, servePowerPhase: false,
      swingReadyTimer: 0, swingQuality: '', swingQualityTimer: 0,
      spinType: 'flat' as 'flat' | 'topspin' | 'slice',
      umpireCall: '', umpireTimer: 0,
      ballMarks: [] as { x: number; y: number; life: number }[],
      particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    };
  }

  useEffect(() => {
    initState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current?.keys.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current?.keys.delete(e.key.toLowerCase());
    };
    const handleMouse = (e: MouseEvent) => {
      const s = stateRef.current; if (!s) return;
      const rect = canvas.getBoundingClientRect();
      s.mouseX = ((e.clientX - rect.left) / rect.width) * W;
      s.mouseY = ((e.clientY - rect.top) / rect.height) * H;
    };
    const handleTouch = (e: TouchEvent) => {
      const s = stateRef.current; if (!s) return;
      const rect = canvas.getBoundingClientRect();
      s.mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
      s.mouseY = ((e.touches[0].clientY - rect.top) / rect.height) * H;
    };
    const handleClick = () => {
      const s = stateRef.current; if (!s) return;
      if (s.matchOver) { forceUpdate(n => n + 1); return; }
      if (s.serving && s.server === 'player' && s.serveTimer <= 0) {
        doServe(s, 'player');
      } else if (s.ballActive && s.playerSwing <= 0) {
        attemptSwing(s, 'player');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('click', handleClick);

    function doServe(s: NonNullable<typeof stateRef.current>, who: 'player' | 'cpu') {
      s.serving = false;
      s.ballActive = true;
      s.bounced = false;
      s.bouncedInCourt = false;
      s.lastHitter = who;
      s.rally = 0;

      if (who === 'player') {
        const sPow = s.servePowerPhase ? s.servePower / 100 : 0.55;
        const sAcc = sPow > 0.65 ? (sPow - 0.65) * 2.5 : 0; // high power = less accuracy
        const targetX = s.serveSide === 'right' ? W * 0.35 + Math.random() * 60 : W * 0.45 + Math.random() * 60;
        s.ballX = s.playerX;
        s.ballY = s.playerY - 10;
        s.ballZ = 30;
        s.ballVX = (targetX - s.ballX) * (0.018 + sPow * 0.014) + (Math.random() - 0.5) * sAcc * 3;
        s.ballVY = -(3.8 + sPow * 2.2);
        s.ballVZ = 2.5 + sPow * 1.5;
        s.ballSpin = (Math.random() - 0.5) * 0.3;
        s.playerSwing = 15;
        s.playerSwingType = 'serve';
        s.servePowerPhase = false;
        s.servePower = 0;
      } else {
        const targetX = s.serveSide === 'right' ? W * 0.45 + Math.random() * 60 : W * 0.35 + Math.random() * 60;
        s.ballX = s.cpuX;
        s.ballY = s.cpuY + 10;
        s.ballZ = 30;
        s.ballVX = (targetX - s.ballX) * 0.025;
        s.ballVY = 4 + Math.random();
        s.ballVZ = 3;
        s.ballSpin = (Math.random() - 0.5) * 0.3;
        s.cpuSwing = 15;
        s.cpuSwingType = 'serve';
      }
    }

    function attemptSwing(s: NonNullable<typeof stateRef.current>, who: 'player' | 'cpu') {
      const px = who === 'player' ? s.playerX : s.cpuX;
      const py = who === 'player' ? s.playerY : s.cpuY;
      const dist = Math.sqrt((s.ballX - px) ** 2 + (s.ballY - py) ** 2);
      const reachRange = who === 'player' ? 55 : 50;

      if (dist > reachRange || s.ballZ > 40) return false;

      const isBackhand = who === 'player' ? s.ballX < px : s.ballX > px;
      const swingType = isBackhand ? 'back' : 'fore';

      if (who === 'player') {
        s.playerSwing = 18;
        s.playerSwingType = swingType;
        s.lastHitter = 'player';

        // Stamina cost
        s.playerStamina = Math.max(0, s.playerStamina - 3);
        const staminaMult = 0.7 + (s.playerStamina / 100) * 0.3;
        // Timing quality
        const t = s.swingReadyTimer;
        const timingMult = t <= 5 ? 0.72 : t <= 18 ? 1.25 : 0.82;
        s.swingQuality = t <= 5 ? 'EARLY' : t <= 18 ? 'PERFECT!' : 'LATE';
        s.swingQualityTimer = 45;
        s.swingReadyTimer = 0;

        // Spin type affects ball
        const spin = s.spinType;
        const spinVXBonus = spin === 'slice' ? 1.5 : spin === 'topspin' ? -0.5 : 0;
        const spinVZBonus = spin === 'topspin' ? -0.5 : spin === 'slice' ? 1 : 0;
        const spinBall = spin === 'topspin' ? 0.6 : spin === 'slice' ? -0.4 : 0;

        // Aim toward CPU side
        const aimX = s.cpuX + (Math.random() - 0.5) * 200;
        const aimY = COURT_TOP + 20 + Math.random() * 60;
        const dx = aimX - s.ballX;
        const dy = aimY - s.ballY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const speed = (4 + Math.random() * 2) * staminaMult * timingMult;
        s.ballVX = (dx / d) * speed * 0.7 + spinVXBonus;
        s.ballVY = (dy / d) * speed;
        s.ballVZ = 2.5 + Math.random() * 1.5 + spinVZBonus;
        s.ballSpin = spinBall;

        // Particle on hit
        s.particles.push({ x: s.ballX, y: s.ballY, vx: 0, vy: -2, life: 10, color: '#ccff00' });

        // Lob if holding up
        if (s.keys.has('w') || s.keys.has('arrowup')) {
          s.ballVZ = 5;
          s.ballVY *= 0.8;
        }
      } else {
        s.cpuSwing = 18;
        s.cpuSwingType = swingType;
        s.lastHitter = 'cpu';

        const aimX = s.playerX + (Math.random() - 0.5) * 180 * cpuSkill;
        const aimY = COURT_BOTTOM - 30 - Math.random() * 50;
        const dx = aimX - s.ballX;
        const dy = aimY - s.ballY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const speed = 3.5 + Math.random() * 2 * cpuSkill;
        s.ballVX = (dx / d) * speed * 0.7;
        s.ballVY = (dy / d) * speed;
        s.ballVZ = 2 + Math.random() * 2;
        s.ballSpin = (Math.random() - 0.5) * 0.4;
      }

      s.bounced = false;
      s.bouncedInCourt = false;
      s.rally++;
      return true;
    }

    function awardPoint(s: NonNullable<typeof stateRef.current>, to: 'player' | 'cpu', msg: string) {
      s.phase = 'point';
      s.message = msg;
      s.messageTimer = 80;
      s.ballActive = false;
      s.pointDelay = 80;
      s.umpireCall = msg;
      s.umpireTimer = 60;

      if (to === 'player') s.playerPoints++;
      else s.cpuPoints++;

      // Check game win
      const pp = s.playerPoints, cp = s.cpuPoints;
      const gameWon = (pp >= 4 && pp - cp >= 2) ? 'player' : (cp >= 4 && cp - pp >= 2) ? 'cpu' : null;
      if (gameWon) {
        if (gameWon === 'player') s.playerGames++;
        else s.cpuGames++;
        s.playerPoints = 0;
        s.cpuPoints = 0;
        s.server = s.server === 'player' ? 'cpu' : 'player';
        s.message = `Game - ${gameWon === 'player' ? p1Label : p2Label}!`;

        // Check set win
        const pg = s.playerGames, cg = s.cpuGames;
        const setWon = (pg >= 6 && pg - cg >= 2) ? 'player' : (cg >= 6 && cg - pg >= 2) ? 'cpu' : null;
        if (setWon) {
          if (setWon === 'player') s.playerSets++;
          else s.cpuSets++;
          s.playerGames = 0;
          s.cpuGames = 0;
          s.message = `Set - ${setWon === 'player' ? p1Label : p2Label}!`;

          // Check match
          if (s.playerSets >= 2 || s.cpuSets >= 2) {
            s.matchOver = true;
            s.winner = s.playerSets >= 2 ? `${p1Label} WIN${gameMode === '2p' ? 'S' : ''}!` : `${p2Label} Wins!`;
            s.phase = 'gameOver';
            s.message = s.winner;
            forceUpdate(n => n + 1);
          }
        }
      }

      s.serveSide = s.serveSide === 'right' ? 'left' : 'right';
    }

    function update() {
      const s = stateRef.current;
      if (!s || s.matchOver) return;

      if (s.introTimer > 0) { s.introTimer--; return; }

      // Message timer
      if (s.messageTimer > 0) s.messageTimer--;

      // Swing timers
      if (s.playerSwing > 0) s.playerSwing--;
      if (s.cpuSwing > 0) s.cpuSwing--;

      // Point delay
      if (s.phase === 'point') {
        s.pointDelay--;
        if (s.pointDelay <= 0) {
          s.phase = 'playing';
          s.serving = true;
          s.serveTimer = 40;
          s.ballActive = false;
          if (s.server === 'player') {
            s.ballX = s.serveSide === 'right' ? W * 0.6 : W * 0.4;
            s.ballY = COURT_BOTTOM - 50;
          } else {
            s.ballX = s.serveSide === 'right' ? W * 0.4 : W * 0.6;
            s.ballY = COURT_TOP + 50;
          }
          s.ballZ = 0; s.ballVX = 0; s.ballVY = 0; s.ballVZ = 0;
        }
        return;
      }

      // Serve timer
      if (s.serveTimer > 0) s.serveTimer--;

      // Serve power oscillation (player)
      if (s.serving && s.server === 'player' && s.serveTimer <= 0 && !s.ballActive) {
        s.servePowerPhase = true;
        s.servePower += s.servePowerDir * 1.8;
        if (s.servePower >= 100) { s.servePower = 100; s.servePowerDir = -1; }
        if (s.servePower <= 0) { s.servePower = 0; s.servePowerDir = 1; }
      } else if (!s.serving) {
        s.servePowerPhase = false;
      }

      // P2/CPU serve
      if (s.serving && s.server === 'cpu' && s.serveTimer <= 0) {
        if (gameMode === '2p') {
          if (s.keys.has('enter')) doServe(s, 'cpu');
        } else {
          doServe(s, 'cpu');
        }
      }

      // Stamina regen
      s.playerStamina = Math.min(100, s.playerStamina + 0.03);
      s.cpuStamina = Math.min(100, s.cpuStamina + 0.03);

      // Spin type detection
      if (s.keys.has('1')) s.spinType = 'flat';
      else if (s.keys.has('2')) s.spinType = 'topspin';
      else if (s.keys.has('3')) s.spinType = 'slice';

      // Umpire timer
      if (s.umpireTimer > 0) s.umpireTimer--;

      // Ball marks
      s.ballMarks = s.ballMarks.filter(m => { m.life--; return m.life > 0; });

      // Particles
      s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });

      // P1 movement (WASD; arrows only in 1P)
      const moveSpeed = 3.5;
      if (s.keys.has('a') || (gameMode === '1p' && s.keys.has('arrowleft'))) s.playerX -= moveSpeed;
      if (s.keys.has('d') || (gameMode === '1p' && s.keys.has('arrowright'))) s.playerX += moveSpeed;
      if (s.keys.has('w') || (gameMode === '1p' && s.keys.has('arrowup'))) s.playerY -= moveSpeed * 0.7;
      if (s.keys.has('s') || (gameMode === '1p' && s.keys.has('arrowdown'))) s.playerY += moveSpeed * 0.7;

      // Mouse pull (gentle, P1 only)
      s.playerX += (s.mouseX - s.playerX) * 0.04;
      s.playerY += (s.mouseY - s.playerY) * 0.02;

      // Clamp P1
      s.playerX = Math.max(COURT_LEFT - 20, Math.min(COURT_RIGHT + 20, s.playerX));
      s.playerY = Math.max(NET_Y + 20, Math.min(H - 15, s.playerY));

      // Swing quality timer
      if (s.swingQualityTimer > 0) s.swingQualityTimer--;

      // P1 swing when ball is close
      if (s.ballActive && s.playerSwing <= 0 && !s.serving) {
        const dist = Math.sqrt((s.ballX - s.playerX) ** 2 + (s.ballY - s.playerY) ** 2);
        const inRange = dist < 45 && s.ballY > NET_Y && s.ballZ < 30 && s.lastHitter !== 'player';
        if (inRange) {
          s.swingReadyTimer++;
          if (s.keys.has(' ') || s.keys.has('j') || s.keys.has('k')) {
            attemptSwing(s, 'player');
          }
        } else {
          s.swingReadyTimer = 0;
        }
      } else {
        s.swingReadyTimer = 0;
      }

      // P2/CPU movement
      if (gameMode === '2p') {
        // P2 uses arrow keys
        if (s.keys.has('arrowleft')) s.cpuX -= moveSpeed;
        if (s.keys.has('arrowright')) s.cpuX += moveSpeed;
        if (s.keys.has('arrowup')) s.cpuY -= moveSpeed * 0.7;
        if (s.keys.has('arrowdown')) s.cpuY += moveSpeed * 0.7;
      } else {
        // CPU AI movement
        if (s.ballActive && !s.serving) {
          let targetX = s.ballX;
          let targetY = s.ballY - 15;
          if (s.lastHitter === 'cpu') { targetX = W / 2; targetY = COURT_TOP + 40; }
          const cpuMoveSpeed = 2 + cpuSkill * 2;
          s.cpuX += (targetX - s.cpuX) * 0.05 * cpuMoveSpeed;
          s.cpuY += (targetY - s.cpuY) * 0.03 * cpuMoveSpeed;
        } else {
          s.cpuX += (W / 2 - s.cpuX) * 0.03;
          s.cpuY += ((COURT_TOP + 40) - s.cpuY) * 0.03;
        }
      }
      s.cpuX = Math.max(COURT_LEFT - 20, Math.min(COURT_RIGHT + 20, s.cpuX));
      s.cpuY = Math.max(15, Math.min(NET_Y - 20, s.cpuY));

      // P2/CPU swing
      if (s.ballActive && s.cpuSwing <= 0 && s.lastHitter !== 'cpu') {
        const dist = Math.sqrt((s.ballX - s.cpuX) ** 2 + (s.ballY - s.cpuY) ** 2);
        if (dist < 50 && s.ballY < NET_Y && s.ballZ < 30) {
          if (gameMode === '2p') {
            if (s.keys.has('enter')) attemptSwing(s, 'cpu');
          } else {
            if (Math.random() < cpuSkill * 0.8 + 0.15) attemptSwing(s, 'cpu');
          }
        }
      }

      // Ball physics
      if (s.ballActive) {
        s.ballX += s.ballVX;
        s.ballY += s.ballVY;
        s.ballZ += s.ballVZ;
        s.ballVZ -= 0.18; // gravity
        s.ballVX += s.ballSpin * 0.02;

        // Shadow follows ball X/Y
        s.ballShadowX = s.ballX;
        s.ballShadowY = s.ballY;

        // Bounce
        if (s.ballZ <= 0 && s.ballVZ < 0) {
          s.ballZ = 0;

          if (!s.bounced) {
            s.bounced = true;
            // Ball mark
            s.ballMarks.push({ x: s.ballX, y: s.ballY, life: 180 });
            s.particles.push({ x: s.ballX, y: s.ballY, vx: 0, vy: -1, life: 8, color: 'rgba(255,255,255,0.5)' });
            // Check if bounce is in court
            const inCourt = s.ballX >= COURT_LEFT && s.ballX <= COURT_RIGHT &&
              s.ballY >= COURT_TOP && s.ballY <= COURT_BOTTOM;
            s.bouncedInCourt = inCourt;

            if (!inCourt) {
              // Out!
              if (s.lastHitter === 'player') {
                awardPoint(s, 'cpu', 'OUT!');
              } else {
                awardPoint(s, 'player', 'OUT!');
              }
              return;
            }

            s.ballVZ = Math.abs(s.ballVZ) * 0.55;
            s.ballVX *= 0.8;
            s.ballVY *= 0.8;
          } else {
            // Second bounce = point
            if (s.ballY > NET_Y) {
              // Bounced on player side twice
              awardPoint(s, 'cpu', s.rally > 0 ? 'Double bounce!' : 'Ace!');
            } else {
              awardPoint(s, 'player', s.rally > 2 ? 'Winner!' : 'Point!');
            }
            return;
          }
        }

        // Net collision
        if (s.ballZ < 15) {
          const prevY = s.ballY - s.ballVY;
          if ((prevY < NET_Y && s.ballY >= NET_Y) || (prevY > NET_Y && s.ballY <= NET_Y)) {
            if (s.ballZ < 12) {
              // Hit net
              s.ballVY *= -0.3;
              s.ballVX *= 0.5;
              s.ballVZ = 1;
              s.message = 'Net!';
              s.messageTimer = 30;
              // Ball falls on hitter's side = point for other
              if (Math.abs(s.ballVY) < 0.5) {
                if (s.lastHitter === 'player') awardPoint(s, 'cpu', 'Net!');
                else awardPoint(s, 'player', 'Net!');
                return;
              }
            }
          }
        }

        // Out of bounds (sides)
        if (s.ballX < COURT_LEFT - 40 || s.ballX > COURT_RIGHT + 40 || s.ballY < COURT_TOP - 60 || s.ballY > COURT_BOTTOM + 60) {
          if (s.lastHitter === 'player') awardPoint(s, 'cpu', 'Out!');
          else awardPoint(s, 'player', 'Out!');
        }
      }
    }

    function drawCourt(ctx: CanvasRenderingContext2D) {
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#87ceeb');
      skyGrad.addColorStop(0.4, '#a8d8ea');
      skyGrad.addColorStop(1, '#5a9e6f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Court surface
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(COURT_LEFT - 15, COURT_TOP - 15, COURT_RIGHT - COURT_LEFT + 30, COURT_BOTTOM - COURT_TOP + 30);

      // Court lines
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      // Outer boundary
      ctx.strokeRect(COURT_LEFT, COURT_TOP, COURT_RIGHT - COURT_LEFT, COURT_BOTTOM - COURT_TOP);
      // Center service line
      ctx.beginPath();
      ctx.moveTo(COURT_LEFT, NET_Y);
      ctx.lineTo(COURT_RIGHT, NET_Y);
      ctx.stroke();
      // Singles sidelines (inner)
      const singleInset = 30;
      ctx.strokeRect(COURT_LEFT + singleInset, COURT_TOP, COURT_RIGHT - COURT_LEFT - singleInset * 2, COURT_BOTTOM - COURT_TOP);
      // Service boxes
      const serviceTop = NET_Y - 80;
      const serviceBottom = NET_Y + 80;
      ctx.beginPath();
      ctx.moveTo(COURT_LEFT + singleInset, serviceTop);
      ctx.lineTo(COURT_RIGHT - singleInset, serviceTop);
      ctx.moveTo(COURT_LEFT + singleInset, serviceBottom);
      ctx.lineTo(COURT_RIGHT - singleInset, serviceBottom);
      // Center T
      ctx.moveTo(W / 2, serviceTop);
      ctx.lineTo(W / 2, serviceBottom);
      ctx.stroke();

      // Net
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(COURT_LEFT - 20, NET_Y - 1, COURT_RIGHT - COURT_LEFT + 40, 3);
      // Net posts
      ctx.fillStyle = '#888';
      ctx.fillRect(COURT_LEFT - 22, NET_Y - 8, 5, 16);
      ctx.fillRect(COURT_RIGHT + 17, NET_Y - 8, 5, 16);
      // Net mesh suggestion
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      for (let x = COURT_LEFT - 15; x < COURT_RIGHT + 15; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, NET_Y - 6);
        ctx.lineTo(x, NET_Y);
        ctx.stroke();
      }
    }

    function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, isPlayer: boolean, swing: number, swingType: string) {
      ctx.save();
      const skinColor = isPlayer ? '#f4c089' : '#8b6f47';
      const shirtColor = isPlayer ? '#3b82f6' : '#ef4444';
      const facing = isPlayer ? -1 : 1;
      const scale = isPlayer ? 1.1 : 0.9; // perspective

      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 15, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, 8, 6, 14);
      ctx.fillRect(2, 8, 6, 14);
      // Shoes
      ctx.fillStyle = '#333';
      ctx.fillRect(-10, 20, 9, 4);
      ctx.fillRect(1, 20, 9, 4);

      // Body
      ctx.fillStyle = shirtColor;
      ctx.fillRect(-11, -10, 22, 20);

      // Head
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(0, -20, 12, 0, Math.PI * 2);
      ctx.fill();
      // Hair
      ctx.fillStyle = isPlayer ? '#4a3728' : '#1a1a1a';
      ctx.beginPath();
      ctx.arc(0, -24, 9, Math.PI, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#333';
      ctx.fillRect(-5, -22, 3, 3);
      ctx.fillRect(2, -22, 3, 3);

      // Arm + racket
      ctx.save();
      const armX = 10;
      const armY = -5;
      ctx.translate(armX, armY);

      if (swing > 0) {
        const swingProgress = 1 - swing / 18;
        const swingAngle = swingType === 'serve' ? -Math.PI * 0.8 + swingProgress * Math.PI * 1.2 :
          swingType === 'back' ? Math.PI * 0.3 - swingProgress * Math.PI * 0.8 :
          -Math.PI * 0.3 + swingProgress * Math.PI * 0.9;
        ctx.rotate(swingAngle);
      } else {
        ctx.rotate(facing * -0.3);
      }

      // Arm
      ctx.fillStyle = skinColor;
      ctx.fillRect(-2, -2, 22, 5);

      // Racket
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(20, -1, 10, 3);
      // Racket head
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(35, 0, 10, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,200,200,0.3)';
      ctx.fill();
      // Strings
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.5;
      for (let i = -8; i <= 8; i += 4) {
        ctx.beginPath(); ctx.moveTo(35 + i, -12); ctx.lineTo(35 + i, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(27, i); ctx.lineTo(43, i); ctx.stroke();
      }

      ctx.restore();
      ctx.restore();
    }

    function drawBall(ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) {
      if (!s.ballActive) return;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(s.ballShadowX, s.ballShadowY, 5 + s.ballZ * 0.05, 3 + s.ballZ * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ball (offset by Z)
      const drawY = s.ballY - s.ballZ;
      const size = 4 + s.ballZ * 0.03;
      ctx.fillStyle = '#ccff00';
      ctx.beginPath();
      ctx.arc(s.ballX, drawY, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#99cc00';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Fuzz line
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(s.ballX, drawY, size - 1.5, -0.5, 0.8);
      ctx.stroke();
    }

    function drawHUD(ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) {
      // Scoreboard
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(W / 2 - 130, 2, 260, 55);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(W / 2 - 130, 2, 260, 55);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';

      // Headers
      ctx.fillStyle = '#aaa';
      ctx.font = '9px sans-serif';
      ctx.fillText('SETS', W / 2 - 45, 14);
      ctx.fillText('GAMES', W / 2, 14);
      ctx.fillText('POINTS', W / 2 + 55, 14);

      // Player
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(p1Label, W / 2 - 80, 32);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${s.playerSets}`, W / 2 - 45, 34);
      ctx.fillText(`${s.playerGames}`, W / 2, 34);
      ctx.fillText(pointName(s.playerPoints), W / 2 + 55, 34);

      // CPU
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(p2Label, W / 2 - 80, 48);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${s.cpuSets}`, W / 2 - 45, 50);
      ctx.fillText(`${s.cpuGames}`, W / 2, 50);
      ctx.fillText(pointName(s.cpuPoints), W / 2 + 55, 50);

      // Deuce/Ad indicator
      if (s.playerPoints >= 3 && s.cpuPoints >= 3) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(scoreString(s), W / 2, 68);
      }

      // Rally counter
      if (s.rally >= 3 && s.ballActive) {
        ctx.textAlign = 'left';
        ctx.font = `bold 12px sans-serif`;
        ctx.fillStyle = s.rally >= 10 ? '#fbbf24' : '#a3e635';
        ctx.fillText(`Rally: ${s.rally}`, 8, 20);
      }

      // Serving indicator / serve power bar
      if (s.serving) {
        if (s.servePowerPhase && s.server === 'player') {
          // Power bar
          const bw = 160, bh = 14;
          const bx = W / 2 - bw / 2, by = H - 42;
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 5); else ctx.rect(bx - 2, by - 2, bw + 4, bh + 4); ctx.fill();
          const pct = s.servePower / 100;
          ctx.fillStyle = pct > 0.72 ? '#ef4444' : pct > 0.45 ? '#fbbf24' : '#22c55e';
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw * pct, bh, 3); else ctx.rect(bx, by, bw * pct, bh); ctx.fill();
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText('SERVE POWER — TAP!', W / 2, by - 5);
        } else {
          const flash = 0.5 + 0.5 * Math.sin(Date.now() / 200);
          ctx.globalAlpha = flash;
          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText(s.server === 'player' ? 'CLICK TO SERVE' : (gameMode === '2p' ? 'P2: ENTER TO SERVE' : 'CPU SERVING...'), W / 2, H - 15);
          ctx.globalAlpha = 1;
        }
      }

      // Swing ready glow
      if (s.swingReadyTimer > 0 && s.ballActive) {
        const pulse = 0.4 + 0.4 * Math.sin(Date.now() / 80);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = s.swingReadyTimer <= 5 ? '#fbbf24' : '#22c55e';
        ctx.beginPath();
        ctx.arc(s.playerX, s.playerY, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Swing quality text
      if (s.swingQualityTimer > 0) {
        const alpha = Math.min(1, s.swingQualityTimer / 15);
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${s.swingQuality === 'PERFECT!' ? 22 : 15}px sans-serif`;
        ctx.fillStyle = s.swingQuality === 'PERFECT!' ? '#fbbf24' : s.swingQuality === 'EARLY' ? '#94a3b8' : '#a3e635';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(s.swingQuality, s.playerX, s.playerY - 45);
        ctx.fillText(s.swingQuality, s.playerX, s.playerY - 45);
        ctx.globalAlpha = 1;
      }

      // Message
      if (s.messageTimer > 0) {
        const alpha = Math.min(1, s.messageTimer / 20);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(s.message, W / 2, H / 2);
        ctx.fillText(s.message, W / 2, H / 2);
        ctx.globalAlpha = 1;
      }

      // Particles (hit feedback only)
      for (const p of s.particles) {
        ctx.globalAlpha = p.life / 15;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Match over overlay
      if (s.matchOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(s.winner, W / 2, H * 0.4);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Sets: ${s.playerSets} (${p1Label}) - ${s.cpuSets} (${p2Label})`, W / 2, H * 0.5);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Use buttons below', W / 2, H * 0.62);
      }

      // (controls shown via mobile buttons - no overlay)
    }

    function render() {
      const s = stateRef.current;
      if (!s) return;
      const c = canvasRef.current?.getContext('2d');
      if (!c) return;
      drawCourt(c);
      // Draw back player first (CPU on top half)
      drawPlayer(c, s.cpuX, s.cpuY, false, s.cpuSwing, s.cpuSwingType);
      drawBall(c, s);
      drawPlayer(c, s.playerX, s.playerY, true, s.playerSwing, s.playerSwingType);
      drawHUD(c, s);
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
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('click', handleClick);
    };
  }, [cpuSkill, gameMode, p1Label, p2Label, gameKey]);

  const doSwing = () => {
    const s = stateRef.current;
    if (!s || s.matchOver) return;
    // Dispatch click to canvas — handles both serve (with power) and swing
    canvasRef.current?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // Also add space key for keyboard-based swing detection
    s.keys.add(' ');
    setTimeout(() => stateRef.current?.keys.delete(' '), 80);
  };

  const doMove = (dir: 'left' | 'right' | 'up' | 'down') => {
    const s = stateRef.current;
    if (!s) return;
    const amt = 20;
    if (dir === 'left') s.playerX -= amt;
    if (dir === 'right') s.playerX += amt;
    if (dir === 'up') s.playerY -= amt * 0.7;
    if (dir === 'down') s.playerY += amt * 0.7;
  };

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <canvas ref={canvasRef} width={W} height={H}
        className="rounded-xl border-2 border-white/20 shadow-2xl w-full max-w-[600px] cursor-pointer touch-none"
        tabIndex={0} />
      <div className="w-full max-w-[600px] space-y-1.5">
        <div className="flex gap-1.5 justify-center">
          <button onPointerDown={() => doMove('left')} className="px-3 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">← Move</button>
          <button onPointerDown={() => doMove('up')} className="px-3 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">↑ Fwd</button>
          <button onPointerDown={doSwing} className="px-5 py-2 bg-green-500 text-white font-bold rounded-lg active:scale-90 text-sm shadow-lg">Swing / Serve</button>
          <button onPointerDown={() => doMove('down')} className="px-3 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">↓ Back</button>
          <button onPointerDown={() => doMove('right')} className="px-3 py-2 bg-gray-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">Move →</button>
        </div>
        <div className="flex gap-1.5 justify-center flex-wrap">
          <button onPointerDown={() => { const s = stateRef.current; if (s) s.keys.add('w'); setTimeout(() => stateRef.current?.keys.delete('w'), 200); doSwing(); }} className="px-5 py-2 bg-cyan-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">Lob</button>
          <button onPointerDown={() => { const s = stateRef.current; if (s) s.spinType = 'flat'; }} className="px-3 py-2 bg-slate-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">Flat</button>
          <button onPointerDown={() => { const s = stateRef.current; if (s) s.spinType = 'topspin'; }} className="px-3 py-2 bg-orange-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">Topspin</button>
          <button onPointerDown={() => { const s = stateRef.current; if (s) s.spinType = 'slice'; }} className="px-3 py-2 bg-purple-500 text-white font-bold rounded-lg active:scale-90 text-xs shadow-lg">Slice</button>
        </div>
      </div>
      {tick >= 0 && stateRef.current?.matchOver && (
        <div className="bg-black/40 rounded-2xl px-4 py-3 text-center w-full max-w-[600px] flex gap-2 justify-center">
          <button onClick={() => setGameKey(k => k + 1)} className="px-6 py-2 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all">Play Again</button>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 active:scale-95 transition-all">Back</button>
        </div>
      )}
      <button onClick={onExit} className="px-4 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs hover:bg-white/20 transition-colors">← Back</button>
    </div>
  );
}

// ═══════ GOLF (Wii Sports Style) ═══════
interface GolfHole {
  par: number; teeX: number; teeY: number; holeX: number; holeY: number;
  fairway: { cx: number; cy: number; rx: number; ry: number; angle?: number }[];
  bunkers: { cx: number; cy: number; r: number }[];
  water: { cx: number; cy: number; rx: number; ry: number }[];
  trees: { x: number; y: number; size: number }[];
  name: string;
}

function Golf({ difficulty, gameMode, onExit }: { difficulty: Difficulty; gameMode: GameMode; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [tick, forceUpdate] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const W = 600, H = 440;
  const maxHoles = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 9;
  const windMult = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1 : 2.2;
  const meterSpeed = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1 : 2;

  const HOLES: GolfHole[] = [
    { name: 'The Opener', par: 3, teeX: 100, teeY: 380, holeX: 450, holeY: 100,
      fairway: [{ cx: 275, cy: 240, rx: 180, ry: 170 }],
      bunkers: [{ cx: 380, cy: 180, r: 25 }],
      water: [], trees: [{ x: 500, y: 200, size: 20 }, { x: 520, y: 300, size: 15 }] },
    { name: 'Dog Leg', par: 4, teeX: 80, teeY: 390, holeX: 520, holeY: 80,
      fairway: [{ cx: 200, cy: 300, rx: 120, ry: 120 }, { cx: 400, cy: 150, rx: 140, ry: 100 }],
      bunkers: [{ cx: 300, cy: 200, r: 30 }, { cx: 480, cy: 140, r: 20 }],
      water: [{ cx: 350, cy: 300, rx: 50, ry: 30 }],
      trees: [{ x: 250, y: 100, size: 22 }, { x: 150, y: 150, size: 18 }] },
    { name: 'Island Green', par: 3, teeX: 120, teeY: 370, holeX: 460, holeY: 120,
      fairway: [{ cx: 460, cy: 120, rx: 55, ry: 55 }],
      bunkers: [{ cx: 420, cy: 80, r: 15 }],
      water: [{ cx: 350, cy: 200, rx: 140, ry: 120 }],
      trees: [{ x: 530, y: 100, size: 16 }] },
    { name: 'The Long One', par: 5, teeX: 60, teeY: 400, holeX: 540, holeY: 60,
      fairway: [{ cx: 180, cy: 330, rx: 120, ry: 90 }, { cx: 350, cy: 200, rx: 100, ry: 80 }, { cx: 500, cy: 100, rx: 70, ry: 60 }],
      bunkers: [{ cx: 250, cy: 260, r: 22 }, { cx: 450, cy: 130, r: 25 }, { cx: 520, cy: 90, r: 15 }],
      water: [{ cx: 400, cy: 300, rx: 40, ry: 25 }],
      trees: [{ x: 300, y: 100, size: 20 }, { x: 100, y: 200, size: 18 }, { x: 480, y: 200, size: 15 }] },
    { name: 'Short & Sweet', par: 3, teeX: 300, teeY: 390, holeX: 300, holeY: 80,
      fairway: [{ cx: 300, cy: 235, rx: 80, ry: 170 }],
      bunkers: [{ cx: 240, cy: 120, r: 25 }, { cx: 360, cy: 120, r: 25 }],
      water: [], trees: [{ x: 180, y: 200, size: 20 }, { x: 420, y: 200, size: 20 }] },
    { name: 'Trap Alley', par: 4, teeX: 80, teeY: 220, holeX: 530, holeY: 220,
      fairway: [{ cx: 300, cy: 220, rx: 250, ry: 70 }],
      bunkers: [{ cx: 180, cy: 170, r: 20 }, { cx: 280, cy: 270, r: 22 }, { cx: 400, cy: 170, r: 25 }, { cx: 460, cy: 260, r: 18 }],
      water: [], trees: [{ x: 200, y: 100, size: 15 }, { x: 350, y: 320, size: 18 }, { x: 500, y: 120, size: 16 }] },
    { name: 'Lakeside', par: 4, teeX: 100, teeY: 380, holeX: 500, holeY: 100,
      fairway: [{ cx: 200, cy: 280, rx: 100, ry: 110 }, { cx: 420, cy: 140, rx: 110, ry: 80 }],
      bunkers: [{ cx: 470, cy: 160, r: 20 }],
      water: [{ cx: 310, cy: 200, rx: 70, ry: 50 }],
      trees: [{ x: 50, y: 250, size: 20 }, { x: 550, y: 200, size: 18 }] },
    { name: 'The Gauntlet', par: 4, teeX: 80, teeY: 380, holeX: 520, holeY: 60,
      fairway: [{ cx: 160, cy: 300, rx: 80, ry: 100 }, { cx: 350, cy: 180, rx: 90, ry: 70 }, { cx: 490, cy: 90, rx: 60, ry: 50 }],
      bunkers: [{ cx: 240, cy: 230, r: 25 }, { cx: 420, cy: 120, r: 20 }],
      water: [{ cx: 300, cy: 320, rx: 40, ry: 30 }, { cx: 450, cy: 200, rx: 35, ry: 25 }],
      trees: [{ x: 180, y: 150, size: 18 }, { x: 400, y: 250, size: 16 }, { x: 530, y: 150, size: 14 }] },
    { name: 'Championship', par: 5, teeX: 60, teeY: 220, holeX: 550, holeY: 220,
      fairway: [{ cx: 150, cy: 220, rx: 90, ry: 70 }, { cx: 300, cy: 150, rx: 80, ry: 60 }, { cx: 430, cy: 280, rx: 80, ry: 60 }, { cx: 530, cy: 220, rx: 50, ry: 45 }],
      bunkers: [{ cx: 220, cy: 280, r: 22 }, { cx: 370, cy: 100, r: 20 }, { cx: 500, cy: 180, r: 18 }],
      water: [{ cx: 350, cy: 250, rx: 45, ry: 35 }],
      trees: [{ x: 250, y: 120, size: 20 }, { x: 400, y: 350, size: 18 }, { x: 500, y: 100, size: 16 }] },
  ];

  type Club = 'driver' | 'iron' | 'wedge' | 'putter';
  const CLUBS: { id: Club; name: string; power: number; loft: number }[] = [
    { id: 'driver', name: 'Driver', power: 12, loft: 0.6 },
    { id: 'iron', name: '5 Iron', power: 8, loft: 0.8 },
    { id: 'wedge', name: 'Wedge', power: 5, loft: 1.2 },
    { id: 'putter', name: 'Putter', power: 3, loft: 0 },
  ];

  const stateRef = useRef<{
    holeIndex: number; strokes: number; scorecard: number[];
    ballX: number; ballY: number; ballZ: number;
    ballVX: number; ballVY: number; ballVZ: number;
    ballMoving: boolean; ballInHole: boolean;
    club: number; // index in CLUBS
    aimAngle: number; // radians, direction to aim
    powerPhase: 'aim' | 'charging' | 'swinging' | 'flying' | 'done' | 'intro';
    powerLevel: number; powerDir: number; // oscillating power meter
    swingAccuracy: number; accuracyDir: number; // accuracy meter
    windSpeed: number; windAngle: number;
    message: string; messageTimer: number;
    ballTrail: { x: number; y: number; z: number }[];
    lastBallX: number; lastBallY: number; // for water/OB reset
    terrain: string; // where ball is sitting
    matchOver: boolean;
    introTimer: number;
    landingAnim: number;
    distToHole: number;
    particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
    puttingMode: boolean; // true when near hole
    shotDistance: number; // how far last shot went
    // 2P fields
    currentPlayer: 1 | 2;
    p2Scorecard: number[];
    savedWind: { speed: number; angle: number } | null; // preserve wind for P2
  } | null>(null);

  function getScoreName(strokes: number, par: number): string {
    const diff = strokes - par;
    if (strokes === 1) return 'HOLE IN ONE!';
    if (diff <= -3) return 'Albatross!';
    if (diff === -2) return 'Eagle!';
    if (diff === -1) return 'Birdie!';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    return `+${diff}`;
  }

  function isOnFairway(x: number, y: number, hole: GolfHole): boolean {
    for (const fw of hole.fairway) {
      const dx = x - fw.cx;
      const dy = y - fw.cy;
      if ((dx * dx) / (fw.rx * fw.rx) + (dy * dy) / (fw.ry * fw.ry) <= 1) return true;
    }
    return false;
  }

  function isInBunker(x: number, y: number, hole: GolfHole): boolean {
    for (const b of hole.bunkers) {
      if (Math.sqrt((x - b.cx) ** 2 + (y - b.cy) ** 2) <= b.r) return true;
    }
    return false;
  }

  function isInWater(x: number, y: number, hole: GolfHole): boolean {
    for (const w of hole.water) {
      const dx = x - w.cx;
      const dy = y - w.cy;
      if ((dx * dx) / (w.rx * w.rx) + (dy * dy) / (w.ry * w.ry) <= 1) return true;
    }
    return false;
  }

  function hitsTree(x: number, y: number, hole: GolfHole): boolean {
    for (const t of hole.trees) {
      if (Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2) <= t.size) return true;
    }
    return false;
  }

  function initHole(holeIdx: number, player?: 1 | 2) {
    const hole = HOLES[holeIdx];
    const prev = stateRef.current;
    const isP2Switch = player === 2 && prev;
    const ws = isP2Switch && prev.savedWind ? prev.savedWind.speed : (0.5 + Math.random() * 2.5) * windMult;
    const wa = isP2Switch && prev.savedWind ? prev.savedWind.angle : Math.random() * Math.PI * 2;
    stateRef.current = {
      holeIndex: holeIdx,
      strokes: 0,
      scorecard: prev?.scorecard || [],
      ballX: hole.teeX, ballY: hole.teeY, ballZ: 0,
      ballVX: 0, ballVY: 0, ballVZ: 0,
      ballMoving: false, ballInHole: false,
      club: 0, aimAngle: Math.atan2(hole.holeY - hole.teeY, hole.holeX - hole.teeX),
      powerPhase: 'intro', powerLevel: 0, powerDir: 1,
      swingAccuracy: 50, accuracyDir: 1,
      windSpeed: ws, windAngle: wa,
      message: gameMode === '2p' ? `${player === 2 ? 'P2' : 'P1'} — ${hole.name}` : hole.name,
      messageTimer: 90,
      ballTrail: [], lastBallX: hole.teeX, lastBallY: hole.teeY,
      terrain: 'tee', matchOver: false,
      introTimer: 60, landingAnim: 0,
      distToHole: Math.sqrt((hole.holeX - hole.teeX) ** 2 + (hole.holeY - hole.teeY) ** 2),
      particles: [],
      puttingMode: false,
      shotDistance: 0,
      currentPlayer: player || 1,
      p2Scorecard: prev?.p2Scorecard || [],
      savedWind: player === 1 || !player ? { speed: ws, angle: wa } : prev?.savedWind || null,
    };
  }

  useEffect(() => {
    initHole(0);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;

      if (s.matchOver && e.key === 'Enter') { forceUpdate(n => n + 1); return; }
      if (s.ballInHole && e.key === 'Enter') {
        nextHole();
        return;
      }

      if (s.powerPhase === 'aim') {
        if (e.key === 'ArrowLeft' || e.key === 'a') s.aimAngle -= 0.05;
        if (e.key === 'ArrowRight' || e.key === 'd') s.aimAngle += 0.05;
        if (e.key === 'ArrowUp' || e.key === 'w') s.club = Math.max(0, s.club - 1);
        if (e.key === 'ArrowDown' || e.key === 's') s.club = Math.min(CLUBS.length - 1, s.club + 1);
        if (e.key === ' ' || e.key === 'Enter') {
          s.powerPhase = 'charging';
          s.powerLevel = 0;
          s.powerDir = 1;
        }
      } else if (s.powerPhase === 'charging') {
        if (e.key === ' ' || e.key === 'Enter') {
          s.powerPhase = 'swinging';
          s.swingAccuracy = 50;
          s.accuracyDir = 2;
        }
      } else if (s.powerPhase === 'swinging') {
        if (e.key === ' ' || e.key === 'Enter') {
          doSwing();
        }
      }
    };

    const handleClick = () => {
      const s = stateRef.current;
      if (!s) return;
      if (s.matchOver) { forceUpdate(n => n + 1); return; }
      if (s.ballInHole) { nextHole(); return; }
      if (s.powerPhase === 'aim') {
        s.powerPhase = 'charging'; s.powerLevel = 0; s.powerDir = 1;
      } else if (s.powerPhase === 'charging') {
        s.powerPhase = 'swinging'; s.swingAccuracy = 50; s.accuracyDir = 2;
      } else if (s.powerPhase === 'swinging') {
        doSwing();
      }
    };

    function nextHole() {
      const s = stateRef.current;
      if (!s) return;

      if (gameMode === '2p') {
        if (s.currentPlayer === 1) {
          // Save P1 score, switch to P2 on same hole
          s.scorecard.push(s.strokes);
          initHole(s.holeIndex, 2);
        } else {
          // Save P2 score, advance hole
          s.p2Scorecard.push(s.strokes);
          if (s.holeIndex + 1 >= maxHoles) {
            s.matchOver = true;
            s.message = 'Course Complete!';
            s.messageTimer = 200;
            forceUpdate(n => n + 1);
            return;
          }
          initHole(s.holeIndex + 1, 1);
        }
      } else {
        s.scorecard.push(s.strokes);
        if (s.holeIndex + 1 >= maxHoles) {
          s.matchOver = true;
          s.message = 'Course Complete!';
          s.messageTimer = 200;
          forceUpdate(n => n + 1);
          return;
        }
        initHole(s.holeIndex + 1);
      }
    }

    function doSwing() {
      const s = stateRef.current;
      if (!s) return;
      const club = CLUBS[s.club];
      const powerPct = s.powerLevel / 100;
      const accuracyOff = (s.swingAccuracy - 50) / 50; // -1 to 1

      const baseSpeed = club.power * powerPct;
      const angleOffset = accuracyOff * 0.25; // off-center = slice/hook
      const angle = s.aimAngle + angleOffset;

      s.ballVX = Math.cos(angle) * baseSpeed;
      s.ballVY = Math.sin(angle) * baseSpeed;
      s.ballVZ = baseSpeed * club.loft;
      s.ballMoving = true;
      s.powerPhase = 'flying';
      s.strokes++;
      s.lastBallX = s.ballX;
      s.lastBallY = s.ballY;
      s.ballTrail = [];
      s.message = '';
      s.landingAnim = 0;

      // Bunker penalty + sand splash
      if (s.terrain === 'bunker') {
        s.ballVX *= 0.6;
        s.ballVY *= 0.6;
        s.ballVZ *= 0.7;
        for (let i = 0; i < 12; i++) {
          s.particles.push({ x: s.ballX, y: s.ballY, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3 - 1, life: 15 + Math.random() * 10, color: '#f4d794' });
        }
      }

      // Rough penalty
      if (s.terrain === 'rough') {
        s.ballVX *= 0.85;
        s.ballVY *= 0.85;
      }

      s.shotDistance = 0;
    }

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);

    function update() {
      const s = stateRef.current;
      if (!s || s.matchOver) return;

      if (s.introTimer > 0) { s.introTimer--; if (s.introTimer <= 0) s.powerPhase = 'aim'; return; }
      if (s.messageTimer > 0) s.messageTimer--;
      if (s.landingAnim > 0) s.landingAnim--;

      // Power meter oscillation
      if (s.powerPhase === 'charging') {
        s.powerLevel += s.powerDir * 1.5 * meterSpeed;
        if (s.powerLevel >= 100) { s.powerLevel = 100; s.powerDir = -1; }
        if (s.powerLevel <= 0) { s.powerLevel = 0; s.powerDir = 1; }
      }

      // Accuracy meter oscillation
      if (s.powerPhase === 'swinging') {
        s.swingAccuracy += s.accuracyDir * 2 * meterSpeed;
        if (s.swingAccuracy >= 100) { s.swingAccuracy = 100; s.accuracyDir = -2; }
        if (s.swingAccuracy <= 0) { s.swingAccuracy = 0; s.accuracyDir = 2; }
      }

      // Distance to hole
      const hole = HOLES[s.holeIndex];
      s.distToHole = Math.sqrt((s.ballX - hole.holeX) ** 2 + (s.ballY - hole.holeY) ** 2);
      s.puttingMode = s.distToHole < 50 && !s.ballMoving;

      // Particles update
      s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--; return p.life > 0; });

      // Ball physics
      if (s.ballMoving) {
        // Wind (reduced for putter)
        const windMult = s.club === 3 ? 0.1 : 1;
        s.ballVX += Math.cos(s.windAngle) * s.windSpeed * 0.003 * windMult;
        s.ballVY += Math.sin(s.windAngle) * s.windSpeed * 0.003 * windMult;

        s.ballX += s.ballVX;
        s.ballY += s.ballVY;
        s.ballZ += s.ballVZ;
        s.ballVZ -= 0.12; // gravity

        // Trail
        s.ballTrail.push({ x: s.ballX, y: s.ballY, z: s.ballZ });
        if (s.ballTrail.length > 60) s.ballTrail.shift();

        const hole = HOLES[s.holeIndex];

        // Tree collision (only when ball is low)
        if (s.ballZ < 30 && s.ballZ > 0 && hitsTree(s.ballX, s.ballY, hole)) {
          s.ballVX *= -0.4;
          s.ballVY *= -0.4;
          s.ballVZ = Math.abs(s.ballVZ) * 0.3;
          s.message = 'Hit a tree!';
          s.messageTimer = 40;
        }

        // Landing
        if (s.ballZ <= 0 && s.ballVZ < 0) {
          s.ballZ = 0;

          // Check water
          if (isInWater(s.ballX, s.ballY, hole)) {
            // Water splash particles
            for (let i = 0; i < 16; i++) {
              s.particles.push({ x: s.ballX, y: s.ballY, vx: (Math.random() - 0.5) * 3.5, vy: -Math.random() * 4 - 1, life: 18 + Math.random() * 12, color: i % 3 === 0 ? '#93c5fd' : '#60a5fa' });
            }
            s.shotDistance = Math.sqrt((s.ballX - s.lastBallX) ** 2 + (s.ballY - s.lastBallY) ** 2);
            s.ballX = s.lastBallX;
            s.ballY = s.lastBallY;
            s.ballMoving = false;
            s.strokes++; // penalty stroke
            s.message = 'Water! +1 penalty';
            s.messageTimer = 60;
            s.powerPhase = 'aim';
            s.terrain = 'fairway';
            return;
          }

          // Check OB
          if (s.ballX < 10 || s.ballX > W - 10 || s.ballY < 10 || s.ballY > H - 10) {
            s.shotDistance = Math.sqrt((s.ballX - s.lastBallX) ** 2 + (s.ballY - s.lastBallY) ** 2);
            s.ballX = s.lastBallX;
            s.ballY = s.lastBallY;
            s.ballMoving = false;
            s.strokes++;
            s.message = 'Out of bounds! +1 penalty';
            s.messageTimer = 60;
            s.powerPhase = 'aim';
            s.terrain = 'rough';
            return;
          }

          // Check hole
          const distToHole = Math.sqrt((s.ballX - hole.holeX) ** 2 + (s.ballY - hole.holeY) ** 2);
          const speed = Math.sqrt(s.ballVX ** 2 + s.ballVY ** 2);
          if (distToHole < 12 && speed < 4) {
            s.ballMoving = false;
            s.ballInHole = true;
            s.ballX = hole.holeX;
            s.ballY = hole.holeY;
            s.shotDistance = Math.sqrt((s.ballX - s.lastBallX) ** 2 + (s.ballY - s.lastBallY) ** 2);
            s.message = getScoreName(s.strokes, hole.par);
            s.messageTimer = 120;
            s.powerPhase = 'done';
            // Celebration particles for eagle or better
            if (s.strokes <= hole.par - 1) {
              const count = s.strokes === 1 ? 40 : 25;
              const colors = ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f472b6'];
              for (let i = 0; i < count; i++) {
                s.particles.push({ x: hole.holeX, y: hole.holeY, vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 6 - 2, life: 30 + Math.random() * 25, color: colors[Math.floor(Math.random() * colors.length)] });
              }
            }
            return;
          }

          // Determine terrain
          if (isInBunker(s.ballX, s.ballY, hole)) {
            s.terrain = 'bunker';
            s.ballVX *= 0.3;
            s.ballVY *= 0.3;
          } else if (isOnFairway(s.ballX, s.ballY, hole)) {
            s.terrain = 'fairway';
            s.ballVX *= 0.85;
            s.ballVY *= 0.85;
          } else {
            s.terrain = 'rough';
            s.ballVX *= 0.7;
            s.ballVY *= 0.7;
          }

          // Bounce
          if (Math.abs(s.ballVX) > 0.3 || Math.abs(s.ballVY) > 0.3) {
            s.ballVZ = Math.abs(s.ballVZ) * 0.3;
            s.landingAnim = 15;
          } else {
            // Ball stopped
            s.ballMoving = false;
            s.powerPhase = 'aim';
            s.shotDistance = Math.sqrt((s.ballX - s.lastBallX) ** 2 + (s.ballY - s.lastBallY) ** 2);
            s.ballTrail = [];
            s.lastBallX = s.ballX;
            s.lastBallY = s.ballY;

            // Auto-select club based on distance
            const distH = Math.sqrt((s.ballX - hole.holeX) ** 2 + (s.ballY - hole.holeY) ** 2);
            if (distH < 40) s.club = 3; // putter
            else if (distH < 120) s.club = 2; // wedge
            else if (distH < 250) s.club = 1; // iron
            else s.club = 0; // driver

            // Re-aim toward hole
            s.aimAngle = Math.atan2(hole.holeY - s.ballY, hole.holeX - s.ballX);

            // terrain visuals on the course speak for themselves
          }
        }
      }
    }

    function drawHole(ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) {
      const hole = HOLES[s.holeIndex];

      // Background (rough)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#2d6b1e');
      bgGrad.addColorStop(1, '#1d5a12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Rough texture
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 200; i++) {
        const rx = (i * 73 + 17) % W;
        const ry = (i * 47 + 31) % H;
        ctx.fillRect(rx, ry, 2, 2);
      }

      // Water hazards
      for (const w of hole.water) {
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.ellipse(w.cx, w.cy, w.rx, w.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        // Water shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(w.cx - w.rx * 0.2, w.cy - w.ry * 0.2, w.rx * 0.4, w.ry * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fairway
      for (const fw of hole.fairway) {
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(fw.cx, fw.cy, fw.rx, fw.ry, fw.angle || 0, 0, Math.PI * 2);
        ctx.fill();
        // Stripe pattern
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let i = -fw.ry; i < fw.ry; i += 12) {
          ctx.fillRect(fw.cx - fw.rx, fw.cy + i, fw.rx * 2, 5);
        }
      }

      // Green (around hole)
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.ellipse(hole.holeX, hole.holeY, 35, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      // Putting grid (subtle)
      if (s.puttingMode || s.distToHole < 55) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(hole.holeX, hole.holeY, 35, 30, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        for (let gx = hole.holeX - 36; gx <= hole.holeX + 36; gx += 7) {
          ctx.beginPath(); ctx.moveTo(gx, hole.holeY - 31); ctx.lineTo(gx, hole.holeY + 31); ctx.stroke();
        }
        for (let gy = hole.holeY - 31; gy <= hole.holeY + 31; gy += 7) {
          ctx.beginPath(); ctx.moveTo(hole.holeX - 36, gy); ctx.lineTo(hole.holeX + 36, gy); ctx.stroke();
        }
        ctx.restore();
      }

      // Bunkers
      for (const b of hole.bunkers) {
        ctx.fillStyle = '#f4d794';
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
        ctx.fill();
        // Edge shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Sand texture
        ctx.fillStyle = 'rgba(200,170,100,0.3)';
        for (let i = 0; i < 8; i++) {
          const sx = b.cx + (Math.cos(i * 0.8) * b.r * 0.5);
          const sy = b.cy + (Math.sin(i * 0.8) * b.r * 0.5);
          ctx.fillRect(sx, sy, 1, 1);
        }
      }

      // Trees
      for (const t of hole.trees) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(t.x + 5, t.y + 5, t.size * 0.6, t.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Trunk
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(t.x - 3, t.y - t.size * 0.3, 6, t.size * 0.6);
        // Canopy
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(t.x, t.y - t.size * 0.4, t.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(t.x - 3, t.y - t.size * 0.5, t.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hole
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(hole.holeX, hole.holeY, 8, 0, Math.PI * 2);
      ctx.fill();
      // Flag pole
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hole.holeX, hole.holeY);
      ctx.lineTo(hole.holeX, hole.holeY - 40);
      ctx.stroke();
      // Flag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(hole.holeX, hole.holeY - 40);
      ctx.lineTo(hole.holeX + 18, hole.holeY - 34);
      ctx.lineTo(hole.holeX, hole.holeY - 28);
      ctx.fill();

      // Tee marker (if on first shot)
      if (s.strokes === 0) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(hole.teeX - 8, hole.teeY, 3, 0, Math.PI * 2);
        ctx.arc(hole.teeX + 8, hole.teeY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBall(ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) {
      if (s.ballInHole) return;

      // Trail
      if (s.ballTrail.length > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(s.ballTrail[0].x, s.ballTrail[0].y - s.ballTrail[0].z);
        for (let i = 1; i < s.ballTrail.length; i++) {
          ctx.lineTo(s.ballTrail[i].x, s.ballTrail[i].y - s.ballTrail[i].z);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ball shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(s.ballX, s.ballY, 4 + s.ballZ * 0.02, 2 + s.ballZ * 0.01, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      const drawY = s.ballY - s.ballZ;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.ballX, drawY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Landing splash
      if (s.landingAnim > 0) {
        const r = (15 - s.landingAnim) * 2;
        ctx.strokeStyle = `rgba(255,255,255,${s.landingAnim / 15 * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.ballX, s.ballY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Aim line (when aiming)
      if (s.powerPhase === 'aim' || s.powerPhase === 'charging' || s.powerPhase === 'swinging') {
        const club = CLUBS[s.club];
        const aimLen = 30 + club.power * 8;
        const endX = s.ballX + Math.cos(s.aimAngle) * aimLen;
        const endY = s.ballY + Math.sin(s.aimAngle) * aimLen;

        ctx.strokeStyle = 'rgba(255,255,100,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(s.ballX, s.ballY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const arrowAngle = s.aimAngle;
        ctx.fillStyle = 'rgba(255,255,100,0.6)';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 8 * Math.cos(arrowAngle - 0.4), endY - 8 * Math.sin(arrowAngle - 0.4));
        ctx.lineTo(endX - 8 * Math.cos(arrowAngle + 0.4), endY - 8 * Math.sin(arrowAngle + 0.4));
        ctx.fill();

        // Predicted landing zone (pulsing circle)
        if (s.powerPhase === 'aim') {
          const maxDist = club.power * 11;
          const landX = s.ballX + Math.cos(s.aimAngle) * maxDist;
          const landY = s.ballY + Math.sin(s.aimAngle) * maxDist;
          const pulse = 0.3 + 0.2 * Math.sin(Date.now() / 300);
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(landX, landY, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          // "Max" label
          ctx.font = '8px sans-serif';
          ctx.fillStyle = 'rgba(251,191,36,0.5)';
          ctx.textAlign = 'center';
          ctx.fillText('MAX', landX, landY + 18);
        }
      }
    }

    function drawHUD(ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) {
      const hole = HOLES[s.holeIndex];

      // Top bar
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, 40);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      if (gameMode === '2p') {
        ctx.fillStyle = s.currentPlayer === 1 ? '#3b82f6' : '#ef4444';
        ctx.fillText(`P${s.currentPlayer}`, 10, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Hole ${s.holeIndex + 1}/${maxHoles}`, 40, 16);
      } else {
        ctx.fillText(`Hole ${s.holeIndex + 1}/${maxHoles}`, 10, 16);
      }
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(hole.name, 10, 32);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Par ${hole.par}`, W * 0.3, 16);
      ctx.fillText(`Stroke ${s.strokes}`, W * 0.3, 32);

      // Wind indicator
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Wind', W * 0.55, 14);
      const windEndX = W * 0.55 + Math.cos(s.windAngle) * s.windSpeed * 8;
      const windEndY = 28 + Math.sin(s.windAngle) * s.windSpeed * 8;
      ctx.strokeStyle = '#87ceeb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.55, 28);
      ctx.lineTo(windEndX, windEndY);
      ctx.stroke();
      ctx.fillStyle = '#87ceeb';
      ctx.beginPath();
      ctx.arc(windEndX, windEndY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '9px sans-serif';
      ctx.fillText(`${s.windSpeed.toFixed(1)} mph`, W * 0.55, 38);

      // Running score vs par (completed holes)
      if (s.scorecard.length > 0 || s.strokes > 0) {
        const completedTotal = s.scorecard.reduce((a: number, b: number) => a + b, 0);
        const completedPar = HOLES.slice(0, s.scorecard.length).reduce((a: number, h: GolfHole) => a + h.par, 0);
        const diff = completedTotal - completedPar;
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = diff < 0 ? '#22c55e' : diff === 0 ? '#fbbf24' : '#ef4444';
        const label = diff === 0 ? 'E' : `${diff > 0 ? '+' : ''}${diff}`;
        ctx.fillText(label, W * 0.42, 32);
      }

      // Club + Distance + Terrain
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(CLUBS[s.club].name, W - 12, 16);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${Math.round(s.distToHole)} yds`, W - 12, 32);
      // Terrain label
      if (!s.ballMoving && s.terrain) {
        const terrainColors: Record<string, string> = { tee: '#a3e635', fairway: '#4ade80', rough: '#dc2626', bunker: '#f4d794', green: '#6ee7b7' };
        const tLabel = s.distToHole < 40 ? 'green' : s.terrain;
        ctx.fillStyle = terrainColors[tLabel] || '#aaa';
        ctx.font = '9px sans-serif';
        ctx.fillText(tLabel.toUpperCase(), W - 12, 38);
      }

      // Power meter
      if (s.powerPhase === 'charging' || s.powerPhase === 'swinging') {
        const meterX = W - 45;
        const meterY = 55;
        const meterH = 200;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(meterX - 5, meterY - 5, 35, meterH + 10);

        // Power bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(meterX, meterY, 10, meterH);

        // Power fill
        const pct = s.powerLevel / 100;
        const fillH = meterH * pct;
        const grad = ctx.createLinearGradient(0, meterY + meterH, 0, meterY);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(0.6, '#eab308');
        grad.addColorStop(1, '#ef4444');
        ctx.fillStyle = grad;
        ctx.fillRect(meterX, meterY + meterH - fillH, 10, fillH);

        // Power indicator
        const indY = meterY + meterH - fillH;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(meterX + 12, indY);
        ctx.lineTo(meterX + 22, indY - 4);
        ctx.lineTo(meterX + 22, indY + 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(s.powerLevel)}%`, meterX + 12, meterY + meterH + 15);
        ctx.fillText('POWER', meterX - 3, meterY - 10);
      }

      // Accuracy meter
      if (s.powerPhase === 'swinging') {
        const meterX = W - 85;
        const meterY = 55;
        const meterH = 200;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(meterX - 5, meterY - 5, 30, meterH + 10);

        ctx.fillStyle = '#333';
        ctx.fillRect(meterX, meterY, 10, meterH);

        // Sweet spot zone
        const sweetSpotY = meterY + meterH * 0.45;
        const sweetSpotH = meterH * 0.1;
        ctx.fillStyle = 'rgba(34,197,94,0.4)';
        ctx.fillRect(meterX, sweetSpotY, 10, sweetSpotH);

        // Accuracy indicator
        const accPct = s.swingAccuracy / 100;
        const accY = meterY + meterH * (1 - accPct);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(meterX + 12, accY);
        ctx.lineTo(meterX + 20, accY - 3);
        ctx.lineTo(meterX + 20, accY + 3);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ACCURACY', meterX - 5, meterY - 10);
      }

      // Shot distance display
      if (!s.ballMoving && s.shotDistance > 5 && s.powerPhase === 'aim') {
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`Last shot: ${Math.round(s.shotDistance)} yds`, W / 2, H - 12);
      }

      // Message
      if (s.messageTimer > 0) {
        const alpha = Math.min(1, s.messageTimer / 20);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(s.message, W / 2, H * 0.45);
        ctx.fillText(s.message, W / 2, H * 0.45);
        ctx.globalAlpha = 1;
      }

      // Ball in hole - next hole prompt
      if (s.ballInHole) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(W * 0.25, H * 0.55, W * 0.5, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        const nextMsg = gameMode === '2p' && s.currentPlayer === 1
          ? 'Click / ENTER — P2\'s turn'
          : s.holeIndex + 1 < maxHoles ? 'Click / ENTER for next hole' : 'Click / ENTER for results';
        ctx.fillText(nextMsg, W / 2, H * 0.55 + 20);
      }

      // Match over - scorecard
      if (s.matchOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('SCORECARD', W / 2, 50);

        const totalStrokes = s.scorecard.reduce((a, b) => a + b, 0);
        const totalPar = HOLES.slice(0, maxHoles).reduce((a, h) => a + h.par, 0);
        const overUnder = totalStrokes - totalPar;

        // Table
        const startY = 80;
        const rowH = 24;
        ctx.font = 'bold 12px sans-serif';

        // Header
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        for (let i = 0; i < maxHoles; i++) {
          ctx.fillText(`${i + 1}`, 80 + i * 50, startY);
        }
        ctx.fillText('TOT', 80 + maxHoles * 50, startY);

        // Par row
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText('Par', 15, startY + rowH);
        ctx.textAlign = 'center';
        for (let i = 0; i < maxHoles; i++) {
          ctx.fillText(`${HOLES[i].par}`, 80 + i * 50, startY + rowH);
        }
        ctx.fillText(`${totalPar}`, 80 + maxHoles * 50, startY + rowH);

        // P1 Score row
        ctx.fillStyle = gameMode === '2p' ? '#3b82f6' : '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(gameMode === '2p' ? 'P1' : 'You', 15, startY + rowH * 2);
        ctx.textAlign = 'center';
        for (let i = 0; i < s.scorecard.length; i++) {
          const diff = s.scorecard[i] - HOLES[i].par;
          ctx.fillStyle = diff < 0 ? '#22c55e' : diff === 0 ? '#fff' : diff === 1 ? '#eab308' : '#ef4444';
          ctx.fillText(`${s.scorecard[i]}`, 80 + i * 50, startY + rowH * 2);
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(`${totalStrokes}`, 80 + maxHoles * 50, startY + rowH * 2);

        // P2 Score row (2P only)
        let extraRows = 0;
        if (gameMode === '2p') {
          extraRows = 1;
          const p2Total = s.p2Scorecard.reduce((a: number, b: number) => a + b, 0);
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'left';
          ctx.fillText('P2', 15, startY + rowH * 3);
          ctx.textAlign = 'center';
          for (let i = 0; i < s.p2Scorecard.length; i++) {
            const diff = s.p2Scorecard[i] - HOLES[i].par;
            ctx.fillStyle = diff < 0 ? '#22c55e' : diff === 0 ? '#fff' : diff === 1 ? '#eab308' : '#ef4444';
            ctx.fillText(`${s.p2Scorecard[i]}`, 80 + i * 50, startY + rowH * 3);
          }
          ctx.fillStyle = '#fff';
          ctx.fillText(`${p2Total}`, 80 + maxHoles * 50, startY + rowH * 3);
        }

        // Final score
        ctx.font = 'bold 22px sans-serif';
        if (gameMode === '2p') {
          const p2Total = s.p2Scorecard.reduce((a: number, b: number) => a + b, 0);
          ctx.fillStyle = totalStrokes < p2Total ? '#3b82f6' : p2Total < totalStrokes ? '#ef4444' : '#fbbf24';
          ctx.fillText(totalStrokes < p2Total ? 'P1 WINS!' : p2Total < totalStrokes ? 'P2 WINS!' : 'TIE!', W / 2, startY + rowH * (4 + extraRows));
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#ccc';
          ctx.fillText(`P1: ${totalStrokes} (${overUnder >= 0 ? '+' : ''}${overUnder})  •  P2: ${p2Total} (${p2Total - totalPar >= 0 ? '+' : ''}${p2Total - totalPar})`, W / 2, startY + rowH * (5 + extraRows));
        } else {
          ctx.fillStyle = overUnder < 0 ? '#22c55e' : overUnder === 0 ? '#fbbf24' : '#ef4444';
          ctx.fillText(overUnder === 0 ? 'Even Par!' : `${overUnder > 0 ? '+' : ''}${overUnder} (${totalStrokes} strokes)`, W / 2, startY + rowH * 4);
        }

        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Use buttons below', W / 2, startY + rowH * 5 + 10);
      }
    }

    function render() {
      const s = stateRef.current;
      if (!s) return;
      const c = canvasRef.current?.getContext('2d');
      if (!c) return;
      drawHole(c, s);
      drawBall(c, s);

      // Particles
      for (const p of s.particles) {
        c.globalAlpha = p.life / 20;
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, 2.5, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;

      // (green is already visible via color - no contour lines needed)

      drawHUD(c, s);
    }

    function gameLoop() {
      update();
      render();
      animRef.current = requestAnimationFrame(gameLoop);
    }
    animRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('click', handleClick);
    };
  }, [maxHoles, gameMode, gameKey]);

  // Mobile controls
  const btnClass = "px-3 py-2 font-bold rounded-lg active:scale-90 transition-all text-xs shadow-lg";

  const doAim = (dir: -1 | 1) => {
    const s = stateRef.current;
    if (s && s.powerPhase === 'aim') s.aimAngle += dir * 0.08;
  };

  const doClub = (dir: -1 | 1) => {
    const s = stateRef.current;
    if (s) s.club = Math.max(0, Math.min(CLUBS.length - 1, s.club + dir));
  };

  const doAction = () => {
    const s = stateRef.current;
    if (!s || s.matchOver) return;
    if (s.ballInHole) {
      // Trigger next hole by simulating enter key
      const evt = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(evt);
      return;
    }
    canvasRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <canvas ref={canvasRef} width={W} height={H}
        className="rounded-xl border-2 border-white/20 shadow-2xl w-full max-w-[600px] cursor-pointer touch-none"
        tabIndex={0} />
      <div className="w-full max-w-[600px] space-y-1.5">
        <div className="flex gap-1.5 justify-center flex-wrap">
          <button onPointerDown={() => doAim(-1)} className={`${btnClass} bg-gray-500 text-white`}>Aim ←</button>
          <button onPointerDown={() => doAim(1)} className={`${btnClass} bg-gray-500 text-white`}>Aim →</button>
          <button onPointerDown={doAction} className={`${btnClass} bg-green-500 text-white px-5 text-sm`}>Swing / Next</button>
          <button onPointerDown={() => doClub(-1)} className={`${btnClass} bg-yellow-600 text-white`}>Club ↑</button>
          <button onPointerDown={() => doClub(1)} className={`${btnClass} bg-yellow-600 text-white`}>Club ↓</button>
        </div>
      </div>
      {tick >= 0 && stateRef.current?.matchOver && (
        <div className="bg-black/40 rounded-2xl px-4 py-3 text-center w-full max-w-[600px] flex gap-2 justify-center">
          <button onClick={() => setGameKey(k => k + 1)} className="px-6 py-2 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all">Play Again</button>
          <button onClick={onExit} className="px-6 py-2 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 active:scale-95 transition-all">Back</button>
        </div>
      )}
      <button onClick={onExit} className="px-4 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs hover:bg-white/20 transition-colors">← Back</button>
    </div>
  );
}

// ═══════ SNAKE ═══════
function SnakeGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirRef = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const [gameKey, setGameKey] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'over'>('playing');
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    try { setHighScore(parseInt(localStorage.getItem('snake_hs') || '0')); } catch { /**/ }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const CELL = 16, C = 20, R = 20;
    canvas.width = C * CELL; canvas.height = R * CELL;
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };

    let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    let score = 0, running = true;

    const getFood = (): { x: number; y: number } => {
      let p: { x: number; y: number };
      do { p = { x: Math.floor(Math.random() * C), y: Math.floor(Math.random() * R) }; }
      while (snake.some(s => s.x === p.x && s.y === p.y));
      return p;
    };
    let food = getFood();

    const onKey = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if (e.key === 'ArrowUp' && d.y !== 1) nextDirRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && d.y !== -1) nextDirRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && d.x !== 1) nextDirRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && d.x !== -1) nextDirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', onKey);

    let timer: ReturnType<typeof setTimeout>;

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    };

    const render = () => {
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
      for (let i = 0; i <= C; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke(); }
      for (let i = 0; i <= R; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke(); }
      const g = ctx.createRadialGradient(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 0, food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 2);
      g.addColorStop(0, 'rgba(239,68,68,0.4)'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect((food.x - 1) * CELL, (food.y - 1) * CELL, CELL * 3, CELL * 3);
      ctx.fillStyle = '#ef4444'; rr(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(food.x * CELL + 4, food.y * CELL + 3, 4, 3, 2);
      snake.forEach((seg, i) => {
        const t = 1 - i / snake.length;
        ctx.fillStyle = i === 0 ? '#4ade80' : `rgba(34,197,94,${Math.max(0.2, t * 0.9)})`;
        const p = i === 0 ? 1 : 2;
        rr(seg.x * CELL + p, seg.y * CELL + p, CELL - p * 2, CELL - p * 2, i === 0 ? 5 : 3);
      });
      const hd = snake[0], dv = dirRef.current;
      const ex = hd.x * CELL + CELL / 2 + dv.x * 3.5, ey = hd.y * CELL + CELL / 2 + dv.y * 3.5;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#065f46'; ctx.beginPath(); ctx.arc(ex + dv.x, ey + dv.y, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 20);
      ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
      ctx.fillStyle = '#e2e8f0'; ctx.fillText(`Score: ${score}`, 6, 14);
      const hs = parseInt(localStorage.getItem('snake_hs') || '0');
      ctx.textAlign = 'right'; ctx.fillStyle = '#fbbf24'; ctx.fillText(`Best: ${hs}`, W - 6, 14);
    };

    const tick = () => {
      if (!running) return;
      dirRef.current = { ...nextDirRef.current };
      const d = dirRef.current;
      const head = { x: snake[0].x + d.x, y: snake[0].y + d.y };
      if (head.x < 0 || head.x >= C || head.y < 0 || head.y >= R || snake.some(s => s.x === head.x && s.y === head.y)) {
        running = false; render();
        ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 16);
        ctx.font = 'bold 16px Arial'; ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 12);
        const prev = parseInt(localStorage.getItem('snake_hs') || '0');
        if (score > prev) {
          localStorage.setItem('snake_hs', String(score)); setHighScore(score);
          ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 13px Arial';
          ctx.fillText('New High Score! 🏆', canvas.width / 2, canvas.height / 2 + 38);
        }
        setPhase('over'); return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) { score++; food = getFood(); }
      else snake.pop();
      render();
      timer = setTimeout(tick, Math.max(70, 150 - Math.floor(score / 5) * 10));
    };

    tick();
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [gameKey]);

  const setDir = (x: number, y: number) => {
    const d = dirRef.current;
    if (x === -d.x && y === -d.y) return;
    nextDirRef.current = { x, y };
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex items-center justify-between w-full max-w-[320px]">
        <p className="text-white font-bold text-sm">🐍 Snake</p>
        <p className="text-yellow-300 font-bold text-sm">Best: {highScore}</p>
      </div>
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[320px]" style={{ aspectRatio: '1' }} />
      <div className="grid grid-cols-3 gap-1.5 w-40">
        <div /><button onPointerDown={() => setDir(0, -1)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">↑</button><div />
        <button onPointerDown={() => setDir(-1, 0)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">←</button>
        <button onPointerDown={() => setDir(0, 1)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">↓</button>
        <button onPointerDown={() => setDir(1, 0)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">→</button>
      </div>
      {phase === 'over' && (
        <div className="flex gap-3">
          <button onClick={() => { setPhase('playing'); setGameKey(k => k + 1); }} className="px-5 py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow">Play Again</button>
          <button onClick={onExit} className="px-5 py-2 bg-white/20 text-white rounded-xl font-bold text-sm">Back</button>
        </div>
      )}
    </div>
  );
}

// ═══════ PAC-MAN ═══════
function PacManGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pacDirRef = useRef({ x: 1, y: 0 });
  const pacNextRef = useRef({ x: 1, y: 0 });
  const [gameKey, setGameKey] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'over' | 'won'>('playing');
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    try { setHighScore(parseInt(localStorage.getItem('pac_hs') || '0')); } catch { /**/ }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const CELL = 16, COLS = 20, ROWS = 20;
    canvas.width = COLS * CELL; canvas.height = ROWS * CELL;
    pacDirRef.current = { x: 1, y: 0 };
    pacNextRef.current = { x: 1, y: 0 };

    // 0=dot 1=wall 4=power pellet
    const maze: number[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) return 1;
        if (r % 4 === 2 && c > 1 && c < COLS - 2 && c % 3 !== 0) return 1;
        return 0;
      })
    );
    [[1, 3], [18, 3], [1, 16], [18, 16]].forEach(([x, y]) => { if (maze[y][x] === 0) maze[y][x] = 4; });

    const dots: boolean[][] = maze.map(row => row.map(c => c === 0 || c === 4));
    const pellets: boolean[][] = maze.map(row => row.map(c => c === 4));
    let totalDots = dots.flat().filter(Boolean).length;
    let score = 0, lives = 3, frighten = 0, frame = 0, running = true;

    const PAC0 = { x: 10, y: 16 };
    const GDEFS = [
      { x: 8,  y: 9, color: '#ff0000' }, { x: 10, y: 9, color: '#ffb8de' },
      { x: 12, y: 9, color: '#00ffff' }, { x: 9,  y: 12, color: '#ffb852' },
    ];
    type Ghost = { x: number; y: number; color: string; dx: number; dy: number; eaten: boolean };
    let pac = { ...PAC0 };
    let ghosts: Ghost[] = GDEFS.map(g => ({ ...g, dx: 0, dy: -1, eaten: false }));

    const passable = (x: number, y: number) => x >= 0 && x < COLS && y >= 0 && y < ROWS && maze[y][x] !== 1;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') pacNextRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown') pacNextRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft') pacNextRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight') pacNextRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', onKey);

    const drawGhost = (gx: number, gy: number, color: string, scared: boolean, flash: boolean) => {
      const px = gx * CELL, py = gy * CELL, r = CELL / 2 - 1;
      ctx.fillStyle = scared ? (flash ? '#fff' : '#2233cc') : color;
      ctx.beginPath();
      ctx.arc(px + CELL / 2, py + r + 1, r, Math.PI, 0);
      ctx.lineTo(px + CELL - 1, py + CELL - 1);
      const bumps = 3, bw = (CELL - 2) / bumps;
      for (let b = bumps - 1; b >= 0; b--) ctx.arc(px + 1 + bw * b + bw / 2, py + CELL - 1, bw / 2, 0, Math.PI, true);
      ctx.lineTo(px + 1, py + r + 1);
      ctx.fill();
      if (!scared) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(px + 5, py + 7, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 11, py + 7, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00f';
        ctx.beginPath(); ctx.arc(px + 6, py + 8, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 12, py + 8, 1.5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = flash ? '#00f' : '#fff';
        ctx.fillRect(px + 4, py + 7, 3, 2); ctx.fillRect(px + 10, py + 7, 3, 2);
      }
    };

    const render = () => {
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      maze.forEach((row, r) => row.forEach((cell, c) => {
        if (cell !== 1) return;
        ctx.fillStyle = '#1a3a8e'; ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = '#2a4aae'; ctx.lineWidth = 1;
        ctx.strokeRect(c * CELL + 0.5, r * CELL + 0.5, CELL - 1, CELL - 1);
      }));
      dots.forEach((row, r) => row.forEach((dot, c) => {
        if (!dot) return;
        if (pellets[r][c]) {
          ctx.fillStyle = `rgba(255,255,100,${0.6 + 0.4 * Math.sin(frame * 0.2)})`;
          ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 4.5, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = '#ffb8de';
          ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 2, 0, Math.PI * 2); ctx.fill();
        }
      }));
      const flash = frighten > 0 && frighten < 12 && frame % 4 < 2;
      ghosts.forEach(g => { if (!g.eaten) drawGhost(g.x, g.y, g.color, frighten > 0, flash); });
      const mouth = Math.abs(Math.sin(frame * 0.35)) * 0.45;
      const ang = Math.atan2(pacDirRef.current.y, pacDirRef.current.x);
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(pac.x * CELL + CELL / 2, pac.y * CELL + CELL / 2, CELL / 2 - 1, ang + mouth, ang + Math.PI * 2 - mouth);
      ctx.lineTo(pac.x * CELL + CELL / 2, pac.y * CELL + CELL / 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, 20);
      ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
      ctx.fillStyle = '#fff'; ctx.fillText(`Score: ${score}`, 6, 14);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fbbf24';
      ctx.fillText(`Best: ${parseInt(localStorage.getItem('pac_hs') || '0')}`, W - 6, 14);
      for (let i = 0; i < lives; i++) {
        ctx.fillStyle = '#ffff00'; ctx.beginPath();
        ctx.arc(8 + i * 14, H - 10, 5, 0.4, Math.PI * 2 - 0.4); ctx.lineTo(8 + i * 14, H - 10); ctx.fill();
      }
      if (frighten > 0) { ctx.fillStyle = 'rgba(0,0,200,0.08)'; ctx.fillRect(0, 20, W, H - 40); }
    };

    const respawn = () => {
      pac = { ...PAC0 };
      pacDirRef.current = { x: 1, y: 0 }; pacNextRef.current = { x: 1, y: 0 };
      ghosts = GDEFS.map(g => ({ ...g, dx: 0, dy: -1, eaten: false }));
      frighten = 0;
    };

    const showEndOverlay = (won: boolean) => {
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = won ? '#4ade80' : '#ef4444';
      ctx.fillText(won ? 'YOU WIN! 🎉' : 'GAME OVER', canvas.width / 2, canvas.height / 2 - 16);
      ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#fff';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 12);
      const prev = parseInt(localStorage.getItem('pac_hs') || '0');
      if (score > prev) {
        localStorage.setItem('pac_hs', String(score)); setHighScore(score);
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 13px Arial';
        ctx.fillText('New High Score! 🏆', canvas.width / 2, canvas.height / 2 + 38);
      }
    };

    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!running) return;
      frame++; if (frighten > 0) frighten--;

      const nd = pacNextRef.current;
      const nx = pac.x + nd.x, ny = pac.y + nd.y;
      if (passable(nx, ny)) { pacDirRef.current = { ...nd }; pac.x = nx; pac.y = ny; }
      else {
        const cd = pacDirRef.current;
        const cx = pac.x + cd.x, cy = pac.y + cd.y;
        if (passable(cx, cy)) { pac.x = cx; pac.y = cy; }
      }

      if (dots[pac.y]?.[pac.x]) {
        dots[pac.y][pac.x] = false; totalDots--;
        if (pellets[pac.y][pac.x]) { pellets[pac.y][pac.x] = false; frighten = 40; score += 50; }
        else score += 10;
        if (totalDots <= 0) {
          running = false; render(); showEndOverlay(true); setPhase('won'); return;
        }
      }

      ghosts.forEach(g => {
        if (g.eaten) return;
        if (Math.random() < 0.35) {
          const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const valid = dirs.filter(d => passable(g.x + d.x, g.y + d.y) && !(d.x === -g.dx && d.y === -g.dy));
          if (valid.length) {
            valid.sort((a, b) => {
              const ta = Math.abs(pac.x - (g.x + a.x)) + Math.abs(pac.y - (g.y + a.y));
              const tb = Math.abs(pac.x - (g.x + b.x)) + Math.abs(pac.y - (g.y + b.y));
              return frighten > 0 ? tb - ta : ta - tb;
            });
            if (Math.random() > (frighten > 0 ? 0.9 : 0.5)) valid.sort(() => Math.random() - 0.5);
            g.dx = valid[0].x; g.dy = valid[0].y;
          }
        }
        const gnx = g.x + g.dx, gny = g.y + g.dy;
        if (passable(gnx, gny)) { g.x = gnx; g.y = gny; } else { g.dx = -g.dx; g.dy = -g.dy; }
      });

      ghosts.forEach(g => {
        if (g.eaten || g.x !== pac.x || g.y !== pac.y) return;
        if (frighten > 0) { g.eaten = true; score += 200; }
        else {
          lives--;
          if (lives <= 0) { running = false; render(); showEndOverlay(false); setPhase('over'); }
          else respawn();
        }
      });

      render();
      timer = setTimeout(tick, 140);
    };

    tick();
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [gameKey]);

  const setDir = (x: number, y: number) => { pacNextRef.current = { x, y }; };

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex items-center justify-between w-full max-w-[320px]">
        <p className="text-white font-bold text-sm">👻 Pac-Man</p>
        <p className="text-yellow-300 font-bold text-sm">Best: {highScore}</p>
      </div>
      <canvas ref={canvasRef} className="rounded-xl shadow-lg w-full max-w-[320px]" style={{ aspectRatio: '1' }} />
      <div className="grid grid-cols-3 gap-1.5 w-40">
        <div /><button onPointerDown={() => setDir(0, -1)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">↑</button><div />
        <button onPointerDown={() => setDir(-1, 0)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">←</button>
        <button onPointerDown={() => setDir(0, 1)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">↓</button>
        <button onPointerDown={() => setDir(1, 0)} className="bg-white/20 active:bg-white/40 text-white rounded-lg py-3 font-bold text-lg select-none">→</button>
      </div>
      {(phase === 'over' || phase === 'won') && (
        <div className="flex gap-3">
          <button onClick={() => { setPhase('playing'); setGameKey(k => k + 1); }} className="px-5 py-2 bg-yellow-400 text-black rounded-xl font-bold text-sm shadow">Play Again</button>
          <button onClick={onExit} className="px-5 py-2 bg-white/20 text-white rounded-xl font-bold text-sm">Back</button>
        </div>
      )}
    </div>
  );
}

// ═══════ GAME INSTRUCTIONS ═══════
function getGameInstructions(mode: GameMode): Record<string, { title: string; emoji: string; lines: string[] }> {
  const is2P = mode === '2p';
  return {
    baseball: {
      title: 'Baseball',
      emoji: '⚾',
      lines: is2P ? [
        'Both players: Click/Tap to swing',
        'P1 bats first, then P2 bats',
        'Time your swing when the ball is close',
        'Green timing circle = perfect swing',
      ] : [
        'Tap / Click to swing the bat',
        'Time your swing when the ball is close',
        'Green timing circle = perfect swing',
        'CPU bats after you — play defense!',
      ],
    },
    basketball: {
      title: 'Basketball',
      emoji: '🏀',
      lines: is2P ? [
        'Both players: Click to shoot',
        'Click when the power bar is in the green zone',
        'P1 and P2 take turns shooting',
        'Score the most points before time runs out',
      ] : [
        'Click to start the power meter',
        'Click again when the bar is in the green zone',
        'Take turns shooting with the CPU',
        'Score the most points before time runs out',
      ],
    },
    boxing: {
      title: 'Boxing',
      emoji: '🥊',
      lines: is2P ? [
        'Real-time 1v1 — both players fight simultaneously!',
        'Mash keys to get up from knockdowns',
        '',
        'P1 (left side keyboard):',
        'A/D = Move | SPACE = Block | Q/E = Dodge',
        'F = Jab | G = Hook | R = Uppercut | T = Body',
        '',
        'P2 (right side keyboard):',
        'Arrow keys = Move | SHIFT = Block | , / . = Dodge',
        'J = Jab | K = Hook | U = Uppercut | I = Body',
      ] : [
        'Jab, Hook, Uppercut, Body — punch to deal damage',
        'Hold Block to reduce incoming damage',
        'Dodge left/right to avoid punches',
        'Mash buttons to get up from knockdowns!',
        '',
        'Keyboard: J/K = Jab | H = Hook | U = Upper | B = Body',
        'SPACE = Block | Q/E = Dodge | A/D = Move',
      ],
    },
    tennis: {
      title: 'Tennis',
      emoji: '🎾',
      lines: is2P ? [
        'Real-time 1v1 — split keyboard!',
        'Real tennis scoring: 15-30-40, games, sets',
        '',
        'P1 (bottom): WASD = Move | SPACE = Swing | Click = Serve',
        'P2 (top): Arrow keys = Move | ENTER = Swing/Serve',
      ] : [
        'Move with mouse or A/D/W/S keys',
        'Click to serve and swing',
        'Ball auto-hits when you are close enough',
        'Press W while swinging for a lob shot',
        'Real tennis scoring: 15-30-40, games, sets',
      ],
    },
    golf: {
      title: 'Golf',
      emoji: '⛳',
      lines: is2P ? [
        'P1 plays each hole first, then P2 plays same hole',
        'Same wind conditions for both players',
        'Click 3 times: Power → Accuracy → Swing!',
        'A/D = Aim | W/S = Change club',
        'Lowest total score wins',
      ] : [
        'Click once to start the power meter',
        'Click again to set power (green = good)',
        'Click a third time to set accuracy (center = straight)',
        'A/D = Aim direction | W/S = Change club',
        'Club auto-selects based on distance to hole',
      ],
    },
  };
}

// ═══════ MAIN WII SPORTS COMPONENT ═══════
export default function WiiSports({ onBack }: Props) {
  const [sport, setSport] = useState<Sport>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('1p');
  const [arcadeGame, setArcadeGame] = useState<ArcadeGame | null>(null);
  const [pendingSport, setPendingSport] = useState<Sport | null>(null);
  const [showInstructions, setShowInstructions] = useState<string | null>(null);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const selectSport = (s: Sport) => {
    if (s === 'arcade') { setSport('arcade'); return; }
    setPendingSport(s);
  };

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setShowModeSelect(true);
  };

  const selectMode = (mode: GameMode) => {
    setGameMode(mode);
    setShowModeSelect(false);
    if (pendingSport) {
      setShowInstructions(pendingSport);
    }
  };

  const dismissInstructions = () => {
    if (pendingSport) {
      setSport(pendingSport);
      setPendingSport(null);
    }
    setShowInstructions(null);
  };

  // Re-show instructions during gameplay
  const showInstructionsAgain = () => {
    if (sport !== 'menu' && sport !== 'arcade') {
      setShowInstructions(sport);
    }
  };

  const exitGame = () => { setSport('menu'); setDifficulty(null); setGameMode('1p'); setArcadeGame(null); setPendingSport(null); setShowInstructions(null); setShowModeSelect(false); };

  // Mode selection screen (shown after difficulty, before instructions)
  if (showModeSelect && pendingSport) {
    const sportInfo = sports.find(s => s.id === pendingSport);
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(59,130,246,0.85)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => { setShowModeSelect(false); setDifficulty(null); }} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-lg">Players</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-8 pt-16">
          <p className="text-white/80 text-sm mb-4">{sportInfo?.emoji} {sportInfo?.name}</p>
          <button onClick={() => selectMode('1p')}
            className="w-full max-w-xs px-6 py-5 bg-white/90 rounded-2xl font-bold text-gray-800 text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg">
            1 Player vs CPU
          </button>
          <button onClick={() => selectMode('2p')}
            className="w-full max-w-xs px-6 py-5 bg-white/90 rounded-2xl font-bold text-gray-800 text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg">
            2 Players
          </button>
          <p className="text-white/40 text-xs mt-2">2P requires a keyboard</p>
        </div>
      </div>
    );
  }

  // Instructions screen (shown after mode select, before game starts)
  const gameInstructions = getGameInstructions(gameMode);
  if (showInstructions && gameInstructions[showInstructions]) {
    const info = gameInstructions[showInstructions];
    const sportColor = sports.find(s => s.id === showInstructions)?.color || 'from-blue-500 to-blue-600';
    return (
      <div className="h-full w-full overflow-auto" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
        <div className="sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(26,26,46,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => { setShowInstructions(null); if (pendingSport) { setPendingSport(null); setDifficulty(null); setShowModeSelect(false); } }} className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-bold text-lg">How to Play{gameMode === '2p' ? ' (2P)' : ''}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 p-6 pt-10 max-w-md mx-auto">
          <div className="text-6xl">{info.emoji}</div>
          <h2 className="text-white font-bold text-2xl">{info.title}</h2>
          <div className="w-full bg-white/10 rounded-2xl p-5 space-y-3">
            {info.lines.map((line, i) => (
              line === '' ? <div key={i} className="border-t border-white/10" /> :
              <div key={i} className="flex gap-3 items-start">
                <span className="text-white/40 font-bold text-sm mt-0.5">{line.includes('=') || line.includes('|') ? '⌨' : '•'}</span>
                <p className="text-white/80 text-sm leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
          <button onClick={dismissInstructions}
            className={`w-full max-w-xs px-8 py-4 bg-gradient-to-br ${sportColor} rounded-2xl font-bold text-white text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg`}>
            Play!
          </button>
        </div>
      </div>
    );
  }

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
            <div className="ml-auto flex items-center gap-2">
              {gameMode === '2p' && <span className="text-blue-300 text-xs font-bold">2P</span>}
              <span className="text-white/40 text-xs capitalize">{difficulty}</span>
              <button onClick={showInstructionsAgain} className="text-white/50 hover:text-white/80 text-sm transition-colors" title="How to Play">ℹ️</button>
            </div>
          </div>
        </div>
        {sport === 'baseball' && <Baseball difficulty={difficulty} gameMode={gameMode} onExit={exitGame} />}
        {sport === 'basketball' && <Basketball difficulty={difficulty} gameMode={gameMode} onExit={exitGame} />}
        {sport === 'boxing' && <Boxing difficulty={difficulty} gameMode={gameMode} onExit={exitGame} />}
        {sport === 'tennis' && <Tennis difficulty={difficulty} gameMode={gameMode} onExit={exitGame} />}
        {sport === 'golf' && <Golf difficulty={difficulty} gameMode={gameMode} onExit={exitGame} />}
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
