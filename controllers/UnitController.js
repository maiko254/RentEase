import { query } from 'express';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import { ObjectId } from 'mongodb';

class UnitController {
  static async createUnit(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { propertyId } = req.params;
    const property = await dbClient.db.collection('properties').findOne({ _id: new ObjectId(propertyId) });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {

      const { unit_number, floor, price, bedrooms, bathrooms, available_from } = req.body;

      const similarUnit = await dbClient.db.collection('units').findOne({
        propertyId: new ObjectId(propertyId),
        unit_number,
        floor,
        price: parseInt(price, 10),
        bedrooms,
        bathrooms,
      });
      if (similarUnit) {
        return res.status(409).json({ error: 'A similar unit already exists' });
      }

      const unit = await dbClient.db.collection('units').insertOne({
        propertyId: new ObjectId(propertyId),
        unit_number,
        floor,
        price,
        bedrooms,
        bathrooms,
        available_from,
      });
      return res.status(201).json({ unit });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUnitsByPropertyId(req, res) {
    const { propertyId } = req.params;
    const { price, min_price, max_price, floor, bedrooms, bathrooms, available_from, limit, page } = req.query;

    if (price || min_price || max_price) {
      query.price = {};

      if (price) {
        const priceRange = price.split('-');
        if (priceRange.length === 2) {
          const [minPrice, maxPrice] = priceRange.map(Number);
          if (!isNaN(minPrice)) query.price.$gte = minPrice;
          if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
        } else if (priceRange.length === 1) {
          query.price = Number(price);
        } else {
          return res.status(400).json({ error: 'Invalid price range' });
        }
      }
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }

    if (floor) query.floor = Number(floor);
    if (bedrooms) query.bedrooms = Number(bedrooms);
    if (bathrooms) query.bathrooms = Number(bathrooms);
    if (available_from) query.available_from = available_from;

    const options = {};
    if (limit) options.limit = Number(limit);
    if (page) options.skip = (Number(page) - 1) * Number(limit || 5);

    
    try {
      const property = await dbClient.db.collection('properties').findOne({ _id: new ObjectId(propertyId) });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const units = await dbClient.db.collection('units').find({ propertyId: new ObjectId(propertyId), ...query }, options).toArray();
      return res.status(200).json({ units });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getunitById(req, res) {
    const { unitId } = req.params;
    try {
      const unit = await dbClient.db.collection('units').findOne({ _id: new ObjectId(unitId) });
      if (!unit) {
        return res.status(404).json({ error: 'unit not found' });
      }
      return res.status(200).json({ unit });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateUnit(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { unitId } = req.params;
    const updateFields = {};

    for (const field of ['unit_number', 'floor', 'price', 'bedrooms', 'bathrooms', 'available_from']) {
      if (req.body[field]) {
        updateFields[field] = req.body[field];
      }
    }

    try {
      const unit = await dbClient.db.collection('units').findOne({ _id: new ObjectId(unitId) });
      if (!unit) {
        return res.status(404).json({ error: 'unit not found' });
      }

      const property = await dbClient.db.collection('properties').findOne({ _id: unit.propertyId });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      if (property.ownerId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await dbClient.db.collection('units').updateOne({ _id: new ObjectId(unitId) }, { $set: updateFields });
      return res.status(200).json({ unit: { ...unit, ...updateFields } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }    
  }

  static async deleteUnit(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { unitId } = req.params;
    try {
      const unit = await dbClient.db.collection('units').findOne({ _id: new ObjectId(unitId) });
      if (!unit) {
        return res.status(404).json({ error: 'unit not found' });
      }

      const property = await dbClient.db.collection('properties').findOne({ _id: unit.propertyId });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      if (property.ownerId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await dbClient.db.collection('units').deleteOne({ _id: new ObjectId(unitId) });
      return res.status(200).json({ message: 'unit deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UnitController;
