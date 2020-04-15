import { Component, OnInit, OnDestroy } from '@angular/core';
import { Score } from 'src/app/models/score';
import { RunningValues } from 'src/app/models/running-values';
import { Subscription } from 'rxjs';
import { LocalSearchService } from 'src/app/services/local-search.service';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss'],
  providers: [LocalSearchService]
})
export class ScoreComponent implements OnInit, OnDestroy {
  runningValuesSubscription: Subscription;
  scores: Array<Score>;
  lastWrite: number;
  id: string = "";

  public constructor(localSearchService: LocalSearchService) {
    this.runningValuesSubscription = localSearchService.runningValuesUpdated$.subscribe(this.updateScores);
}

  ngOnInit(): void {
    this.scores = JSON.parse(localStorage.getItem('scores') || '[]') ?? [];
    this.lastWrite = 0;
  }

  updateScores(runningValues: RunningValues): void {
    this.id = runningValues.id;
    if (this.scores.length === 10 && runningValues.topscore >= this.scores[9].score){
      return;
    }

    this.lastWrite > 0 
      ? this.update(runningValues.id, runningValues.topscore)
      : this.add(runningValues.id, runningValues.topscore);

    this.scores.sort((a, b) => a.score - b.score);
    if (Date.now() - this.lastWrite > 10000){
      this.write();
    }
  }

  update(id: string, topscore: number): void {
    var current = this.scores.filter(score => score.id === id);
    current[0].score = topscore;
    current[0].date = Date().toString();
  }

  add(id: string, topscore: number): void {
    if (this.scores.length === 10){
      this.scores.pop();
    }

    this.scores.push(new Score(Date.toString(), id, topscore));  
  }

  write(): void {
    localStorage.setItem('scores', JSON.stringify(this.scores));
    this.lastWrite = Date.now();
  }

  ngOnDestroy(){
    this.runningValuesSubscription.unsubscribe();
  }
}
