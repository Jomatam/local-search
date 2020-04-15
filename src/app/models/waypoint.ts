import { RandomService } from '../services/random.service';

export class Waypoint {
  constructor(amount: number, index: number) {
    this.x = RandomService.randomInt(amount);
    this.y = RandomService.randomInt(amount);
    this.prev = (index - 1 + amount) % amount;
    this.next = (index + 1) % amount;  
  }

  x: number;
  y: number;
  prev: number;
  next: number;
}