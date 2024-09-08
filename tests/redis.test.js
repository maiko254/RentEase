import { expect } from 'chai';
import redisClient from '../utils/redis.js';

describe('RedisClient', () => {
  before(async function () {
    this.timeout(5000);
    await redisClient.connect();
  });

  after(async function () {
    this.timeout(5000);
    await redisClient.disconnect();
  });

  it('should connect to Redis', async () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should get a value from Redis', async () => {
    const value = await redisClient.get('key');
    expect(value).to.be.null;
  });

  it('should set a value in Redis', async () => {
    await redisClient.set('key', 'value', 10);
    const value = await redisClient.get('key');
    expect(value).to.equal('value');
  });

  it('should delete a value from Redis', async () => {
    await redisClient.set('key', 'value', 10);
    await redisClient.del('key');
    const value = await redisClient.get('key');
    expect(value).to.be.null;
  });
});
