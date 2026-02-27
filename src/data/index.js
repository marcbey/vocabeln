import irregularRaw from './class5_irregular_vocab_data.json';
import vocabRaw from './class5_vocab_data.json';
import { parseIrregularData, parseVocabData } from './schema.js';

function mapVocabToAppShape(vocabData) {
  return Object.fromEntries(
    Object.entries(vocabData).map(([page, entries]) => [
      page,
      entries.map((entry) => ({
        en: entry.english,
        de: entry.german,
      })),
    ])
  );
}

export const vocabData = mapVocabToAppShape(parseVocabData(vocabRaw));
export const irregularData = parseIrregularData(irregularRaw);
