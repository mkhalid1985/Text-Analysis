export interface GuidedQuestion {
  category: string;
  question: string;
  hint: string;
  answer: string;
  explanation: string;
  relevantText: string;
  questionType: 'mcq' | 'descriptive';
  options?: string[];
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  feedback: string;
}

export interface QuestionState extends GuidedQuestion {
  userAnswer: string;
  evaluation: AnswerEvaluation | null;
  status: 'unanswered' | 'evaluating' | 'answered';
  hintVisible: boolean;
}
