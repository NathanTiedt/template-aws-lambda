
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';

/**
 * abstract sqs handler
 * @class SQSHandler
 */
export abstract class SQSHandler {

  constructor() {}

  /**
   * accepts incoming sqs event
   * processes each incoming record
   * @param {SQSEvent} event - 
   * @param {Context} context - 
   */
  public handleEvent = (event: SQSEvent, context: Context) => {
    event.Records.map( (record: SQSRecord) => {
      this.processRecord(record);
    });
  }

  public abstract processRecord(record: SQSRecord);

}

