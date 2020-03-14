
export interface NWQuiz {
  id: string;
  networkId: string;
  quizname: string;
  quizcolor: string;
  quizdesc: string;
  quizcategory: string;
  quizsubcat: string;
  quizsubcatkey: string;
  quizauthor: string;
  quizpublishdate: Date;
  quizpublishtimestamp: number;
  audioData: string;
  imageData: string;
  quizData: string;
  quizdownloads: number;
  quizrating: number;
  cardcount: number;
  isPurchase: boolean;
  purchasePrice: number;
  productId: string;
  isActive: boolean;
  quiztts?: string;
}
