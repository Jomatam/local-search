import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { LocalSearchService } from './services/local-search.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  runningValuesSubscription: Subscription
  running: boolean;

  constructor(private localSearchService: LocalSearchService) {
    this.runningValuesSubscription = localSearchService.runningValuesUpdated$.subscribe(runningValues => {
      this.running = runningValues.running;
    });      
  }

  ngAfterViewInit(): void {
    this.generateNew();
  }

  ngOnDestroy() {
    this.runningValuesSubscription.unsubscribe();
  }

  generateNew(): void {
    this.localSearchService.generateNew();
  }

  startStop(): void {
    this.running ? this.localSearchService.stop() : this.localSearchService.start();
  } 
}
