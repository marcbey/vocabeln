import { DIRECTIONS } from '../constants.js';

export const rand = (max) => Math.floor(Math.random() * max);

export function keyFor(word) {
  return `${word.en || word.infinitive}|${word.de || word.german || ''}`;
}

export function answeredKey(word, dir) {
  return `${keyFor(word)}|${dir}`;
}

export function normalize(str) {
  return str
    .toLowerCase()
    .replace(/…/g, '')
    .replace(/\.\.\./g, ' ')
    .replace(/[,.;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeIrregularPart(str) {
  return str
    .toLowerCase()
    .replace(/…/g, '')
    .replace(/[.,;:!?]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitIrregularAnswer(raw) {
  const primary = raw.split(/\s*[;,|]\s*/).filter(Boolean);
  if (primary.length >= 3) return primary.slice(0, 3);
  const secondary = raw.split(/\s{2,}/).filter(Boolean);
  if (secondary.length >= 3) return secondary.slice(0, 3);
  return raw.split(/\s+/).filter(Boolean).slice(0, 3);
}

export function isCorrectIrregular(user, verb) {
  const parts = splitIrregularAnswer(user).map(normalizeIrregularPart);
  if (parts.length < 3) return false;
  const expected = [verb.infinitive, verb.simplePast, verb.pastParticiple];
  return expected.every((exp, idx) => {
    const alts = exp.split('/').map(normalizeIrregularPart).filter(Boolean);
    alts.push(normalizeIrregularPart(exp));
    return alts.some((alt) => parts[idx] === alt);
  });
}

export function isCorrect(user, expected) {
  const userClean = normalize(user);
  const parts = expected.split(/;|\/|\(|\)/).map(normalize).filter(Boolean);
  return parts.some((p) => p && userClean === p);
}

export function countAnswered(answeredSet, dir) {
  let count = 0;
  answeredSet.forEach((entry) => {
    const parts = entry.split('|');
    const entryDir = parts[2] || DIRECTIONS[0];
    if (entryDir === dir) count += 1;
  });
  return count;
}
