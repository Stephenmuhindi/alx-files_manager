import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      response.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      response.status(400).json({ error: 'Missing password' });
      return;
    }

    try {
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ email });
      if (user) {
        response.status(400).json({ error: 'Email address already in use' });
      } else {
        const hashedPassword = sha1(password);
        const result = await users.insertOne({
          email,
          password: hashedPassword,
        });
        response.status(201).json({ id: result.insertedId, email });
        userQueue.add({ userId: result.insertedId });
      }
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      try {
        const users = dbClient.db.collection('users');
        const idObject = new ObjectID(userId);
        const user = await users.findOne({ _id: idObject });
        if (user) {
          response.status(200).json({ id: userId, email: user.email });
        } else {
          response.status(401).json({ error: 'Unauthorized' });
        }
      } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal server error' });
      }
    } else {
      console.log('Hupatikani!');
      response.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async checkEmail(request, response) {
    const { email } = request.query;

    if (!email) {
      response.status(400).json({ error: 'Missing email' });
      return;
    }

    try {
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ email });
      response.status(200).json({ isUnique: !user });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
