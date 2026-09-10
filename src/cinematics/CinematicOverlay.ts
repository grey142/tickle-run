import type { ClothingLevel, CinematicKind } from '../game/types';
import { TRAPS } from '../catalogs/traps';
import type { TrapKind } from '../game/types';

export interface CinematicRequest {
  kind: CinematicKind;
  clothing: ClothingLevel;
  trapKind?: TrapKind;
  /** Use trap game-over still (bikini bottoms) instead of clothing-tier still */
  trapGameOver?: boolean;
  message?: string;
  duration?: number;
}

const LINES: Record<CinematicKind, string[]> = {
  trapTickle: [
    'Caught in a tickle trap!',
    'Giggle overload!',
    'Slime tentacles everywhere!',
    'The floating hands got you!',
    'Vines won\'t let go!',
    'The Shade has you!',
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
  fallOff: [
    'You slipped off the narrow ledge!',
    'Into the Tickle Pit!',
    'Every trap at once!',
    'Held spread eagle — no escape!',
  ],
  gameOver: ['Tickled out!', 'Too many giggles…', 'Adventure over — for now!'],
  escape: ['You wriggle free!', 'Escape!', 'Keep running!'],
  revive: ['Escape Gem activates!', 'Second wind!', 'Back on your feet!'],
};

const CLOTHING_LABELS = [
  '1 life — bikini barefoot',
  '2 lives — lingerie + boots',
  '3 lives — shirtless (bra + jeans)',
  '4 lives — fully clothed',
];

/** Traps that have cinematic still packs under public/cinematics/<id>/ */
const CIN_TRAPS: TrapKind[] = ['floorSlime', 'handSwarm', 'vineTrap', 'shade'];

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
          <img class="cin-art" id="cin-art" alt="" hidden />
          <div class="cin-avatar" id="cin-avatar"></div>
          <div class="cin-fx" id="cin-fx"></div>
          <div class="cin-monster" id="cin-monster" hidden>👾</div>
        </div>
        <div class="cin-caption">
          <div class="cin-trap-name" id="cin-trap-name" hidden></div>
          <div class="cin-text" id="cin-text"></div>
          <div class="cin-clothes" id="cin-clothes"></div>
        </div>
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
    if (req.trapGameOver || req.kind === 'gameOver') {
      this.timer = Math.max(this.timer, 2.8);
    }
    this.el.classList.remove('hidden');

    const lines = LINES[req.kind];
    const text = req.message ?? lines[Math.floor(Math.random() * lines.length)];
    this.el.querySelector('#cin-text')!.textContent = text;

    const clothes = this.el.querySelector('#cin-clothes')!;
    if (req.trapGameOver || (req.kind === 'gameOver' && req.trapKind)) {
      clothes.textContent = 'Clothing: Bikini bottoms only';
    } else {
      clothes.textContent = `Clothing: ${CLOTHING_LABELS[req.clothing] ?? req.clothing} (${req.clothing}/3)`;
    }

    const trapName = this.el.querySelector('#cin-trap-name') as HTMLElement;
    if (req.trapKind && TRAPS[req.trapKind]) {
      trapName.hidden = false;
      trapName.textContent = TRAPS[req.trapKind].name;
    } else {
      trapName.hidden = true;
    }

    const art = this.el.querySelector('#cin-art') as HTMLImageElement;
    const avatar = this.el.querySelector('#cin-avatar') as HTMLElement;
    const artUrl = this.resolveArtUrl(req);
    if (artUrl) {
      art.hidden = false;
      art.src = artUrl;
      avatar.hidden = true;
      avatar.innerHTML = '';
      this.el.classList.add('has-art');
    } else {
      art.hidden = true;
      art.removeAttribute('src');
      avatar.hidden = false;
      avatar.innerHTML = this.avatarSvg(req.clothing);
      avatar.classList.remove('shake');
      void avatar.offsetWidth;
      avatar.classList.add('shake');
      this.el.classList.remove('has-art');
    }

    const monster = this.el.querySelector('#cin-monster') as HTMLElement;
    monster.hidden = !(
      !artUrl &&
      (req.kind === 'monsterCatch' || req.kind === 'dualTickle' || req.kind === 'gameOver')
    );

    const fx = this.el.querySelector('#cin-fx') as HTMLElement;
    fx.textContent = artUrl ? '' : '🪶😂✨🪶😂';
  }

  private resolveArtUrl(req: CinematicRequest): string | null {
    const trap = req.trapKind;
    if (!trap || !CIN_TRAPS.includes(trap)) return null;
    const base = import.meta.env.BASE_URL || '/';
    const folder = `${base}cinematics/${trap}/`;

    if (req.trapGameOver || (req.kind === 'gameOver' && trap)) {
      return `${folder}go.jpg`;
    }
    if (req.kind === 'trapTickle' || req.kind === 'dualTickle') {
      // Never show fully clothed — traps strip first; clamp 3→2
      const lvl = Math.min(2, Math.max(0, req.clothing)) as 0 | 1 | 2;
      return `${folder}${lvl}.jpg`;
    }
    return null;
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
    this.el.classList.remove('has-art');
  }
}
