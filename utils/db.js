import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    this.isConnected = false;

    this.client = new MongoClient(process.env.MONGO_URI);
    this.client.connect().then(() => {
      this.isConnected = true;
      console.log('Connected to the database');
    })
    .catch((err) => {
      this.isConnected = false;
      console.log(`Error connecting to the database: ${err.message}`);
    });
    this.db = this.client.db(process.env.DB_NAME);
  }

  connect() {
    this.client.connect().then(() => {
      this.isConnected = true;
      console.log('Connected to the database');
    })
    .catch((err) => {
      this.isConnected = false;
      console.log(`Error connecting to the database: ${err.message}`);
    });
  }

  isAlive() {
    return this.isConnected;
  }
}

const dbClient = new DBClient();
export default dbClient;
