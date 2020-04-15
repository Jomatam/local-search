import { Injectable } from '@angular/core';
import { Waypoint } from '../models/waypoint';
import { RunningValues } from '../models/running-values';
import { Subject, Observable } from 'rxjs';
import { RandomService } from './random.service';
import { Constants } from '../models/constants';

@Injectable({
  providedIn: 'root'
})
export class LocalSearchService {
  // Constants
  constants: Constants = new Constants();

  // Values
  runningValues: RunningValues;
  dots: Waypoint[]; 
  score: number;
  topscore: number;

  // Subjects
  private waypointSubject: Subject<Waypoint[]> = new Subject<Waypoint[]>();
  private runningValuesSubject: Subject<RunningValues> = new Subject<RunningValues>();

  // Observables
  waypointsUpdated$: Observable<Waypoint[]> = this.waypointSubject.asObservable();
  runningValuesUpdated$: Observable<RunningValues> = this.runningValuesSubject.asObservable();

  generateNew() {
    this.dots = [];
    this.runningValues = new RunningValues(this.constants.t, this.constants.p);
    [...Array(this.constants.amount).keys()].forEach(index =>
      this.dots.push(new Waypoint(this.constants.amount, index)));
      this.calculate();
      this.emitRunningValues();
      this.emitWaypoints();
  }

  async start(): Promise<void> {
    this.runningValues.running = true;
    while (this.runningValues.running) {
      await this.wait();
      await this.step();
    }
  }

  async stop(): Promise<void> {
    this.runningValues.running = false;
    this.runningValues.update(this.topscore, 1);
    this.emitRunningValues();
    this.emitWaypoints();
  }

  private calculate() {
    this.score = 0;
    [...Array(this.constants.amount).keys()].forEach(index => {
      this.score += this.distanceToNext(index);
    });
    this.runningValues.topscore = this.topscore = this.score;
  }

  private distanceToNext(index: number): number {
    var dot = this.dots[index]
    return this.distance(index, dot.next);
  }

  private distance(fromIndex: number, toIndex: number): number {
    var from = this.dots[fromIndex];
    var to = this.dots[toIndex];
    var dxSquared = Math.pow(from.x - to.x, 2);
    var dySquared = Math.pow(from.y - to.y, 2);
    return Math.sqrt(dxSquared + dySquared);
  }

  private accept(newValue: number, oldValue: number): boolean {
    return newValue <= oldValue || Math.random() < Math.exp((oldValue - newValue) / this.runningValues.t);
  }

  private async wait(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.constants.delay);
    });
  }

  private async step(): Promise<void> {
    var tries = 0;
    while (tries++ < this.constants.p) {
      await this.iterate();
    }
    this.runningValues.update(this.topscore, this.constants.a);
    this.emitRunningValues();
    this.emitWaypoints();
  }

  private async iterate(): Promise<void> {
    var fromIndex = RandomService.randomInt(this.constants.amount);
    var fromNext = this.dots[fromIndex].next;
    var fromPrev = this.dots[fromIndex].prev;

    var toAfterIndex = RandomService.randomInt(this.constants.amount);
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

  private updateScore(toAdd: number){
    this.score += toAdd;
    if (this.score < this.topscore){
      this.topscore = this.score;
    }
  }

  private emitRunningValues(){
    this.runningValuesSubject.next(this.runningValues);
  }

  private emitWaypoints(){
    this.waypointSubject.next(this.dots);
  }
}
