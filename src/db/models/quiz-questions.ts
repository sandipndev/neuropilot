/**
 * Quiz Questions Model
 * Pure CRUD operations for quiz questions
 */

import { getDB } from "../index";
import { hashString } from "../utils/hash";

export interface QuizQuestion {
  id: string;
  question: string;
  option_1: string;
  option_2: string;
  correct_answer: 1 | 2;
  timestamp: number;
}

/**
 * Save quiz questions (replaces all existing quiz questions)
 */
export async function saveQuizQuestions(
  questions: Omit<QuizQuestion, "id" | "timestamp">[]
): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  // Generate all quiz question records with hashed IDs
  const quizQuestions: QuizQuestion[] = await Promise.all(
    questions.map(async (question, index) => ({
      id: `${await hashString(question.question)}-${index}`,
      ...question,
      timestamp: now,
    }))
  );

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["QuizQuestions"], "readwrite");
    const store = transaction.objectStore("QuizQuestions");

    // Clear existing quiz questions first
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      // Add new quiz questions
      let completed = 0;
      const total = quizQuestions.length;

      if (total === 0) {
        console.debug("No quiz questions to save");
        resolve();
        return;
      }

      quizQuestions.forEach((quiz) => {
        const putRequest = store.put(quiz);

        putRequest.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.debug(`Saved ${total} quiz questions`);
            resolve();
          }
        };

        putRequest.onerror = () => {
          reject(new Error(`Failed to save quiz question: ${putRequest.error?.message}`));
        };
      });
    };

    clearRequest.onerror = () => {
      reject(new Error(`Failed to clear quiz questions: ${clearRequest.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get all quiz questions
 */
export async function getAllQuizQuestions(): Promise<QuizQuestion[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["QuizQuestions"], "readonly");
    const store = transaction.objectStore("QuizQuestions");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as QuizQuestion[]);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get quiz questions: ${request.error?.message}`));
    };
  });
}

/**
 * Delete all quiz questions
 */
export async function clearQuizQuestions(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["QuizQuestions"], "readwrite");
    const store = transaction.objectStore("QuizQuestions");

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear quiz questions: ${request.error?.message}`));
    };
  });
}
