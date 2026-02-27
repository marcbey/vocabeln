import class5IrregularRaw from './class5_irregular_vocab_data.json';
import class5VocabRaw from './class5_vocab_data.json';
import class6IrregularRaw from './class6_irregular_vocab_data.json';
import class6VocabRaw from './class6_vocab_data.json';
import class7IrregularRaw from './class7_irregular_vocab_data.json';
import class7VocabRaw from './class7_vocab_data.json';
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

function createDataset(vocabRaw, irregularRaw) {
  return {
    vocabData: mapVocabToAppShape(parseVocabData(vocabRaw)),
    irregularData: parseIrregularData(irregularRaw),
  };
}

export const DEFAULT_CLASS_ID = 'class5';

export const CLASS_OPTIONS = [
  {
    id: 'class5',
    label: 'Klasse 5',
    headline: 'Vokabeln für die Klasse 5',
  },
  {
    id: 'class6',
    label: 'Klasse 6',
    headline: 'Vokabeln für die Klasse 6',
  },
  {
    id: 'class7',
    label: 'Klasse 7',
    headline: 'Vokabeln für die Klasse 7',
  },
];

export const CLASS_DATASETS = {
  class5: createDataset(class5VocabRaw, class5IrregularRaw),
  class6: createDataset(class6VocabRaw, class6IrregularRaw),
  class7: createDataset(class7VocabRaw, class7IrregularRaw),
};

// Backwards-compatible exports used by a few tests and utility imports.
export const vocabData = CLASS_DATASETS[DEFAULT_CLASS_ID].vocabData;
export const irregularData = CLASS_DATASETS[DEFAULT_CLASS_ID].irregularData;
