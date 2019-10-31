import { Injectable } from "@angular/core";

@Injectable()
export class Networkcategories {
  categoryList;
  lang_subcat;
  subj_subcat;
  oth_subcat;

  constructor() {
    this.categoryList = ['Languages', 'Subjects', 'Other'];
    this.lang_subcat = ['Chinese', 'English', 'French', 'Hindi', 'German', 'Japanese', 'Korean', 'Russian', 'Spanish', 'Other'];
    this.subj_subcat = ['Biology', 'Chemistry', 'Geography', 'History', 'Math', 'Physics', 'Science', 'Other'];
    this.oth_subcat = ['Tests', 'Trivia', 'Knowledge', 'Other'];
  }

  get getCategoryList() {
    return this.categoryList;
  }
  get getLang_subcat() {
    return this.lang_subcat;
  }
  get getSubj_subcat() {
    return this.subj_subcat;
  }
  get getOth_subcat() {
    return this.oth_subcat;
  }
}
