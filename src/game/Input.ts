export type TiltPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported' | 'needs-gesture';

export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private touchStart: { x: number; y: number; t: number; id: number } | null = null;
  private ignoreTouchId: number | null = null;
  swipeLeft = false;
  swipeRight = false;
  swipeUp = false;
  swipeDown = false;
  dragX = 0;

  /** Device tilt strafe (−1…1). Calibrated relative to run-start neutral. */
  private tiltRaw = 0;
  private tiltNeutral = 0;
  private tiltCalibrated = false;
  private tiltEnabled = false;
  private tiltAxis: 'gamma' | 'beta' = 'gamma';
  tiltPermission: TiltPermissionState = 'unknown';

  private static readonly TILT_DEADZONE = 0.12;
  private static readonly TILT_SCALE = 18; // degrees → full axis

  constructor(target: HTMLElement | Window = window) {
    const el = target as Window;
    el.addEventListener('keydown', this.onKeyDown);
    el.addEventListener('keyup', this.onKeyUp);
    el.addEventListener('blur', this.clear);
    const touchEl = document.body;
    touchEl.addEventListener('touchstart', this.onTouchStart, { passive: false });
    touchEl.addEventListener('touchmove', this.onTouchMove, { passive: false });
    touchEl.addEventListener('touchend', this.onTouchEnd, { passive: false });
    touchEl.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    this.detectTiltSupport();
  }

  private detectTiltSupport(): void {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      this.tiltPermission = 'unsupported';
      return;
    }
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE.requestPermission === 'function') {
      this.tiltPermission = 'needs-gesture';
    } else {
      // Non-iOS: listen immediately; may still be zero without HTTPS / sensors
      this.attachOrientation();
      this.tiltPermission = 'granted';
    }
  }

  /** Call from a user gesture (button tap). Required on iOS 13+. */
  async requestTiltPermission(): Promise<TiltPermissionState> {
    if (this.tiltPermission === 'unsupported') return this.tiltPermission;
    if (this.tiltPermission === 'granted' && this.tiltEnabled) return this.tiltPermission;

    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    try {
      if (typeof DOE.requestPermission === 'function') {
        const result = await DOE.requestPermission();
        if (result === 'granted') {
          this.attachOrientation();
          this.tiltPermission = 'granted';
        } else {
          this.tiltPermission = 'denied';
        }
      } else {
        this.attachOrientation();
        this.tiltPermission = 'granted';
      }
    } catch {
      this.tiltPermission = 'denied';
    }
    return this.tiltPermission;
  }

  private attachOrientation(): void {
    if (this.tiltEnabled) return;
    this.tiltEnabled = true;
    window.addEventListener('deviceorientation', this.onOrientation, true);
  }

  private onOrientation = (e: DeviceOrientationEvent): void => {
    // Portrait primary: gamma is left/right tilt. Landscape fallback uses beta.
    const portrait = window.matchMedia('(orientation: portrait)').matches;
    this.tiltAxis = portrait ? 'gamma' : 'beta';
    const raw = portrait ? e.gamma : e.beta;
    if (raw == null || Number.isNaN(raw)) return;
    this.tiltRaw = raw;
    if (!this.tiltCalibrated) {
      this.tiltNeutral = raw;
      this.tiltCalibrated = true;
    }
  };

  /** Reset tilt neutral to current phone angle (call on run start). */
  calibrateTilt(): void {
    this.tiltNeutral = this.tiltRaw;
    this.tiltCalibrated = true;
  }

  private tiltAxisValue(): number {
    if (!this.tiltEnabled || this.tiltPermission !== 'granted') return 0;
    const delta = this.tiltRaw - this.tiltNeutral;
    let v = delta / Input.TILT_SCALE;
    if (Math.abs(v) < Input.TILT_DEADZONE) return 0;
    // Remap so deadzone doesn't create a jump
    const sign = Math.sign(v);
    v = sign * ((Math.abs(v) - Input.TILT_DEADZONE) / (1 - Input.TILT_DEADZONE));
    return Math.max(-1, Math.min(1, v));
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

  private isUiTarget(target: EventTarget | null): boolean {
    return !!(target as HTMLElement)?.closest?.('[data-ui]');
  }

  private onTouchStart = (e: TouchEvent) => {
    if (this.isUiTarget(e.target)) {
      // Mark UI touch so move/end don't start a swipe from equip/pause taps
      const t = e.touches[0];
      if (t) this.ignoreTouchId = t.identifier;
      return;
    }
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY, t: performance.now(), id: t.identifier };
    this.dragX = 0;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.touchStart) return;
    if (this.isUiTarget(e.target)) return;
    e.preventDefault();
    const t = this.findTouch(e.touches, this.touchStart.id) ?? e.touches[0];
    if (!t) return;
    this.dragX = (t.clientX - this.touchStart.x) / (window.innerWidth * 0.25);
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (this.ignoreTouchId != null) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.ignoreTouchId) {
          this.ignoreTouchId = null;
          return;
        }
      }
    }
    if (!this.touchStart) return;
    if (this.isUiTarget(e.target)) {
      this.touchStart = null;
      this.dragX = 0;
      return;
    }
    const t =
      this.findTouch(e.changedTouches, this.touchStart.id) ?? e.changedTouches[0];
    if (!t) {
      this.touchStart = null;
      return;
    }
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

  private findTouch(list: TouchList, id: number): Touch | null {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  }

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
    // Swipes are mirrored vs screen (camera behind runner); keys stay natural
    return this.just('arrowleft') || this.just('a') || this.swipeRight;
  }

  wantsRight(): boolean {
    return this.just('arrowright') || this.just('d') || this.swipeLeft;
  }

  wantsPause(): boolean {
    return this.just('escape') || this.just('p');
  }

  strafeAxis(): number {
    let v = 0;
    if (this.pressed('arrowleft') || this.pressed('a')) v -= 1;
    if (this.pressed('arrowright') || this.pressed('d')) v += 1;
    const tilt = this.tiltAxisValue();
    // Prefer tilt when available; drag remains fallback (or additive when no tilt)
    if (Math.abs(tilt) > 0.01) {
      v += tilt;
    } else {
      v += Math.max(-1, Math.min(1, -this.dragX)); // match swipe mirror
    }
    return Math.max(-1, Math.min(1, v));
  }

  hasTilt(): boolean {
    return this.tiltPermission === 'granted' && this.tiltEnabled;
  }
}
