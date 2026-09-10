import type { EquipmentKind, SaveData } from '../game/types';
import { ADVENTURERS } from '../catalogs/adventurers';
import { loadSave, writeSave, STORE_PRICES, defaultEquipment } from './SaveStore';

export class Economy {
  data: SaveData;

  constructor() {
    this.data = loadSave();
  }

  persist(): void {
    writeSave(this.data);
  }

  addGems(n: number): void {
    this.data.gems = Math.max(0, Math.floor(this.data.gems + n));
    this.persist();
  }

  spendGems(n: number): boolean {
    if (this.data.gems < n) return false;
    this.data.gems -= n;
    this.persist();
    return true;
  }

  buyEquipment(kind: EquipmentKind): boolean {
    const price = STORE_PRICES[kind];
    const slot = this.data.equipment[kind];
    if (slot.owned) return false;
    if (!this.spendGems(price)) return false;
    slot.owned = true;
    slot.ready = true;
    slot.cooldownLeft = 0;
    if (kind !== 'shield') {
      (slot as { activeLeft: number }).activeLeft = 0;
    }
    this.persist();
    return true;
  }

  buyEscapeGem(): boolean {
    if (this.data.hasEscapeGem) return false;
    if (!this.spendGems(STORE_PRICES.escapeGem)) return false;
    this.data.hasEscapeGem = true;
    this.persist();
    return true;
  }

  consumeEscapeGem(): boolean {
    if (!this.data.hasEscapeGem) return false;
    this.data.hasEscapeGem = false;
    this.persist();
    return true;
  }

  unlockAdventurer(id: string): boolean {
    const def = ADVENTURERS.find((a) => a.id === id);
    if (!def) return false;
    if (this.data.unlockedAdventurers.includes(id)) return false;
    if (!this.spendGems(def.unlockCost)) return false;
    this.data.unlockedAdventurers.push(id);
    this.persist();
    return true;
  }

  selectAdventurer(id: string): boolean {
    if (!this.data.unlockedAdventurers.includes(id)) return false;
    this.data.selectedAdventurer = id;
    this.persist();
    return true;
  }

  recordRun(score: number, distance: number): void {
    if (score > this.data.highScore) this.data.highScore = score;
    this.data.totalDistance += distance;
    this.persist();
  }

  /** Prepare equipment for a fresh run */
  prepareRunEquipment(): void {
    const e = this.data.equipment;
    for (const k of ['shield', 'magnet', 'boost'] as EquipmentKind[]) {
      const slot = e[k];
      if (slot.owned) {
        slot.ready = slot.cooldownLeft <= 0;
      }
    }
    // Trickster unlock: free ready shield cosmetic perk
    if (this.data.selectedAdventurer === 'trickster' && !e.shield.owned) {
      // temporary run-only shield readiness handled in Game
    }
    this.persist();
  }

  resetProgress(): void {
    this.data = {
      gems: 0,
      equipment: defaultEquipment(),
      unlockedAdventurers: ['scout'],
      selectedAdventurer: 'scout',
      hasEscapeGem: false,
      highScore: 0,
      totalDistance: 0,
    };
    this.persist();
  }
}
