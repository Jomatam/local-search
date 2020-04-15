import { v4 as uuid } from 'uuid';

export class RunningValues {
  constructor(
    public t: number,
    public p: number,
    public id: string = uuid(),
    public steps: number = 0,
    public topscore: number = 0,
    public running: boolean = false) { 
  }

  update(topscore: number, a: number){
    this.t *= a;
    this.steps++;
    this.topscore = topscore;
  }
}