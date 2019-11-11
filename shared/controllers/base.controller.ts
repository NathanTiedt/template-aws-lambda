
import { Context } from 'aws-lambda';
import * as log from 'loglevel';
log.setLevel(process.env.LOG_LEVEL as any);

export default abstract class BaseController {
  
  constructor () {
    log.trace(`Starting Controller`);
  }

  public abstract handleEvent(event: any, context: Context): any;

}
