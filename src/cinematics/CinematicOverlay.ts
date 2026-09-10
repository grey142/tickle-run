import type { ClothingLevel, CinematicKind } from '../game/types';
import { TRAPS } from '../catalogs/traps';
import type { TrapKind } from '../game/types';

export interface CinematicRequest {
  kind: CinematicKind;
  clothing: ClothingLevel;
  trapKind?: TrapKind;
  message?: string;
  duration?: number;
}

const LINES: Record<CinematicKind, string[]> = {
  trapTickle: [
    'Caught in a tickle trap!',
    'Giggle overload!',
    'The feathers found you!',
  ],
  monsterCatch: [
    'The Tickle Monster caught up!',
    'Feather frenzy!',
    'No escape from the giggles!',
  ],
  dualTickle: [
    'Trap AND monster?! Double tickle!',
    'Dual giggle assault!',
    'Worst (best?) luck ever!',
  ],
  fallOff: ['You slipped off the narrow ledge!', 'Into the tickle abyss!'],
  gameOver: ['Tickled out!', 'Too many giggles…', 'Adventure over — for now!'],
  escape: ['You wriggle free!', 'Escape!', 'Keep running!'],
  revive: ['Escape Gem activates!', 'Second wind!', 'Back on your feet!'],
};

export class CinematicOverlay {
  el: HTMLDivElement;
  private active = false;
  private timer = 0;
  private onDone: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'cinematic';
    this.el.dataset.ui = '1';
    this.el.innerHTML = `
      <div class="cin-panel">
        <div class="cin-stage">
          <div class="cin-avatar" id="cin-avatar"></div>
          <div class="cin-fx" id="cin-fx"></div>
          <div class="cin-monster" id="cin-monster" hidden>👾</div>
        </div>
        <div class="cin-text" id="cin-text"></div>
        <div class="cin-clothes" id="cin-clothes"></div>
        <button class="btn secondary cin-skip" data-ui="1" type="button" id="cin-skip">Skip</button>
      </div>
    `;
    this.el.classList.add('hidden');
    parent.appendChild(this.el);
    this.el.querySelector('#cin-skip')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.skip();
    });
  }

  skip(): void {
    if (!this.active) return;
    this.hide();
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }

  get isPlaying(): boolean {
    return this.active;
  }

  play(req: CinematicRequest, onDone: () => void): void {
    this.active = true;
    this.onDone = onDone;
    this.timer = req.duration ?? 2.2;
    if (req.trapKind && TRAPS[req.trapKind]) {
      this.timer = Math.max(this.timer, TRAPS[req.trapKind].cinematicSeconds);
    }
    this.el.classList.remove('hidden');
    const lines = LINES[req.kind];
    const text = req.message ?? lines[Math.floor(Math.random() * lines.length)];
    const textEl = this.el.querySelector('#cin-text')!;
    textEl.textContent = text;

    const clothes = this.el.querySelector('#cin-clothes')!;
    const labels = ['None', 'Shoes', 'Pants + Shoes', 'Fully Clothed'];
    clothes.textContent = `Clothing: ${labels[req.clothing]} (${req.clothing}/3)`;

    const avatar = this.el.querySelector('#cin-avatar') as HTMLElement;
    avatar.innerHTML = this.avatarSvg(req.clothing);
    avatar.classList.remove('shake');
    void avatar.offsetWidth;
    avatar.classList.add('shake');

    const monster = this.el.querySelector('#cin-monster') as HTMLElement;
    monster.hidden = !(
      req.kind === 'monsterCatch' ||
      req.kind === 'dualTickle' ||
      req.kind === 'gameOver'
    );

    const fx = this.el.querySelector('#cin-fx') as HTMLElement;
    fx.textContent = '🪶😂✨🪶😂';
  }

  private avatarSvg(level: ClothingLevel): string {
    const shirt = level >= 3 ? '#3d8bfd' : 'transparent';
    const pants = level >= 2 ? '#2e5a1c' : 'transparent';
    const shoes = level >= 1 ? '#5c4033' : 'transparent';
    return `<svg viewBox="0 0 80 120" width="90" height="130">
      <circle cx="40" cy="18" r="12" fill="#f1c27d"/>
      <rect x="28" y="30" width="24" height="28" rx="4" fill="${shirt === 'transparent' ? '#f1c27d' : shirt}"/>
      <rect x="28" y="58" width="24" height="22" rx="3" fill="${pants === 'transparent' ? '#f1c27d' : pants}"/>
      <rect x="28" y="80" width="10" height="18" fill="#f1c27d"/>
      <rect x="42" y="80" width="10" height="18" fill="#f1c27d"/>
      <rect x="26" y="96" width="12" height="8" rx="2" fill="${shoes === 'transparent' ? '#f1c27d' : shoes}"/>
      <rect x="42" y="96" width="12" height="8" rx="2" fill="${shoes === 'transparent' ? '#f1c27d' : shoes}"/>
    </svg>`;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.hide();
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
    }
  }

  hide(): void {
    this.active = false;
    this.el.classList.add('hidden');
  }
}
