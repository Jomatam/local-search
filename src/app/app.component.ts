import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvasView: ElementRef;

  // Scores
  score: number;
  scores: Array<{
    date: string,
    id: string, 
    score: number}>;
  topscore: number;
  lastWrite: number;
  id: string;

  // Operational
  running: boolean = false;
  t: number;
  steps: number;
  dots = Array<{
    x: number,
    y: number,
    prev: number,
    next: number
  }>();

  // Constants
  size: number = 1000;
  amount: number = 1000;
  radius: number = 3;
  margin: number = 30;
  delay: number = 0;
  a: number = 0.999;
  p: number = 10000;

  // Canvas
  canvasWidth: number;
  canvasHeight: number;

  maxfails: number = this.p * this.amount;
  startT: number = this.size;

  ngOnInit(): void {
    this.scores = JSON.parse(localStorage.getItem('scores') || '[]');
    if (this.scores == null){
      this.scores = [];
    }
  }
  
  ngAfterViewInit(): void {
    this.setView();
    this.generateNew();
  }

  calculate() {
    this.score = 0;
    [...Array(this.amount).keys()].forEach(index => {
      this.score += this.distanceToNext(index);
    });
    this.topscore = this.score;
  }

  generateNew() {
    this.running = false;
    this.dots.length = 0;
    this.id = uuid();
    this.lastWrite = -1;
    this.steps = 0;
    this.dots = [];
    [...Array(this.amount).keys()].forEach(index =>
      this.dots.push({
        x: this.randomInt(1000),
        y: this.randomInt(1000),
        prev: (index - 1 + this.amount) % this.amount,
        next: (index + 1) % this.amount
      })
    );
    this.t = this.startT;
    this.calculate();
  }

  async run(): Promise<void> {
    this.running = true;
    while (this.running) {
      await this.wait();
      await this.step();
    }
  }

  async startStop() {
    this.running = !this.running;
    if (this.running) {
      this.run();
    }
  }

  async step(): Promise<void> {
    var tries = 0;
    while (tries++ < this.p) {
      await this.reinsert();
    }
    this.t *= this.a;
    this.steps++;
    this.writeScore();
  }

  async reinsert(): Promise<void> {
    var fromIndex = this.randomInt(this.amount);
    var fromNext = this.dots[fromIndex].next;
    var fromPrev = this.dots[fromIndex].prev;

    var toAfterIndex = this.randomInt(this.amount);
    var toAfterNext = this.dots[toAfterIndex].next;

    if (fromIndex === toAfterIndex
      || fromIndex === toAfterNext) {
      return;
    }

    var oldDistance = this.distance(fromPrev, fromIndex)
      + this.distanceToNext(fromIndex)
      + this.distanceToNext(toAfterIndex);

    var newDistance = this.distance(fromPrev, fromNext)
      + this.distance(toAfterIndex, fromIndex)
      + this.distance(fromIndex, toAfterNext);

    if (this.accept(newDistance, oldDistance)) {
      this.updateScore(newDistance - oldDistance);

      this.dots[fromPrev].next = fromNext;
      this.dots[fromNext].prev = fromPrev;
      this.dots[fromIndex].prev = toAfterIndex;
      this.dots[fromIndex].next = toAfterNext;
      this.dots[toAfterIndex].next = fromIndex;
      this.dots[toAfterNext].prev = fromIndex;
    }
  }

  distanceToNext(index: number): number {
    var dot = this.dots[index]
    return this.distance(index, dot.next);
  }

  distance(fromIndex: number, toIndex: number): number {
    var from = this.dots[fromIndex];
    var to = this.dots[toIndex];
    var dxSquared = Math.pow(from.x - to.x, 2);
    var dySquared = Math.pow(from.y - to.y, 2);
    return Math.sqrt(dxSquared + dySquared);
  }

  accept(newValue: number, oldValue: number): boolean {
    return newValue <= oldValue || Math.random() < Math.exp((oldValue - newValue) / this.t);
  }

  async wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.delay);
    });
  }

  randomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  assertCorrectness(): void {
    if (!(this.dots.map(d => d.next).filter((v, i, a) => a.indexOf(v) === i).length === this.amount
      && this.dots.map(d => d.prev).filter((v, i, a) => a.indexOf(v) === i).length === this.amount
      && this.dots.map(d => d.next).filter(v => v < 0).length === 0
      && this.dots.map(d => d.next).filter(v => v >= this.amount).length === 0
      && this.dots.map(d => d.prev).filter(v => v < 0).length === 0
      && this.dots.map(d => d.prev).filter(v => v >= this.amount).length === 0)) {
      this.running = false;
    };
  }

  translateX(x: number) {
    return x * this.canvasWidth / this.size + this.radius;
  }

  translateY(y: number): number {
    return y * this.canvasHeight / this.size + this.radius;
  }

  setView() {
    this.canvasWidth = this.canvasView.nativeElement.offsetWidth - this.radius * 2;
    this.canvasHeight = this.canvasView.nativeElement.offsetHeight - this.radius * 2;
  }

  updateScore(toAdd: number){
    this.score += toAdd;
    if (this.score < this.topscore){
      this.topscore = this.score;
    }
  }

  writeScore(): void {
    if (this.scores.length === 10 && this.topscore >= this.scores[9].score){
      return;
    }

    if (this.lastWrite > 0){
      var maybeCurrent = this.scores.filter(score => score.id === this.id);
      maybeCurrent[0].score = this.topscore;
      maybeCurrent[0].date = Date().toString();
    }
    else {
      if (this.scores.length === 10){
        this.scores.pop();
      }

      this.scores.push({
        date: Date().toString(),
        id: this.id,
        score: this.topscore
      });
    }
    
    this.scores.sort((a, b) => a.score - b.score);
    if (Date.now() - this.lastWrite > 10000){
      localStorage.setItem('scores', JSON.stringify(this.scores));
      this.lastWrite = Date.now();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(_: any) {
    this.setView();
  }

  getScores(): void {
    this.scores = JSON.parse(localStorage.getItem('scores') || '[]');
  }

  getIterations(): number {
    return this.steps * this.p;
  }
}
