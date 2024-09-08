import { expect } from 'chai';
import mongoose from 'mongoose';
import connectDB from '../utils/db.js';
import sinon from 'sinon';

describe('Database Connection', () => {
  it('should connect to the database', async () => {
    await connectDB();
    expect(mongoose.connection.readyState).to.equal(1);
  });
  it('should handle connection errors', async () => {
    sinon.stub(mongoose, 'connect').rejects(new Error('Connection failed'));
    await expect(connectDB()).to.be.rejectedWith('Connection failed');
    sinon.restore();
  });
});