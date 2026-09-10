import type { ClothingLevel, RunStats } from '../game/types';
import { STORE_PRICES as PRICES } from '../economy/SaveStore';
import type { Economy } from '../economy/Economy';
import { ADVENTURERS } from '../catalogs/adventurers';
import type { EquipmentSystem } from '../equipment/EquipmentSystem';
import type { Input, TiltPermissionState } from '../game/Input';

export type UICallbacks = {
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onQuitTitle: () => void;
  onOpenStore: () => void;
  onCloseStore: () => void;
  onBuyEquip: (kind: 'shield' | 'magnet' | 'boost') => void;
  onBuyEscape: () => void;
  onUnlockAdventurer: (id: string) => void;
  onSelectAdventurer: (id: string) => void;
  onRevive: () => void;
  onEquipActivate: (kind: 'shield' | 'magnet' | 'boost') => void;
  onEnableTilt: () => void;
};

export class UI {
  root: HTMLDivElement;
  private cbs: UICallbacks;
  private economy: Economy;
  private input: Input | null = null;

  titleEl: HTMLDivElement;
  hudEl: HTMLDivElement;
  pauseEl: HTMLDivElement;
  goEl: HTMLDivElement;
  storeEl: HTMLDivElement;
  countdownEl: HTMLDivElement;
  swipeHintsEl: HTMLDivElement;
  private swipeHintShown = false;
  private swipeHintTimer = 0;

  constructor(parent: HTMLElement, economy: Economy, cbs: UICallbacks) {
    this.economy = economy;
    this.cbs = cbs;
    this.root = document.createElement('div');
    this.root.id = 'ui-root';
    parent.appendChild(this.root);

    this.titleEl = document.createElement('div');
    this.titleEl.id = 'title-screen';
    this.titleEl.dataset.ui = '1';
    this.titleEl.innerHTML = `
      <div class="title-bg" aria-hidden="true"></div>
      <div class="title-content">
      <h1>Tickle Run</h1>
      <p class="tag">PG-13 cartoon endless chase · Clothing = lives</p>
      <button class="btn" data-act="start">Start Run</button>
      <button class="btn secondary" data-act="store">Store</button>
      <button class="btn tilt-btn hidden" data-act="enable-tilt" type="button">Enable tilt</button>
      <p class="tag hint-desktop" style="margin-top:16px;font-size:0.85rem">
        Jump: ↑ / Space · Slide: ↓ / C · Strafe: A/D / Arrows<br/>
        Esc / P pause · Equip via HUD
      </p>
      <p class="tag hint-mobile" style="margin-top:16px;font-size:0.9rem">
        Swipe to jump · Tilt to move<br/>
        Swipe ↓ slide · ←→ turn · Drag to strafe if no tilt
      </p>
      </div>
    `;
    const titleBg = this.titleEl.querySelector('.title-bg') as HTMLElement | null;
    if (titleBg) {
      const base = import.meta.env.BASE_URL || '/';
      titleBg.style.backgroundImage =
        `linear-gradient(180deg, #120c1caa 0%, #120c1cdd 55%, #120c1c 100%), url(${base}cave-bg.png)`;
    }
    this.root.appendChild(this.titleEl);

    this.hudEl = document.createElement('div');
    this.hudEl.id = 'hud';
    this.hudEl.classList.add('hidden');
    this.hudEl.innerHTML = `
      <div class="top">
        <div class="stat">Score <strong id="hud-score">0</strong></div>
        <div class="stat">Dist <strong id="hud-dist">0</strong>m</div>
        <div class="stat">🪶 <strong id="hud-gems">0</strong></div>
        <div class="clothes-pips" id="hud-clothes" title="Clothing lives"></div>
      </div>
      <div class="bottom">
        <div class="equip-bar" data-ui="1">
          <button class="equip-btn" data-ui="1" data-eq="shield" title="Shield" type="button">🛡️<span class="cd" id="cd-shield"></span></button>
          <button class="equip-btn" data-ui="1" data-eq="magnet" title="Gem Magnet" type="button">🧲<span class="cd" id="cd-magnet"></span></button>
          <button class="equip-btn" data-ui="1" data-eq="boost" title="Boost" type="button">⚡<span class="cd" id="cd-boost"></span></button>
        </div>
        <button class="btn secondary pause-btn" data-ui="1" data-act="pause" type="button">Pause</button>
      </div>
    `;
    const chaseBanner = document.createElement('div');
    chaseBanner.className = 'chase-banner hidden';
    chaseBanner.id = 'hud-chase';
    chaseBanner.innerHTML = 'TICKLE MONSTER CAUGHT UP! <span id="hud-chase-t"></span>';
    this.hudEl.appendChild(chaseBanner);
    this.root.appendChild(this.hudEl);

    this.swipeHintsEl = document.createElement('div');
    this.swipeHintsEl.id = 'swipe-hints';
    this.swipeHintsEl.classList.add('hidden');
    this.swipeHintsEl.innerHTML = `
      <span class="swipe-chev up">▲</span>
      <span class="swipe-chev down">▼</span>
      <span class="swipe-chev left">◀</span>
      <span class="swipe-chev right">▶</span>
    `;
    this.root.appendChild(this.swipeHintsEl);

    this.countdownEl = document.createElement('div');
    this.countdownEl.id = 'countdown';
    this.countdownEl.classList.add('hidden');
    this.root.appendChild(this.countdownEl);

    this.pauseEl = document.createElement('div');
    this.pauseEl.className = 'overlay hidden';
    this.pauseEl.dataset.ui = '1';
    this.pauseEl.innerHTML = `
      <div class="card panel">
        <h2>Paused</h2>
        <p>Monster still lurks in the cave…</p>
        <div class="row">
          <button class="btn" data-act="resume">Resume</button>
          <button class="btn secondary" data-act="quit">Title</button>
        </div>
      </div>
    `;
    this.root.appendChild(this.pauseEl);

    this.goEl = document.createElement('div');
    this.goEl.className = 'overlay hidden';
    this.goEl.dataset.ui = '1';
    this.goEl.id = 'gameover';
    this.root.appendChild(this.goEl);

    this.storeEl = document.createElement('div');
    this.storeEl.className = 'overlay hidden';
    this.storeEl.dataset.ui = '1';
    this.root.appendChild(this.storeEl);

    this.root.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest(
        '[data-act],[data-eq],[data-buy],[data-adv],[data-select],[data-buyescape]'
      ) as HTMLElement | null;
      if (!t) return;
      const act = t.dataset.act;
      if (act === 'start') this.cbs.onStart();
      if (act === 'store') this.cbs.onOpenStore();
      if (act === 'close-store') this.cbs.onCloseStore();
      if (act === 'resume') this.cbs.onResume();
      if (act === 'quit') this.cbs.onQuitTitle();
      if (act === 'restart') this.cbs.onRestart();
      if (act === 'revive') this.cbs.onRevive();
      if (act === 'enable-tilt') this.cbs.onEnableTilt();
      if (t.dataset.eq) this.cbs.onEquipActivate(t.dataset.eq as 'shield' | 'magnet' | 'boost');
      if (t.dataset.buy) this.cbs.onBuyEquip(t.dataset.buy as 'shield' | 'magnet' | 'boost');
      if (t.hasAttribute('data-buyescape')) this.cbs.onBuyEscape();
      if (t.dataset.adv) this.cbs.onUnlockAdventurer(t.dataset.adv);
      if (t.dataset.select) this.cbs.onSelectAdventurer(t.dataset.select);
    });

    // Equip / pause: touchend so we don't wait for click delay; stop swipe from starting
    this.hudEl.addEventListener(
      'touchend',
      (e) => {
        const t = (e.target as HTMLElement).closest('[data-eq],[data-act="pause"]') as HTMLElement | null;
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        if (t.dataset.eq) {
          this.cbs.onEquipActivate(t.dataset.eq as 'shield' | 'magnet' | 'boost');
        } else if (t.dataset.act === 'pause') {
          window.dispatchEvent(new CustomEvent('tickle-pause'));
        }
      },
      { passive: false }
    );

    this.hudEl.querySelector('[data-act="pause"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('tickle-pause'));
    });
  }

  bindInput(input: Input): void {
    this.input = input;
    this.refreshTiltButton();
  }

  refreshTiltButton(): void {
    const btn = this.titleEl.querySelector('[data-act="enable-tilt"]') as HTMLButtonElement | null;
    if (!btn || !this.input) return;
    const state = this.input.tiltPermission;
    const coarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(hover: none)').matches ||
        'ontouchstart' in window);

    if (state === 'unsupported') {
      btn.classList.add('hidden');
      return;
    }
    if (state === 'granted') {
      if (!coarse) {
        btn.classList.add('hidden');
        return;
      }
      btn.classList.remove('hidden');
      btn.classList.add('ok');
      btn.textContent = 'Tilt on ✓';
      btn.disabled = true;
      return;
    }
    if (state === 'denied') {
      btn.classList.remove('hidden');
      btn.classList.remove('ok');
      btn.textContent = 'Tilt blocked — drag to strafe';
      btn.disabled = true;
      return;
    }
    // needs-gesture | unknown — show so the user can grant (esp. iOS)
    btn.classList.remove('hidden');
    btn.classList.remove('ok');
    btn.textContent = 'Enable tilt';
    btn.disabled = false;
  }

  setTiltState(_state: TiltPermissionState): void {
    this.refreshTiltButton();
  }

  showTitle(): void {
    this.titleEl.classList.remove('hidden');
    this.hudEl.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.goEl.classList.add('hidden');
    this.storeEl.classList.add('hidden');
    this.countdownEl.classList.add('hidden');
    this.hideSwipeHints();
    this.refreshTiltButton();
  }

  showPlaying(): void {
    this.titleEl.classList.add('hidden');
    this.hudEl.classList.remove('hidden');
    this.pauseEl.classList.add('hidden');
    this.goEl.classList.add('hidden');
    this.storeEl.classList.add('hidden');
  }

  beginSwipeHints(): void {
    const coarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    if (!coarse) return;
    this.swipeHintShown = true;
    this.swipeHintTimer = 10;
    this.swipeHintsEl.classList.remove('hidden', 'fade');
  }

  updateSwipeHints(dt: number): void {
    if (!this.swipeHintShown) return;
    this.swipeHintTimer -= dt;
    if (this.swipeHintTimer <= 2) this.swipeHintsEl.classList.add('fade');
    if (this.swipeHintTimer <= 0) this.hideSwipeHints();
  }

  hideSwipeHints(): void {
    this.swipeHintShown = false;
    this.swipeHintTimer = 0;
    this.swipeHintsEl.classList.add('hidden', 'fade');
  }

  showPause(): void {
    this.pauseEl.classList.remove('hidden');
  }

  hidePause(): void {
    this.pauseEl.classList.add('hidden');
  }

  showCountdown(n: number): void {
    this.countdownEl.classList.remove('hidden');
    this.countdownEl.textContent = n > 0 ? String(Math.ceil(n)) : 'GO!';
  }

  hideCountdown(): void {
    this.countdownEl.classList.add('hidden');
  }

  updateHud(opts: {
    score: number;
    distance: number;
    gems: number;
    clothing: ClothingLevel;
    chaseLeft: number | null;
    equip: EquipmentSystem;
  }): void {
    (this.hudEl.querySelector('#hud-score') as HTMLElement).textContent = String(opts.score);
    (this.hudEl.querySelector('#hud-dist') as HTMLElement).textContent = String(
      Math.floor(opts.distance)
    );
    (this.hudEl.querySelector('#hud-gems') as HTMLElement).textContent = String(opts.gems);

    const pips = this.hudEl.querySelector('#hud-clothes') as HTMLElement;
    const icons = ['👟', '👖', '👕'];
    pips.innerHTML = icons
      .map((ic, i) => {
        const need = i + 1;
        const on = opts.clothing >= need;
        return `<div class="pip ${on ? 'on' : ''}" title="${ic}">${ic}</div>`;
      })
      .join('');

    const chase = this.hudEl.querySelector('#hud-chase') as HTMLElement;
    if (opts.chaseLeft !== null) {
      chase.classList.remove('hidden');
      (this.hudEl.querySelector('#hud-chase-t') as HTMLElement).textContent = `${Math.ceil(
        opts.chaseLeft
      )}s`;
    } else {
      chase.classList.add('hidden');
    }

    this.paintEquip(opts.equip);
  }

  private paintEquip(eq: EquipmentSystem): void {
    const s = eq.state;
    const map: Array<['shield' | 'magnet' | 'boost', boolean, number, number]> = [
      ['shield', eq.hasShield(), s.shield.cooldownLeft, 0],
      [
        'magnet',
        s.magnet.ready || s.magnet.activeLeft > 0,
        s.magnet.cooldownLeft,
        s.magnet.activeLeft,
      ],
      ['boost', s.boost.ready || s.boost.activeLeft > 0, s.boost.cooldownLeft, s.boost.activeLeft],
    ];
    for (const [k, ready, cd, active] of map) {
      const btn = this.hudEl.querySelector(`[data-eq="${k}"]`) as HTMLButtonElement;
      btn.classList.toggle('ready', ready && active <= 0);
      btn.classList.toggle('active', active > 0);
      const owned =
        k === 'shield' ? s.shield.owned || eq.freeShield || eq.hasShield() : s[k].owned;
      btn.style.opacity = owned || (eq.hasShield() && k === 'shield') ? '1' : '0.35';
      const cdEl = this.hudEl.querySelector(`#cd-${k}`) as HTMLElement;
      cdEl.textContent = cd > 0 ? `${Math.ceil(cd)}` : active > 0 ? `${Math.ceil(active)}` : '';
    }
  }

  showGameOver(
    stats: RunStats,
    payout: number,
    canRevive: boolean,
    breakdown: { points: number; fromScore: number; collected: number }
  ): void {
    this.goEl.classList.remove('hidden');
    this.hideSwipeHints();
    this.goEl.innerHTML = `
      <div class="card panel">
        <h2>Game Over</h2>
        <p>Tickled to a stop after ${Math.floor(stats.distance)}m.</p>
        <div class="breakdown">
          <div><span>Score</span><strong>${breakdown.points}</strong></div>
          <div><span>Gems from score (×0.006)</span><strong>${breakdown.fromScore}</strong></div>
          <div><span>Gems collected</span><strong>${breakdown.collected}</strong></div>
          <div><span>Payout</span><strong class="gem-bal">🪶 ${payout}</strong></div>
        </div>
        <div class="row">
          ${canRevive ? '<button class="btn teal" data-act="revive">Use Escape Gem</button>' : ''}
          <button class="btn" data-act="restart">Run Again</button>
          <button class="btn secondary" data-act="quit">Title</button>
          <button class="btn secondary" data-act="store">Store</button>
        </div>
      </div>
    `;
  }

  hideGameOver(): void {
    this.goEl.classList.add('hidden');
  }

  renderStore(): void {
    this.storeEl.classList.remove('hidden');
    const d = this.economy.data;
    const e = d.equipment;
    const items = [
      {
        id: 'shield' as const,
        name: 'Shield',
        desc: 'Blocks one obstacle/trap hit',
        price: PRICES.shield,
        owned: e.shield.owned,
      },
      {
        id: 'magnet' as const,
        name: 'Gem Magnet',
        desc: 'Pulls feather gems for 8s',
        price: PRICES.magnet,
        owned: e.magnet.owned,
      },
      {
        id: 'boost' as const,
        name: 'Boost',
        desc: 'Ignore hazards for 5s',
        price: PRICES.boost,
        owned: e.boost.owned,
      },
    ];

    const advHtml = ADVENTURERS.map((a) => {
      const unlocked = d.unlockedAdventurers.includes(a.id);
      const selected = d.selectedAdventurer === a.id;
      return `<div class="store-item">
        <div class="meta"><strong>${a.name}</strong><small>${a.description}</small></div>
        ${
          selected
            ? '<span class="gem-bal">Selected</span>'
            : unlocked
              ? `<button class="btn secondary" style="min-width:auto;padding:10px 14px" data-select="${a.id}">Select</button>`
              : `<button class="btn" style="min-width:auto;padding:10px 14px" data-adv="${a.id}">🪶 ${a.unlockCost}</button>`
        }
      </div>`;
    }).join('');

    this.storeEl.innerHTML = `
      <div class="card panel">
        <h2>Store</h2>
        <p class="gem-bal">Balance: 🪶 ${d.gems} · Best score: ${d.highScore}</p>
        <h3 style="margin-top:8px">Equipment</h3>
        ${items
          .map(
            (it) => `<div class="store-item">
            <div class="meta"><strong>${it.name}</strong><small>${it.desc}</small></div>
            ${
              it.owned
                ? '<span class="gem-bal">Owned</span>'
                : `<button class="btn" style="min-width:auto;padding:10px 14px" data-buy="${it.id}">🪶 ${it.price}</button>`
            }
          </div>`
          )
          .join('')}
        <div class="store-item">
          <div class="meta"><strong>Escape Gem</strong><small>Revive once on game over (green)</small></div>
          ${
            d.hasEscapeGem
              ? '<span class="gem-bal">Ready</span>'
              : `<button class="btn teal" style="min-width:auto;padding:10px 14px" data-buyescape>🪶 ${PRICES.escapeGem}</button>`
          }
        </div>
        <h3 style="margin-top:8px">Adventurers</h3>
        ${advHtml}
        <div class="row" style="margin-top:12px">
          <button class="btn secondary" data-act="close-store">Close</button>
        </div>
      </div>
    `;
  }

  hideStore(): void {
    this.storeEl.classList.add('hidden');
  }
}
