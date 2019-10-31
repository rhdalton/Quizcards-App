import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
})
export class CommunityComponent implements OnInit {
  tab: string;

  constructor() { }

  ngOnInit() {

  }

  segmentChanged(ev) {
    console.log(ev.detail.value);
    this.tab = ev.detail.value;
  }

}
