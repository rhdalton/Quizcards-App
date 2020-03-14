import { Injectable } from "@angular/core";

@Injectable()
export class Networkcategories {
  categoryList;
  lang_subcat;
  subj_subcat;
  oth_subcat;
  current_cat: string;
  current_subcat: string;
  subcat: any[];

  constructor() {
    this.categoryList = ['Languages', 'Subjects', 'Other'];
    this.lang_subcat = ['Arabic', 'Chinese', 'English', 'French', 'Hindi', 'German', 'Japanese', 'Korean', 'Russian', 'Spanish', 'Other'];
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

  getCatList() {
    return this.categoryList;
  }

  getSubCats(cat) {
    let subcat = [];
    switch (cat) {
      case 'Languages':
        subcat = this.lang_subcat;
        break;
      case 'Subjects':
        subcat = this.subj_subcat;
        break;
      case 'Other':
        subcat = this.oth_subcat;
        break;
      default:
        subcat = [];
    }
    return subcat;
  }

  subcatKey(cat, sub) {
    return cat.substr(0, 3).toLowerCase() + '-' + sub.toLowerCase();
  }
}
