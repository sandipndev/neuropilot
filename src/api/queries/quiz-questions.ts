/**
 * Quiz Questions Query API
 * Retrieves quiz questions generated from user's learning activity
 */

import { getAllQuizQuestions, type QuizQuestion } from "../../db/models/quiz-questions";

/**
 * Get all available quiz questions
 */
export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const questions = await getAllQuizQuestions();
    return questions;
  } catch (error) {
    console.error("Failed to get quiz questions:", error);
    return [];
  }
}
