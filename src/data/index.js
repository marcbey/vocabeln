import class5IrregularRaw from './class5_irregular_vocab_data.json';
import class5UnitPagesRaw from './class5_unit_pages.json';
import class5VocabRaw from './class5_vocab_data.json';
import class6IrregularRaw from './class6_irregular_vocab_data.json';
import class6UnitPagesRaw from './class6_unit_pages.json';
import class6VocabRaw from './class6_vocab_data.json';
import class7IrregularRaw from './class7_irregular_vocab_data.json';
import class7UnitPagesRaw from './class7_unit_pages.json';
import class7VocabRaw from './class7_vocab_data.json';
import class8IrregularRaw from './class8_irregular_vocab_data.json';
import class8UnitPagesRaw from './class8_unit_pages.json';
import class8VocabRaw from './class8_vocab_data.json';
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

function mapUnitPagesToAppShape(vocabData, unitPagesData = {}) {
  const knownPages = new Set(Object.keys(vocabData));

  return Object.fromEntries(
    Object.entries(unitPagesData).map(([unit, pages]) => [
      unit,
      pages.filter((page) => knownPages.has(page)),
    ])
  );
}

function createDataset(vocabRaw, irregularRaw, unitPagesRaw) {
  const parsedVocab = parseVocabData(vocabRaw);

  return {
    vocabData: mapVocabToAppShape(parsedVocab),
    irregularData: parseIrregularData(irregularRaw),
    unitPages: mapUnitPagesToAppShape(parsedVocab, unitPagesRaw),
  };
}

export const DEFAULT_CLASS_ID = 'class5';

export const CLASS_OPTIONS = [
  {
    id: 'class5',
    label: 'Klasse 5',
    headline: 'Englisch Vokabeln für die Klasse 5',
  },
  {
    id: 'class6',
    label: 'Klasse 6',
    headline: 'Englisch Vokabeln für die Klasse 6',
  },
  {
    id: 'class7',
    label: 'Klasse 7',
    headline: 'Englisch Vokabeln für die Klasse 7',
  },
  {
    id: 'class8',
    label: 'Klasse 8',
    headline: 'Englisch Vokabeln für die Klasse 8',
  },
];

export const CLASS_DATASETS = {
  class5: createDataset(class5VocabRaw, class5IrregularRaw, class5UnitPagesRaw),
  class6: createDataset(class6VocabRaw, class6IrregularRaw, class6UnitPagesRaw),
  class7: createDataset(class7VocabRaw, class7IrregularRaw, class7UnitPagesRaw),
  class8: createDataset(class8VocabRaw, class8IrregularRaw, class8UnitPagesRaw),
};

// Backwards-compatible exports used by a few tests and utility imports.
export const vocabData = CLASS_DATASETS[DEFAULT_CLASS_ID].vocabData;
export const irregularData = CLASS_DATASETS[DEFAULT_CLASS_ID].irregularData;
