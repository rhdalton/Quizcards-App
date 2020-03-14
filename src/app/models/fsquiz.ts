import { ExportQuiz } from 'src/app/models/exportquiz';

export interface FSQuiz {
  user_id: string;
  user_name: string;
  cloudId: string;
  id?: string;
  quizId: string;
  quizname: string;
  quizcolor: string;
  cardcount: number;
  isMergeable: number;
  isShareable: number;
  isPurchased: number;
  quizData: string;
  imageData: string;
}
