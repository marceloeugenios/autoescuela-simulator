export interface Answer {
  text: string;
  correct: boolean;
}

export interface TestRef {
  cditest: number;
  name: string;
}

export interface Question {
  id: number;
  question: string;
  image: string | null;
  explanation: string;
  answers: Answer[];
  tests: TestRef[];
}

export interface Test {
  cditest: number;
  name: string;
  question_ids: number[];
}

export type QuestionsMap = Record<number, Question>;
export type TestsMap = Record<number, Test>;
export type TestGroups = Record<string, Test[]>;

export interface TestResult {
  questions: Question[];
  mistakes: number[];
  timerSeconds: number;
  testId: string;
}
