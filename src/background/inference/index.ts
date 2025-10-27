import garbageCollectionTask from "../garbage-collection"
import activitySummaryInferenceTask from "./activity-summary"
import doomscrollingDetectionTask from "./doomscrolling"
import focusInferenceTask from "./focus"
import pulseInferenceTask from "./pulse"
import quizQuestionsInferenceTask from "./quiz-questions"
import websiteSummarizerTask from "./website-summarizer"

export const backgroundInferenceTasks = [
  websiteSummarizerTask,
  focusInferenceTask,
  pulseInferenceTask,
  activitySummaryInferenceTask,
  quizQuestionsInferenceTask,
  doomscrollingDetectionTask,
  garbageCollectionTask
]
