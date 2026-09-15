import { withBase } from '../lib/urls';

const audioSources = [
  'phoebe_0.mp3',
  'phoebe_1.mp3',
  'phoebe_2.mp3',
  'chubby_0.mp3',
  'chubby_1.mp3',
  'chubby_2.mp3',
  'phoeba_chubby_0.mp3',
  'phoeba_chubby_1.mp3',
  'phoeba_chubby_2.mp3',
  'phoeba_chubby_3.mp3',
  'phoebe_chubby_0.mp3',
  'phoebe_chubby_1.mp3',
  'phoebe_chubby_2.mp3',
  'phoebe_chubby_3.mp3',
  'phoebe_chubby_4.mp3',
  'phoebe_chubby_5.mp3',
  'phoebe_chubby_6.mp3',
  'phoebe_chubby_7.mp3',
].map((name) => withBase(`/audio/phoebe-chubby/${name}`));

const imageSources = ['phoebe_0.png', 'phoebe_1.png', 'phoebe_2.png']
  .map((name) => withBase(`/img/phoebe/${name}`));

type Edge = 'top' | 'right' | 'bottom' | 'left';

interface RunnerMotion {
  startX: number;
  startY: number;
  middleX: number;
  middleY: number;
  endX: number;
  endY: number;
  startRotation: number;
  endRotation: number;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;

function createMotion(edge: Edge, size: number, width: number, height: number): RunnerMotion {
  const overshoot = size * 1.15;
  const driftX = random(-width * 0.22, width * 0.22);
  const driftY = random(-height * 0.22, height * 0.22);

  if (edge === 'top' || edge === 'bottom') {
    const startX = random(-size * 0.2, width - size * 0.8);
    const endX = Math.min(width + overshoot, Math.max(-overshoot, startX + driftX));
    const startY = edge === 'top' ? -size : height + size * 0.1;
    const endY = edge === 'top' ? height + size * 0.1 : -size;
    return {
      startX,
      startY,
      middleX: startX + (endX - startX) * random(0.38, 0.62) + random(-width * 0.1, width * 0.1),
      middleY: startY + (endY - startY) * random(0.38, 0.62),
      endX,
      endY,
      startRotation: random(-24, 24),
      endRotation: random(-24, 24),
    };
  }

  const startY = random(-size * 0.2, height - size * 0.8);
  const endY = Math.min(height + overshoot, Math.max(-overshoot, startY + driftY));
  const startX = edge === 'left' ? -size : width + size * 0.1;
  const endX = edge === 'left' ? width + size * 0.1 : -size;
  return {
    startX,
    startY,
    middleX: startX + (endX - startX) * random(0.38, 0.62),
    middleY: startY + (endY - startY) * random(0.38, 0.62) + random(-height * 0.1, height * 0.1),
    endX,
    endY,
    startRotation: random(-24, 24),
    endRotation: random(-24, 24),
  };
}

function launchRunner(layer: HTMLElement, index: number, edge: Edge, reducedMotion: boolean) {
  const image = document.createElement('img');
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  const size = random(mobile ? 84 : 112, mobile ? 132 : 178);
  const motion = createMotion(edge, size, window.innerWidth, window.innerHeight);
  const duration = reducedMotion ? 1 : random(1550, 2750);

  image.className = 'phoebe-runner';
  image.dataset.direction = edge;
  image.src = pick(imageSources);
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  image.style.width = `${size}px`;
  image.style.zIndex = String(20 + index);
  layer.append(image);

  if (reducedMotion) {
    image.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { opacity: 1, offset: 0.8 },
        { opacity: 0 },
      ],
      { duration: 900, easing: 'ease-in-out' },
    ).finished.then(() => image.remove(), () => image.remove());
    return;
  }

  const animation = image.animate(
    [
      {
        transform: `translate3d(${motion.startX}px, ${motion.startY}px, 0) rotate(${motion.startRotation}deg) scale(.72)`,
        opacity: 0,
      },
      {
        transform: `translate3d(${motion.middleX}px, ${motion.middleY}px, 0) rotate(${random(-20, 20)}deg) scale(1)`,
        opacity: 1,
        offset: 0.48,
      },
      {
        transform: `translate3d(${motion.endX}px, ${motion.endY}px, 0) rotate(${motion.endRotation}deg) scale(.76)`,
        opacity: 0,
      },
    ],
    {
      duration,
      delay: index * random(35, 90),
      easing: 'cubic-bezier(.2,.72,.28,1)',
      fill: 'both',
    },
  );

  animation.finished.then(() => image.remove(), () => image.remove());
}

function initPhoebe() {
  const trigger = document.querySelector<HTMLButtonElement>('#phoebe-trigger');
  const layer = document.querySelector<HTMLElement>('#phoebe-flight-layer');
  if (!trigger || !layer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hasPlayed = false;
  const activeAudio = new Set<HTMLAudioElement>();

  function playVoice() {
    const source = hasPlayed ? pick(audioSources) : audioSources[0]!;
    hasPlayed = true;

    const audio = new Audio(source);
    audio.preload = 'auto';
    audio.volume = 0.82;
    activeAudio.add(audio);

    const cleanup = () => activeAudio.delete(audio);
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    void audio.play().catch(cleanup);
  }

  trigger.addEventListener('click', () => {
    trigger.classList.remove('is-active');
    void trigger.offsetWidth;
    trigger.classList.add('is-active');
    window.setTimeout(() => trigger.classList.remove('is-active'), 420);

    playVoice();
    const count = window.matchMedia('(max-width: 760px)').matches ? 4 : 6;
    const directions = (['top', 'right', 'bottom', 'left'] as Edge[])
      .sort(() => Math.random() - 0.5);
    for (let index = 0; index < count; index += 1) {
      launchRunner(layer, index, directions[index % directions.length]!, reducedMotion.matches);
    }
  });
}

initPhoebe();
