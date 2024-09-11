import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class AppController {
  static getStatus(req, res) {
    res.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    });
  }
}

export default AppController;
