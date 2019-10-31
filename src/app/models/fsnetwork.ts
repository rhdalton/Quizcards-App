
export interface NWQuiz {
  id: string;
  networkId: string;
  quizname: string;
  quizcolor: string;
  quizdesc: string;
  quizcategory: string;
  quizsubcat: string;
  quizsubcatkey: string;
  quiztts: string;
  quizauthor: string;
  quizpublishdate: Date;
  audioquiz: boolean;
  imagequiz: boolean;
  quizdownloads: number;
  quizrating: number;
  cardcount: number;
  isPurchase: boolean;
  purchasePrice: number;
  productId: string;
  isActive: boolean;
}
