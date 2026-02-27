import { useCallback } from 'react';
import { DIRECTIONS, IRREGULAR_PAGE_KEY } from '../../constants.js';
import { countAnswered } from '../../utils/answers.js';
import {
  clearAllProgress,
  loadProgressMap,
  loadSettings,
  saveProgressMap,
  saveSettings,
} from '../../utils/storage.js';

function parseAnsweredSet(entry) {
  try {
    return new Set(JSON.parse(entry?.answered || '[]'));
  } catch {
    return new Set();
  }
}

function parseBoardMode(value) {
  return value === true || value === '1' || value === 'true';
}

function getCompletedPages(progressMap) {
  const completed = new Set();
  Object.values(progressMap).forEach((entry) => {
    if (entry?.completed) {
      completed.add(entry.page);
    }
  });
  return completed;
}

export function useQuizPersistence({
  classId,
  page,
  direction,
  boardMode,
  asked,
  answeredCorrect,
  pageComplete,
}) {
  const persistSettings = useCallback(
    (
      nextPage = page,
      nextDirection = direction,
      nextBoardMode = boardMode
    ) => {
      saveSettings({
        currentPage: nextPage,
        direction: nextDirection,
        boardMode: nextBoardMode,
      }, classId);
    },
    [boardMode, classId, direction, page]
  );

  const loadPageProgress = useCallback(
    (nextPage, progressMap = loadProgressMap(classId)) => {
      const entry = progressMap[nextPage];
      if (!entry) {
        return {
          asked: 0,
          answeredCorrect: new Set(),
        };
      }

      return {
        asked: entry.asked || 0,
        answeredCorrect: parseAnsweredSet(entry),
      };
    },
    [classId]
  );

  const hydrateSession = useCallback(
    (pages) => {
      if (!pages.length) {
        return null;
      }

      const settings = loadSettings(classId);
      const progressMap = loadProgressMap(classId);

      const savedDirection = settings.direction || 'mixed';
      const savedPage = pages.includes(settings.currentPage)
        ? settings.currentPage
        : pages[0];
      const initialPage =
        savedDirection === 'irregular' ? IRREGULAR_PAGE_KEY : savedPage;

      return {
        direction: savedDirection,
        savedPage,
        initialPage,
        boardMode: parseBoardMode(settings.boardMode),
        completedPages: getCompletedPages(progressMap),
        pageProgress: loadPageProgress(initialPage, progressMap),
      };
    },
    [classId, loadPageProgress]
  );

  const persistProgress = useCallback(
    ({
      targetPage = page,
      targetDirection = direction,
      nextAnswered = answeredCorrect,
      nextAsked = asked,
      completed = pageComplete,
    } = {}) => {
      const progress = loadProgressMap(classId);

      const regularCorrect =
        countAnswered(nextAnswered, DIRECTIONS[0]) +
        countAnswered(nextAnswered, DIRECTIONS[1]);

      progress[targetPage] = {
        page: targetPage,
        asked: nextAsked,
        correct:
          targetDirection === 'irregular'
            ? countAnswered(nextAnswered, 'irregular')
            : regularCorrect,
        answered: JSON.stringify(Array.from(nextAnswered)),
        completed: completed ? 1 : 0,
      };

      saveProgressMap(progress, classId);
    },
    [answeredCorrect, asked, classId, direction, page, pageComplete]
  );

  const clearStoredProgress = useCallback(() => {
    clearAllProgress(classId);
  }, [classId]);

  return {
    persistSettings,
    loadPageProgress,
    hydrateSession,
    persistProgress,
    clearStoredProgress,
  };
}
