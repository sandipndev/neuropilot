import activitySummaryInferenceTask from "./activity-summary"
import focusInferenceTask from "./focus"
import pulseInferenceTask from "./pulse"
import quizQuestionsInferenceTask from "./quiz-questions"
import websiteSummarizerTask from "./website-summarizer"

export const backgroundInferenceTasks = [
  websiteSummarizerTask,
  focusInferenceTask,
  pulseInferenceTask,
  activitySummaryInferenceTask,
  quizQuestionsInferenceTask
]
