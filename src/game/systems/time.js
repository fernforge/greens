// Time, calendar, season, and weather. The clock runs while playing; sleeping
// jumps to the next morning. Days are 28 per season, 4 seasons per year.

import { SEASON_NAMES } from '../data/crops.js';

export const DAYS_PER_SEASON = 28;
export const START_HOUR = 6;
export const END_HOUR = 26;            // 2 AM next day = pass-out time
export const MINUTES_PER_REAL_SEC = 0.7; // in-game minutes advanced per real second base

export const WEATHERS = ['sunny', 'rainy', 'cloudy', 'stormy', 'snowy'];
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export class TimeSystem {
  constructor() {
    this.minute = START_HOUR * 60;  // minutes since midnight
    this.day = 1;                   // 1..28
    this.season = 0;                // 0..3
    this.year = 1;
    this.weather = 'sunny';
    this.tomorrowWeather = 'sunny';
    this._acc = 0;
    this.speed = 1;                 // global time multiplier
  }

  get hour() { return Math.floor(this.minute / 60); }
  get min() { return Math.floor(this.minute % 60); }
  get totalDay() { return (this.year - 1) * DAYS_PER_SEASON * 4 + this.season * DAYS_PER_SEASON + this.day; }
  get dayName() { return DAY_NAMES[(this.totalDay - 1) % 7]; }
  get seasonName() { return SEASON_NAMES[this.season]; }
  get isNight() { return this.minute >= 19 * 60 || this.minute < 6 * 60; }
  get pastBedtime() { return this.minute >= END_HOUR * 60; }

  clockString() {
    let h = this.hour, m = this.min;
    const am = h < 12 || h >= 24;
    let dh = h % 12; if (dh === 0) dh = 12;
    if (h >= 24) { dh = h - 24; if (dh === 0) dh = 12; }
    return `${dh}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
  }

  // Daylight factor 0 (deep night) .. 1 (full day) for the lighting tint.
  daylight() {
    const m = this.minute;
    if (m < 5 * 60) return 0.05;
    if (m < 7 * 60) return (m - 5 * 60) / (2 * 60);          // dawn
    if (m < 17 * 60) return 1;
    if (m < 20 * 60) return 1 - ((m - 17 * 60) / (3 * 60)) * 0.85; // dusk
    return 0.15;
  }

  advance(dt) {
    this._acc += dt * MINUTES_PER_REAL_SEC * this.speed * 10;
    while (this._acc >= 1) { this.minute += 1; this._acc -= 1; }
  }

  // Roll next-day weather based on season.
  rollWeather(rng) {
    let table;
    switch (this.season) {
      case 0: table = [['sunny', 5], ['rainy', 3], ['cloudy', 2]]; break;       // spring
      case 1: table = [['sunny', 7], ['cloudy', 2], ['stormy', 1]]; break;      // summer
      case 2: table = [['sunny', 4], ['rainy', 3], ['cloudy', 3]]; break;       // fall
      case 3: table = [['snowy', 5], ['cloudy', 3], ['sunny', 2]]; break;       // winter
    }
    return rng.weighted(table);
  }

  isRaining() { return this.weather === 'rainy' || this.weather === 'stormy'; }

  // Move to next morning. Returns info about what rolled over.
  nextDay(rng) {
    this.minute = START_HOUR * 60;
    this.day += 1;
    this.weather = this.tomorrowWeather;
    if (this.day > DAYS_PER_SEASON) {
      this.day = 1;
      this.season = (this.season + 1) % 4;
      if (this.season === 0) this.year += 1;
    }
    this.tomorrowWeather = this.rollWeather(rng);
    return { season: this.season, day: this.day };
  }

  musicTrack(area) {
    if (!area) return 'farm_spring';
    if (area.music && area.music.startsWith('farm')) return ['farm_spring', 'farm_summer', 'farm_fall', 'farm_winter'][this.season];
    return area.music || 'farm_spring';
  }

  serialize() { return { minute: this.minute, day: this.day, season: this.season, year: this.year, weather: this.weather, tomorrow: this.tomorrowWeather }; }
  load(d) { this.minute = d.minute; this.day = d.day; this.season = d.season; this.year = d.year; this.weather = d.weather; this.tomorrowWeather = d.tomorrow || 'sunny'; }
}
