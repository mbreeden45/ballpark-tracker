let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Synthesizes a wooden bat crack: a sharp noise transient plus a short low "thwock" body. */
export function playBatCrack(): void {
  const ac = getContext();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const now = ac.currentTime;

  const length = Math.floor(ac.sampleRate * 0.18);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.022));
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2400;
  band.Q.value = 0.9;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(1.1, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  noise.connect(band).connect(noiseGain).connect(ac.destination);

  const body = ac.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(240, now);
  body.frequency.exponentialRampToValueAtTime(70, now + 0.12);
  const bodyGain = ac.createGain();
  bodyGain.gain.setValueAtTime(0.9, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  body.connect(bodyGain).connect(ac.destination);

  const knock = ac.createOscillator();
  knock.type = 'square';
  knock.frequency.setValueAtTime(900, now);
  knock.frequency.exponentialRampToValueAtTime(300, now + 0.03);
  const knockGain = ac.createGain();
  knockGain.gain.setValueAtTime(0.25, now);
  knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  knock.connect(knockGain).connect(ac.destination);

  noise.start(now);
  body.start(now);
  body.stop(now + 0.22);
  knock.start(now);
  knock.stop(now + 0.06);
}

export function hapticTap(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([15, 30, 15]);
  }
}

export async function fireConfetti(big: boolean): Promise<void> {
  const confetti = (await import('canvas-confetti')).default;
  const colors = ['#C0362C', '#E5A823', '#1E4D2B', '#FBF8F1'];
  if (!big) {
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.65 }, colors, zIndex: 100 });
    return;
  }
  const end = Date.now() + 2200;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors, zIndex: 100 });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors, zIndex: 100 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  confetti({ particleCount: 220, spread: 120, startVelocity: 45, origin: { y: 0.6 }, colors, zIndex: 100 });
}
