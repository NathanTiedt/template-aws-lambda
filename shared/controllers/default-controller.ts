'use-strict';

import { Context } from 'aws-lambda';

export abstract class DefaultController {

  public haha: string = 'damn';
  
  constructor () {}

  public abstract handleEvent(event: any, context: Context);
}
