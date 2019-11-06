
import Handler from './handler';

const lambda: Handler = new Handler();

export const handler: any = lambda.handleEvent;
