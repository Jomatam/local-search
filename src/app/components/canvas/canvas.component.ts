import { Component, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Waypoint } from 'src/app/models/waypoint';
import { LocalSearchService } from 'src/app/services/local-search.service';
import { Constants } from 'src/app/models/constants';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterViewInit {
  waypointSubscription: Subscription;
  waypoints: Waypoint[] = [];

  // Constants
  constants: Constants = new Constants();
  radius: number = 3;
  
  // View
  @ViewChild('canvas') canvasView: ElementRef;
  viewWidth: number;
  viewHeight: number;
  translationWidth: number;
  translationHeight: number;


  constructor(localSearchService: LocalSearchService) {
    this.waypointSubscription = localSearchService.waypointsUpdated$.subscribe(waypoints => {
      this.waypoints = waypoints;
    });
  }

  ngAfterViewInit(): void {
    this.setView();
  }

  @HostListener('window:resize', ['$event'])
  onResize(_: any) {
    this.setView();
  }

  translateX(x: number) {
    return x * this.translationWidth + this.radius;
  }

  translateY(y: number): number {
    return y * this.translationHeight + this.radius;
  }

  setView() {
    this.viewWidth = this.canvasView.nativeElement.offsetWidth;
    this.viewHeight = this.canvasView.nativeElement.offsetHeight;
    this.translationWidth = (this.canvasView.nativeElement.offsetWidth - this.radius * 2) / this.constants.size;
    this.translationHeight = (this.canvasView.nativeElement.offsetHeight - this.radius * 2) / this.constants.size;
  }
}
