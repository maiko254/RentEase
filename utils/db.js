import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    /**const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}`;*/
    this.isConnected = false;

    this.client = new MongoClient(process.env.MONGO_URI);
    this.client.connect();
    this.db = this.client.db(process.env.DB_NAME);

    this.client.on('connect', () => {
      this.isConnected = true;
    });
    this.client.on('error', (err) => {
      console.error(err);
      this.isConnected = false;
    });
  }

  async connect() {
    await this.client.connect();
  }

  isAlive() {
    return this.isConnected;
  }
}

const dbClient = new DBClient();
export default dbClient;
