'use-strict';

import { Context } from 'aws-lambda';

export abstract class DefaultController {
  
  constructor () {}

  public abstract handleEvent(event: any, context: Context);
}
