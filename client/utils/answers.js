import { DIRECTIONS } from '../constants.js';

export const rand = (max) => Math.floor(Math.random() * max);
const APOSTROPHE_VARIANTS_RE = /[’´`ʼʹ′]/g;

export function keyFor(word) {
  return `${word.en || word.infinitive}|${word.de || word.german || ''}`;
}

export function answeredKey(word, dir) {
  return `${keyFor(word)}|${dir}`;
}

export function normalize(str) {
  return str
    .replace(APOSTROPHE_VARIANTS_RE, "'")
    .toLowerCase()
    .replace(/…/g, '')
    .replace(/\.\.\./g, ' ')
    .replace(/[,.;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeIrregularPart(str) {
  return str
    .replace(APOSTROPHE_VARIANTS_RE, "'")
    .toLowerCase()
    .replace(/…/g, '')
    .replace(/[.,;:!?]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandCommonContractions(value) {
  return value
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/\blet's\b/g, 'let us')
    .replace(/\b(i)'m\b/g, '$1 am')
    .replace(/\b(i|you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|he|she|it|we|they)'ll\b/g, '$1 will')
    .replace(/\b(i|you|he|she|it|we|they)'ve\b/g, '$1 have')
    .replace(/\b(i|you|he|she|it|we|they)'d\b/g, '$1 would')
    .replace(
      /\b(he|she|it|that|there|here|what|who|where|when|why|how)'s\b/g,
      '$1 is'
    )
    .replace(/\b([a-z]+)n't\b/g, '$1 not')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAnswerVariants(value) {
  const normalized = normalize(value);
  if (!normalized) {
    return [];
  }

  const variants = new Set();
  variants.add(normalized);
  variants.add(normalized.replace(/'/g, ''));

  const expanded = expandCommonContractions(normalized);
  if (expanded) {
    variants.add(expanded);
    variants.add(expanded.replace(/'/g, ''));
  }

  return Array.from(variants).filter(Boolean);
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
  const userVariants = new Set(getAnswerVariants(user));
  if (!userVariants.size) {
    return false;
  }

  const parts = expected.split(/;|\/|\(|\)/).filter(Boolean);
  return parts.some((part) =>
    getAnswerVariants(part).some((expectedVariant) =>
      userVariants.has(expectedVariant)
    )
  );
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
