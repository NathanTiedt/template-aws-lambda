
import Control from './controller';

export default class Handler {

  private control: Control;

  constructor(control?: Control) {
    this.control = control || new Control();
  }

  public handleEvent() {

  }
}

