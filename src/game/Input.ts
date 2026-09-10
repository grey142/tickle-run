export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private touchStart: { x: number; y: number; t: number } | null = null;
  swipeLeft = false;
  swipeRight = false;
  swipeUp = false;
  swipeDown = false;
  dragX = 0;

  constructor(target: HTMLElement | Window = window) {
    const el = target as Window;
    el.addEventListener('keydown', this.onKeyDown);
    el.addEventListener('keyup', this.onKeyUp);
    el.addEventListener('blur', this.clear);
    const touchEl = document.body;
    touchEl.addEventListener('touchstart', this.onTouchStart, { passive: false });
    touchEl.addEventListener('touchmove', this.onTouchMove, { passive: false });
    touchEl.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'c', 'control'].includes(k) || e.code === 'Space') {
      e.preventDefault();
    }
    const code = e.code === 'Space' ? ' ' : k;
    if (!this.keys.has(code)) this.justPressed.add(code);
    this.keys.add(code);
    if (e.key === 'ArrowUp') this.justPressed.add('arrowup');
    if (e.key === 'ArrowDown') this.justPressed.add('arrowdown');
    if (e.key === 'ArrowLeft') this.justPressed.add('arrowleft');
    if (e.key === 'ArrowRight') this.justPressed.add('arrowright');
    if (e.ctrlKey) this.justPressed.add('control');
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const code = e.code === 'Space' ? ' ' : k;
    this.keys.delete(code);
    this.keys.delete(e.key);
  };

  private onTouchStart = (e: TouchEvent) => {
    if ((e.target as HTMLElement)?.closest?.('[data-ui]')) return;
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY, t: performance.now() };
    this.dragX = 0;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.touchStart) return;
    if ((e.target as HTMLElement)?.closest?.('[data-ui]')) return;
    e.preventDefault();
    const t = e.touches[0];
    this.dragX = (t.clientX - this.touchStart.x) / (window.innerWidth * 0.25);
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (!this.touchStart) return;
    if ((e.target as HTMLElement)?.closest?.('[data-ui]')) {
      this.touchStart = null;
      return;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const thresh = 40;
    if (absX > thresh || absY > thresh) {
      if (absY > absX) {
        if (dy < 0) this.swipeUp = true;
        else this.swipeDown = true;
      } else {
        if (dx < 0) this.swipeLeft = true;
        else this.swipeRight = true;
      }
    }
    this.touchStart = null;
    this.dragX = 0;
  };

  clear = () => {
    this.keys.clear();
    this.justPressed.clear();
  };

  endFrame(): void {
    this.justPressed.clear();
    this.swipeLeft = false;
    this.swipeRight = false;
    this.swipeUp = false;
    this.swipeDown = false;
  }

  pressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  just(key: string): boolean {
    return this.justPressed.has(key.toLowerCase());
  }

  wantsJump(): boolean {
    return this.just(' ') || this.just('arrowup') || this.just('w') || this.swipeUp;
  }

  wantsSlide(): boolean {
    return (
      this.just('arrowdown') ||
      this.just('s') ||
      this.just('c') ||
      this.just('control') ||
      this.swipeDown
    );
  }

  wantsLeft(): boolean {
    return this.just('arrowleft') || this.just('a') || this.swipeLeft;
  }

  wantsRight(): boolean {
    return this.just('arrowright') || this.just('d') || this.swipeRight;
  }

  wantsPause(): boolean {
    return this.just('escape') || this.just('p');
  }

  strafeAxis(): number {
    let v = 0;
    if (this.pressed('arrowleft') || this.pressed('a')) v -= 1;
    if (this.pressed('arrowright') || this.pressed('d')) v += 1;
    v += Math.max(-1, Math.min(1, this.dragX));
    return Math.max(-1, Math.min(1, v));
  }
}
