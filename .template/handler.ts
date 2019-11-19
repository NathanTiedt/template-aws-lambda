
import Control from './controller';
import { Logger } from '../lambda-shared/logger/logger';

export default class Handler {

  private control: Control;
  private log: Logger;

  constructor(control?: Control) {
    this.control = control || new Control();
    this.log = new Logger('TemplateHandler');
  }

  public handleEvent() {

  }
}

