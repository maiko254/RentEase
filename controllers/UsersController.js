import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    try {
      const user = await dbClient.db.collection('users').findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const hashedPassword = sha1(password);
      const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;