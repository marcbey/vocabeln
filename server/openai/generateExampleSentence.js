import { getOpenAIClient } from './client.js';
import { sanitizeVocabularyText } from './synthesizeVocabulary.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const CACHE_MAX_ITEMS = 200;
const sentenceCache = new Map();
const APOSTROPHE_VARIANTS_RE = /[’´`ʼʹ′]/g;

const STOP_WORDS = {
  de: new Set([
    'am',
    'an',
    'auf',
    'aus',
    'bei',
    'bis',
    'das',
    'dass',
    'dein',
    'dem',
    'den',
    'der',
    'des',
    'die',
    'ein',
    'eine',
    'einem',
    'einen',
    'einer',
    'er',
    'es',
    'für',
    'im',
    'in',
    'ist',
    'mein',
    'mit',
    'nach',
    'sich',
    'über',
    'um',
    'und',
    'vom',
    'von',
    'vor',
    'zu',
    'zum',
    'zur',
  ]),
  en: new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'for',
    'from',
    'in',
    'is',
    'of',
    'on',
    'or',
    'that',
    'the',
    'to',
    'with',
  ]),
};

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

function normalizeForMatching(value) {
  return value
    .replace(APOSTROPHE_VARIANTS_RE, "'")
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toMatchToken(token) {
  return token
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/-/g, '');
}

function tokenize(value) {
  const normalized = normalizeForMatching(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(' ')
    .map(toMatchToken)
    .filter(Boolean);
}

export function extractVocabularyVariants(vocabulary) {
  return vocabulary
    .split(/[;|/]/)
    .map((variant) => variant.replace(/^hier:\s*/i, '').trim())
    .filter(Boolean);
}

function tokenMatches(sentenceToken, vocabularyToken) {
  if (!sentenceToken || !vocabularyToken) {
    return false;
  }

  if (sentenceToken === vocabularyToken) {
    return true;
  }

  const shorter =
    sentenceToken.length <= vocabularyToken.length
      ? sentenceToken
      : vocabularyToken;
  const longer =
    sentenceToken.length > vocabularyToken.length
      ? sentenceToken
      : vocabularyToken;

  return shorter.length >= 4 && longer.startsWith(shorter);
}

function getRelevantTokens(tokens, language) {
  const stopWords = STOP_WORDS[language] || STOP_WORDS.en;
  const relevant = tokens.filter(
    (token) => token.length >= 2 && !stopWords.has(token)
  );

  if (relevant.length > 0) {
    return relevant;
  }

  return tokens.filter((token) => token.length >= 2);
}

function sentenceUsesVariant(sentence, vocabularyVariant, language) {
  const normalizedSentence = normalizeForMatching(sentence);
  const normalizedVariant = normalizeForMatching(vocabularyVariant);
  if (!normalizedSentence || !normalizedVariant) {
    return false;
  }

  if (normalizedSentence.includes(normalizedVariant)) {
    return true;
  }

  const sentenceTokens = tokenize(sentence);
  if (!sentenceTokens.length) {
    return false;
  }

  const variantTokens = getRelevantTokens(tokenize(vocabularyVariant), language);
  if (!variantTokens.length) {
    return false;
  }

  return variantTokens.every((variantToken) =>
    sentenceTokens.some((sentenceToken) =>
      tokenMatches(sentenceToken, variantToken)
    )
  );
}

export function sentenceUsesVocabulary(sentence, vocabularyVariants, language) {
  return vocabularyVariants.some((variant) =>
    sentenceUsesVariant(sentence, variant, language)
  );
}

function pickPromptVocabulary(vocabulary, variants) {
  if (variants.length) {
    return variants[0];
  }

  return vocabulary;
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

  const vocabularyVariants = extractVocabularyVariants(vocabulary);
  const promptVocabulary = pickPromptVocabulary(vocabulary, vocabularyVariants);
  const key = cacheKey(promptVocabulary, language);
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
        content:
          language === 'de'
            ? `Vokabel: ${promptVocabulary}`
            : `Vocabulary: ${promptVocabulary}`,
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
    sentenceUsesVocabulary(
      normalizedSentence,
      vocabularyVariants.length ? vocabularyVariants : [promptVocabulary],
      language
    )
      ? normalizedSentence
      : fallbackSentence(promptVocabulary, language);

  sentenceCache.set(key, {
    sentence,
    expiresAt: now + CACHE_TTL_MS,
  });
  pruneCache();

  return sentence;
}
