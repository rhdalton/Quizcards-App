
export interface AppSettings {
  uid: string;
  appVersion?: number;
  dbVersion?: number;
  showAnswer?: boolean;
  quizAudio?: boolean;
  rtl?: boolean;
  nightMode?: boolean;
  userStatus?: string;
  firstOpen?: boolean;
  syncNotice?: boolean;
  isReset?: boolean;
  appInstallDate?: string;
  appLastStart?: string;
  dayDifference?: number;
  studiedTodayCount?: number;
  studiedToday?: boolean;
}
