import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { RunningValues } from 'src/app/models/running-values';
import { LocalSearchService } from 'src/app/services/local-search.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: [LocalSearchService]
})
export class HeaderComponent {
  runningValuesSubscription: Subscription
  runningValues: RunningValues = new RunningValues(0, 0);

  public constructor(localSearchService: LocalSearchService) {
    this.runningValuesSubscription = localSearchService.runningValuesUpdated$.subscribe(this.updateRunningValues);
}
  getIterations(): number {
    return this.runningValues.steps * this.runningValues.p;
  }

  updateRunningValues (runningValues: RunningValues): void {
    this.runningValues = runningValues;
  }

  ngOnDestroy() {
    this.runningValuesSubscription.unsubscribe();
  }
}
