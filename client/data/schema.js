import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

export const vocabEntrySchema = z.object({
  english: nonEmptyString,
  german: nonEmptyString,
});

export const vocabDataSchema = z.record(
  nonEmptyString,
  z.array(vocabEntrySchema)
);

export const irregularVerbSchema = z.object({
  infinitive: nonEmptyString,
  simplePast: nonEmptyString,
  pastParticiple: nonEmptyString,
  german: nonEmptyString,
});

export const irregularDataSchema = z.array(irregularVerbSchema);

function formatError(datasetName, issues) {
  const summary = issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    })
    .join(', ');

  return `${datasetName} dataset is invalid. ${summary}`;
}

export function parseVocabData(data) {
  const result = vocabDataSchema.safeParse(data);
  if (!result.success) {
    throw new Error(formatError('Vocab', result.error.issues));
  }
  return result.data;
}

export function parseIrregularData(data) {
  const result = irregularDataSchema.safeParse(data);
  if (!result.success) {
    throw new Error(formatError('Irregular verbs', result.error.issues));
  }
  return result.data;
}
