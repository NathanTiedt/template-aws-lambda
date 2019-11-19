
import BaseController from '../lambda-shared/controllers/base.controller';
import { Context } from 'aws-lambda';
import { Logger } from '../lambda-shared/logger/logger';

export default class Control extends BaseController {
  
  constructor() {
    super();
  }

  public handleEvent = (event: any, context: Context): any => {

  }

}
