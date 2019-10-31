
export interface Quiz {
  id: string;
  quizname: string;
  quizcolor: string;
  switchtext: number;
  cardcount: number;
  cardview: string;
  isArchived: number;
  isMergeable: number;
  isBackable: number;
  isShareable: number;
  isPurchased: number;
  cloudId: string;
  networkId: string;
  shareId: string;
  creator_name: string;
  tts: string;
  ttsaudio: number;
  quizLimit: number;
  quizTimer: number;
  studyShuffle: number;
  quizShuffle: number;
  ttsSpeed: number;
}
