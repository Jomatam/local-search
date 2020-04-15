export class RandomService {
  static randomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }
}