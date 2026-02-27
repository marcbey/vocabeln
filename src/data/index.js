import irregularRaw from './irregular_vocab_data.json';
import vocabRaw from './vocab_data.json';
import { parseIrregularData, parseVocabData } from './schema.js';

export const vocabData = parseVocabData(vocabRaw);
export const irregularData = parseIrregularData(irregularRaw);
