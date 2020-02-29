
export interface Card {
  id: string;
  quiz_id: string;
  c_text: string;
  c_subtext: string;
  c_image: string;
  image_path: string;
  c_audio: string;
  audio_path: string;
  c_video: string;
  c_correct: string;
  c_study: string;
  c_substudy: string;
  cardorder: number;
  correct_count: number;
  is_hidden: number;
}
