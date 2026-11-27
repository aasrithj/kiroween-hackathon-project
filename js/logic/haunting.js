import { MAX_AMBIENT_EFFECTS, MOBILE_AMBIENT_EFFECTS } from '../config.js';

export function computeHauntingLevel(scrollProgress, validFieldCount, totalFields = 2) {
  const scroll = Math.min(1, Math.max(0, Number(scrollProgress) || 0));
  const total = Math.max(1, Number(totalFields) || 2);
  const valid = Math.min(total, Math.max(0, Number(validFieldCount) || 0));
  const level = Math.round(60 * scroll + 40 * valid / total);

  return Math.max(0, Math.min(100, level));
}

export function isIntense(level) {
  return level > 75;
}

export function ambientCount(level, isMobile = false) {
  const max = isMobile ? MOBILE_AMBIENT_EFFECTS : MAX_AMBIENT_EFFECTS;
  const clampedLevel = Math.max(0, Math.min(100, level));

  return Math.max(1, Math.ceil(clampedLevel / 100 * max));
}

export function ambientSpeed(level) {
  const clampedLevel = Math.max(0, Math.min(100, level));

  return 8 - clampedLevel / 100 * 5;
}

