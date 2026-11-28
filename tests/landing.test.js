// Tests for the invitation logic and the title sequence schedule. Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validateEmail, validateDetails } from '../www/js/logic/validation.js';
import { computeHauntingLevel, isIntense, ambientCount, ambientSpeed } from '../www/js/logic/haunting.js';
import { initialState, reduce } from '../www/js/logic/sequence.js';
import { saveDetails, loadDetails } from '../www/js/storage.js';
import { copy } from '../www/js/content.js';
import { MAX_AMBIENT_EFFECTS, MOBILE_AMBIENT_EFFECTS, TITLE_SHOTS, TITLE_TIMING } from '../www/js/config.js';
import { buildSchedule, masterAlpha, isSettled, shotAt, skipTarget, skipDip } from '../www/js/logic/title-sequence.js';

const RUNS = 2000;
const rand = (min, max) => min + Math.random() * (max - min);

test('names are valid when 1 to 100 characters after trimming', () => {
  assert.equal(validateName('Ada').valid, true);
  assert.equal(validateName('  Ada  ').valid, true);
  assert.equal(validateName('a'.repeat(100)).valid, true);
  assert.deepEqual(validateName('a'.repeat(101)), { valid: false, error: 'nameTooLong' });
  assert.deepEqual(validateName('   '), { valid: false, error: 'nameRequired' });
  assert.deepEqual(validateName(undefined), { valid: false, error: 'nameRequired' });
});

test('emails accept two-letter endings and reject malformed addresses', () => {
  for (const ok of ['ada@example.com', 'ada@site.io', 'ada@site.co', 'a.b@mail.example.org', '  ada@site.io  ']) {
    assert.equal(validateEmail(ok).valid, true, ok);
  }
  for (const bad of ['', 'ada', 'ada@', '@site.io', 'ada@site', 'ada@site.c', 'a da@site.io', 'ada@@site.io']) {
    assert.deepEqual(validateEmail(bad), { valid: false, error: 'emailInvalid' }, bad);
  }
  assert.equal(validateEmail(`${'a'.repeat(250)}@b.io`).valid, false);
});

test('every validation error has themed copy', () => {
  for (const key of ['nameRequired', 'nameTooLong', 'emailInvalid']) {
    assert.equal(typeof copy[key], 'string', key);
    assert.ok(copy[key].length > 0, key);
  }
  const result = validateDetails({ name: '', email: 'x' });
  assert.equal(result.name.valid, false);
  assert.equal(result.email.valid, false);
});

test('the haunting level is a bounded integer and never falls as inputs rise', () => {
  for (let i = 0; i < RUNS; i += 1) {
    const s1 = rand(-0.5, 1.5);
    const s2 = s1 + rand(0, 1);
    const v1 = Math.floor(rand(-1, 3));
    const v2 = v1 + Math.floor(rand(0, 3));
    const a = computeHauntingLevel(s1, v1);
    const b = computeHauntingLevel(s2, v2);
    assert.ok(Number.isInteger(a) && a >= 0 && a <= 100);
    assert.ok(Number.isInteger(b) && b >= 0 && b <= 100);
    assert.ok(a <= b, `${s1},${v1} -> ${a} but ${s2},${v2} -> ${b}`);
  }
});

test('the footer threshold gives 60, and each valid field adds 20', () => {
  assert.equal(computeHauntingLevel(0, 0), 0);
  assert.equal(computeHauntingLevel(1, 0), 60);
  assert.equal(computeHauntingLevel(1, 1), 80);
  assert.equal(computeHauntingLevel(1, 2), 100);
  assert.equal(computeHauntingLevel(Number.NaN, Number.NaN), 0);
  assert.equal(isIntense(75), false);
  assert.equal(isIntense(76), true);
});

test('ambient effects grow in number and speed with the level', () => {
  assert.ok(ambientCount(100) > ambientCount(1));
  assert.equal(ambientCount(100), MAX_AMBIENT_EFFECTS);
  assert.equal(ambientCount(100, true), MOBILE_AMBIENT_EFFECTS);
  assert.ok(ambientCount(0) >= 1);
  // ambientSpeed is a loop duration: shorter means faster.
  assert.ok(ambientSpeed(100) < ambientSpeed(1));
});

test('only valid submissions count, and the crossing happens once on the third', () => {
  let state = initialState;
  const phases = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    state = reduce(state, { type: 'ANIMATION_DONE' });
    state = reduce(state, { type: 'VALID_SUBMIT' });
    phases.push(state.phase);
    assert.equal(state.attempts, attempt);
    // A second submit during the animation is ignored.
    assert.equal(reduce(state, { type: 'VALID_SUBMIT' }), state);
    if (attempt < 3) state = reduce(state, { type: 'ANIMATION_DONE' });
  }
  assert.deepEqual(phases, ['shaking', 'shaking', 'crossing']);
  state = reduce(state, { type: 'CROSSING_DONE' });
  assert.equal(state.phase, 'done');
  assert.equal(reduce(state, { type: 'VALID_SUBMIT' }), state);
  assert.equal(reduce(state, { type: 'CROSSING_DONE' }), state);
  assert.equal(reduce(initialState, { type: 'UNKNOWN' }), initialState);
});

test('signup details round-trip through storage, and bad storage never throws', () => {
  const memory = new Map();
  const storage = { setItem: (k, v) => memory.set(k, v), getItem: (k) => memory.get(k) ?? null };
  const details = { name: 'Ada Lovelace', email: 'ada@site.io' };
  assert.equal(saveDetails(details, storage), true);
  assert.deepEqual(loadDetails(storage), details);
  assert.equal(loadDetails({ getItem: () => '{not json' }), null);
  assert.equal(loadDetails({ getItem: () => JSON.stringify({ name: 1 }) }), null);
  const broken = { setItem: () => { throw new Error('full'); }, getItem: () => { throw new Error('blocked'); } };
  assert.equal(saveDetails(details, broken), false);
  assert.equal(loadDetails(broken), null);
});

test('the title sequence cuts, pulls back, and settles at 25 seconds', () => {
  const schedule = buildSchedule(TITLE_SHOTS, TITLE_TIMING);
  assert.deepEqual(schedule.shots.map((s) => s.start), [2000, 5600, 7400, 9200, 11200]);
  assert.equal(schedule.pullStart, 13000);
  assert.equal(schedule.end, 25000);
  assert.equal(shotAt(schedule, 1000), null);
  assert.equal(shotAt(schedule, 5599).i, TITLE_SHOTS[0].i);
  assert.equal(shotAt(schedule, 5600).i, TITLE_SHOTS[1].i);
  assert.equal(shotAt(schedule, 13000), null);
  assert.equal(isSettled(schedule, 24999), false);
  assert.equal(isSettled(schedule, 25000), true);
});

test('the title stays black, fades in, and never fades out', () => {
  const schedule = buildSchedule(TITLE_SHOTS, TITLE_TIMING);
  assert.equal(masterAlpha(schedule, 0), 0);
  assert.equal(masterAlpha(schedule, 2000), 0);
  assert.equal(masterAlpha(schedule, 3600), 1);
  for (let i = 0; i < RUNS; i += 1) {
    const t = rand(0, 10 * 60 * 1000);
    const a = masterAlpha(schedule, t);
    assert.ok(a >= 0 && a <= 1);
    if (t >= 3600) assert.equal(a, 1);
  }
});

test('Skip intro dips to black and lands 6 seconds before the title settles', () => {
  const schedule = buildSchedule(TITLE_SHOTS, TITLE_TIMING);
  assert.equal(skipTarget(schedule, TITLE_TIMING), schedule.end - TITLE_TIMING.skipLead);
  assert.ok(skipTarget(schedule, TITLE_TIMING) >= schedule.pullStart);
  assert.equal(skipDip(0, TITLE_TIMING), 1);
  assert.equal(skipDip(TITLE_TIMING.skipFadeOut, TITLE_TIMING), 0);
  assert.equal(skipDip(TITLE_TIMING.skipFadeOut + TITLE_TIMING.skipFadeIn, TITLE_TIMING), 1);
  for (let i = 0; i < RUNS; i += 1) {
    const d = skipDip(rand(0, 5000), TITLE_TIMING);
    assert.ok(d >= 0 && d <= 1);
  }
});
