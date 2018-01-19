import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-timelog-view',
  templateUrl: './timelog-view.component.html',
  styleUrls: ['./timelog-view.component.css']
})
export class TimelogViewComponent implements OnInit {
  middleX = 75;
  middleY = 75;
  radius = 50;

  projectData: TimelogSlice[] = [];

  projectBuffer = '';

  constructor() {
  }

  ngOnInit() {
    setInterval(() => {
      this.projectData.forEach((slice, index) => this.updateHours(slice));
      this.projectData.forEach((slice, index) => this.setupSlice(slice, index));
    }, 50);
  }

  @HostListener('document:keydown', ['$event'])
  onType(event: KeyboardEvent) {
    const key = event.key;
    if (/^[a-zA-Z0-9\-]$/.test(key)) {
      this.projectBuffer += key;
      return;
    }
    if (key === 'Enter') {
      this.handleBuffer();
      return;
    }
    if (key === 'Backspace') {
      this.projectBuffer = this.projectBuffer.slice(0, -1);
      return;
    }
    console.log(event);
  }

  handleBuffer() {
    const curTime = new Date().valueOf();
    const runningProject = this.projectData.find(item => item.millis.length % 2 === 1);
    if (runningProject) {
      if (runningProject.project !== this.projectBuffer) {
        runningProject.millis.push(curTime);
      }
    }
    const project = this.projectData.find(item => item.project === this.projectBuffer);
    if (!project) {
      this.projectData.push({
        project: this.projectBuffer,
        hours: 0,
        millis: [curTime]
      });
    } else {
      project.millis.push(curTime);
    }
    this.projectBuffer = '';
  }

  setTransform(slice: TimelogSlice) {
    slice.transform = `rotate(${slice.rotation} ${this.middleX} ${this.middleY})`;
  }

  setupSlice(slice: TimelogSlice, index?: number) {
    this.toSVGPathString(slice, index);
    this.setTransform(slice);
  }

  updateHours(slice: TimelogSlice) {
    let hours = slice.millis.reduce((aggr, item, index) => index % 2 === 0 ? aggr - item : aggr + item, 0);
    if (slice.millis.length % 2 === 1) {
      slice.current = true;
      const curTime = new Date().valueOf();
      hours += curTime;
    } else {
      slice.current = false;
    }
    slice.hours = hours / (1000 * 60 * 60);
  }

  getTotalHours() {
    return this.projectData.reduce((aggr, item) => aggr + item.hours, 0);
  }

  toSVGPathString(slice: TimelogSlice, index?: number) {
    const hours = slice.hours;
    const total = this.getTotalHours();
    const move = `M ${this.middleX} ${this.middleY}`;
    const line = `h -${this.radius}`;

    const angle = hours / total * 360;
    slice.angle = angle;
    if (typeof index !== 'undefined') {
      slice.rotation = this.projectData.slice(0, index).reduce((aggr, item) => aggr + item.angle, 0);
    }
    const newY = this.middleY - Math.sin(angle * Math.PI / 180) * this.radius;
    const newX = this.middleX - Math.cos(angle * Math.PI / 180) * this.radius;
    // tslint:disable-next-line:max-line-length
    const arc = `A ${this.radius} ${this.radius} 0
    ${angle > 180 || angle === 0 ? 1 : 0} ${angle === 360 ? 0 : 1}
    ${newX} ${angle === 360 ? newY - 0.01 : newY} Z`;

    slice.path = [move, line, arc].join(' ');
  }

}

interface TimelogSlice {
  path?: string;
  transform?: string;
  percentage?: string;
  angle?: number;
  rotation?: number;
  current?: boolean;
  project: string;
  hours: number;
  millis: number[];
}
