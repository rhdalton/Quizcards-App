import { ExportCard } from 'src/app/models/exportcard';

export interface ExportQuiz {
  quizid: string;
  quizname: string;
  quizcolor: string;
  qcver: number;
  qcdbver: number;
  backuptime: number;
  cards: ExportCard[];
}
