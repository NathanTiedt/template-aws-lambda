
import { Client } from 'pg';

export default class BaseDao {

  client: Client;

  construtor(client?: Client) {
    this.client = client || new Client();
  }

  public query = (query: string, keepOpen: boolean) => {

  }

}
