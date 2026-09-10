import type { EquipmentKind, EquipmentState } from '../game/types';
import {
  SHIELD_COOLDOWN,
  MAGNET_COOLDOWN,
  MAGNET_DURATION,
  BOOST_COOLDOWN,
  BOOST_DURATION,
} from '../game/types';

export class EquipmentSystem {
  state: EquipmentState;
  /** Run-only free shield (trickster) */
  freeShield = false;
  private shieldCharges = 0;

  constructor(state: EquipmentState, freeShield = false) {
    this.state = structuredClone(state);
    this.freeShield = freeShield;
    this.shieldCharges = 0;
    if (this.state.shield.owned && this.state.shield.ready) this.shieldCharges = 1;
    if (freeShield && this.shieldCharges === 0) this.shieldCharges = 1;
  }

  update(dt: number): void {
    const e = this.state;
    if (e.shield.cooldownLeft > 0) {
      e.shield.cooldownLeft = Math.max(0, e.shield.cooldownLeft - dt);
      if (e.shield.cooldownLeft <= 0 && e.shield.owned) {
        e.shield.ready = true;
        this.shieldCharges = 1;
      }
    }
    if (e.magnet.cooldownLeft > 0) {
      e.magnet.cooldownLeft = Math.max(0, e.magnet.cooldownLeft - dt);
      if (e.magnet.cooldownLeft <= 0 && e.magnet.owned) e.magnet.ready = true;
    }
    if (e.magnet.activeLeft > 0) {
      e.magnet.activeLeft = Math.max(0, e.magnet.activeLeft - dt);
    }
    if (e.boost.cooldownLeft > 0) {
      e.boost.cooldownLeft = Math.max(0, e.boost.cooldownLeft - dt);
      if (e.boost.cooldownLeft <= 0 && e.boost.owned) e.boost.ready = true;
    }
    if (e.boost.activeLeft > 0) {
      e.boost.activeLeft = Math.max(0, e.boost.activeLeft - dt);
    }
  }

  tryActivate(kind: EquipmentKind): boolean {
    const slot = this.state[kind];
    if (kind === 'shield') {
      if (this.shieldCharges <= 0 && !slot.ready) return false;
      // shield is passive once charged — activating arms it
      if (this.shieldCharges > 0) return true;
      return false;
    }
    if (!slot.owned || !slot.ready) return false;
    if (kind === 'magnet') {
      const m = this.state.magnet;
      m.ready = false;
      m.activeLeft = MAGNET_DURATION;
      m.cooldownLeft = MAGNET_COOLDOWN;
      return true;
    }
    if (kind === 'boost') {
      const b = this.state.boost;
      b.ready = false;
      b.activeLeft = BOOST_DURATION;
      b.cooldownLeft = BOOST_COOLDOWN;
      return true;
    }
    return false;
  }

  /** Returns true if shield absorbed the hit */
  consumeShield(): boolean {
    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      this.state.shield.ready = false;
      this.state.shield.cooldownLeft = SHIELD_COOLDOWN;
      return true;
    }
    return false;
  }

  hasShield(): boolean {
    return this.shieldCharges > 0;
  }

  isMagnetActive(): boolean {
    return this.state.magnet.activeLeft > 0;
  }

  isBoostActive(): boolean {
    return this.state.boost.activeLeft > 0;
  }

  magnetRangeBonus(): number {
    return this.isMagnetActive() ? 6 : 0;
  }
}
