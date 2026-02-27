import { getOpenAIClient } from './client.js';
import { sanitizeVocabularyText } from './synthesizeVocabulary.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const CACHE_MAX_ITEMS = 200;
const sentenceCache = new Map();

const PROMPT_BY_LANGUAGE = {
  de: [
    'Erzeuge genau einen kurzen alltagstauglichen deutschen Beispielsatz (6-14 Woerter).',
    'Nutze die gegebene Vokabel genau einmal im Satz.',
    'Gib nur den Satz zurueck, ohne Erklaerung und ohne Anfuehrungszeichen.',
  ].join(' '),
  en: [
    'Create exactly one short everyday English sentence (6-14 words).',
    'Use the provided vocabulary exactly once in the sentence.',
    'Return only the sentence, no explanation and no quotation marks.',
  ].join(' '),
};

function cacheKey(vocabulary, language) {
  return `${language}:${vocabulary.toLowerCase()}`;
}

function pruneCache() {
  const now = Date.now();

  for (const [key, value] of sentenceCache) {
    if (value.expiresAt <= now) {
      sentenceCache.delete(key);
    }
  }

  while (sentenceCache.size > CACHE_MAX_ITEMS) {
    const oldestKey = sentenceCache.keys().next().value;
    sentenceCache.delete(oldestKey);
  }
}

function normalizeSentence(text) {
  return text
    .replace(/^[\s"'`]+/, '')
    .replace(/[\s"'`]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesVocabulary(sentence, vocabulary) {
  return sentence.toLowerCase().includes(vocabulary.toLowerCase());
}

function fallbackSentence(vocabulary, language) {
  if (language === 'de') {
    return `Ich benutze heute das Wort ${vocabulary}.`;
  }

  return `Today I use the word ${vocabulary}.`;
}

export async function generateExampleSentence({ text, language }) {
  const vocabulary = sanitizeVocabularyText(text.trim());
  if (!vocabulary) {
    throw new Error('Vocabulary text for example sentence is empty.');
  }

  const key = cacheKey(vocabulary, language);
  const now = Date.now();
  const cachedEntry = sentenceCache.get(key);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.sentence;
  }

  if (cachedEntry) {
    sentenceCache.delete(key);
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini',
    input: [
      {
        role: 'system',
        content: PROMPT_BY_LANGUAGE[language] || PROMPT_BY_LANGUAGE.en,
      },
      {
        role: 'user',
        content: `Vocabulary: ${vocabulary}`,
      },
    ],
    temperature: 0.5,
    max_output_tokens: 80,
  });

  const rawSentence =
    typeof response.output_text === 'string' ? response.output_text : '';
  const normalizedSentence = normalizeSentence(rawSentence);
  const sentence =
    normalizedSentence &&
    normalizedSentence.length <= 180 &&
    includesVocabulary(normalizedSentence, vocabulary)
      ? normalizedSentence
      : fallbackSentence(vocabulary, language);

  sentenceCache.set(key, {
    sentence,
    expiresAt: now + CACHE_TTL_MS,
  });
  pruneCache();

  return sentence;
}
