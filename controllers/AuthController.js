import sha1 from 'sha1';
import { v4 as uuid } from 'uuid';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8').split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const user = await dbClient.db.collection('users').findOne({ email });
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const hashedPassword = sha1(password);
        if (user.password !== hashedPassword) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = uuid();
        const tokenExpiration = 60 * 60 * 24 * 1000;
        await redisClient.set(`auth_${token}`, user._id.toString(), tokenExpiration);
        return res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await redisClient.del(`auth_${token}`);
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
}

export default AuthController;