
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';

export class SQSHandler {

  constructor() {}

  handleEvent = (event: SQSEvent, context: Context) => {
    event.Records.map( (record: SQSRecord) => {
      
    });
  }

}

