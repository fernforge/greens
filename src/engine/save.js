// Save/load manager backed by localStorage. Supports multiple slots + autosave.

const PREFIX = 'greens_save_';
const SETTINGS_KEY = 'greens_settings';
const VERSION = 1;

export const SaveManager = {
  slots() {
    const out = [];
    for (let i = 0; i < 3; i++) out.push(this.meta(i));
    return out;
  },
  meta(slot) {
    try {
      const raw = localStorage.getItem(PREFIX + slot);
      if (!raw) return { slot, empty: true };
      const data = JSON.parse(raw);
      return {
        slot, empty: false,
        farmName: data.meta?.farmName || 'Farm',
        playerName: data.meta?.playerName || 'Farmer',
        day: data.time?.day ?? 1, season: data.time?.season ?? 0, year: data.time?.year ?? 1,
        gold: data.player?.gold ?? 0,
        playtime: data.meta?.playtime ?? 0,
        savedAt: data.meta?.savedAt ?? 0,
      };
    } catch { return { slot, empty: true, corrupt: true }; }
  },
  save(slot, data) {
    try {
      data.version = VERSION;
      localStorage.setItem(PREFIX + slot, JSON.stringify(data));
      return true;
    } catch (e) { console.error('Save failed', e); return false; }
  },
  load(slot) {
    try {
      const raw = localStorage.getItem(PREFIX + slot);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  },
  delete(slot) { localStorage.removeItem(PREFIX + slot); },
  exists(slot) { return !!localStorage.getItem(PREFIX + slot); },

  loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { return {}; }
  },
  saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  },
};
