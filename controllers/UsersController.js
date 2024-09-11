import sha1 from 'sha1';
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
}

export default UsersController;