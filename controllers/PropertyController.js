import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import { ObjectId } from 'mongodb';

class PropertyController {
  static async createProperty(req, res) {
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
    
    try {
      const { title, description, price, location, propertyType, amenities, availability } = req.body;

      const similarProperty = await dbClient.db.collection('properties').findOne({
        ownerId: new ObjectId(userId),
        title,
        description,
        price,
        'location.city': location.city,
        'location.neighborhood': location.neighborhood,
        'location.address': location.address,
        'propertyType': propertyType
      });
  
      if (similarProperty) {
        return res.status(409).json({ error: 'A similar property already exists' });
      }
      
      const property = await dbClient.db.collection('properties').insertOne({
        ownerId: new ObjectId(userId),
        title,
        description,
        price,
        location: {
          city: location.city,
          neighborhood: location.neighborhood,
          address: location.address,
        },
        propertyType,
        amenities: amenities.split(','),
        availability,
        createdAt: new Date(),
      });
      return res.status(201).json({ property });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createApartment(req, res) {
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

    const { id } = req.params;
    const property = await dbClient.db.collection('properties').findOne({ _id: new ObjectId(id) });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {

      const { unit_number, floor, price, bedrooms, bathrooms, available_from } = req.body;

      const similarApartment = await dbClient.db.collection('apartments').findOne({
        propertyId: new ObjectId(id),
        unit_number,
        floor,
        price,
        bedrooms,
        bathrooms,
      });
      if (similarApartment) {
        return res.status(409).json({ error: 'A similar apartment already exists' });
      }

      const apartment = await dbClient.db.collection('apartments').insertOne({
        propertyId: new ObjectId(id),
        unit_number,
        floor,
        price,
        bedrooms,
        bathrooms,
        available_from,
      });
      return res.status(201).json({ apartment });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getApartments(req, res) {
    const { id } = req.params;
    try {
      const apartments = await dbClient.db.collection('apartments').find({ propertyId: new ObjectId(id) }).toArray();
      return res.status(200).json({ apartments });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProperties(req, res) {
    const { price, min_price, max_price, bedrooms, bathrooms, property_type, city, neighborhood, amenities, limit, page } = req.query;
    const query = {};
    
    if (price || min_price || max_price) {
      query.price = {};

      if (price ) {
        const priceRange = price.split('-');
        if (priceRange.length === 2) {  
          const [minPrice, maxPrice] = priceRange.map(Number);
          if (!isNaN(minPrice)) query.price.$gte = minPrice;
          if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
        } else {
          query.price = Number(price);
        }
      }
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }
    if (bedrooms) query.bedrooms = Number(bedrooms);
    if (bathrooms) query.bathrooms = Number(bathrooms);
    if (property_type) query.propertyType = property_type;
    if (city) query['location.city'] = city;
    if (neighborhood) query['location.neighborhood'] = neighborhood;
    if (amenities) query.amenities = { $in: amenities.split(',') };
    
    const options = {};
    if (limit) options.limit = Number(limit);
    if (page) options.skip = (Number(page) - 1) * (Number(limit) || 10);

    try {
      const properties = await dbClient.db.collection('properties').find(query, options).toArray();
      if (!properties || properties.length === 0) {
        return res.status(404).json({ error: 'Properties not found' });
      }
      return res.status(200).json({ properties });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPropertyById(req, res) {
    const { id } = req.params;
    try {
      const property = await dbClient.db.collection('properties').findOne({ _id: new ObjectId(id) });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      return res.status(200).json({ property });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateProperty(req, res) {
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

    const { id } = req.params;
    const updateFields = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (['title', 'description', 'price', 'location', 'propertyType', 'amenities', 'availability'].includes(key) && value !== undefined) {
        if (key === 'amenities') {
          updateFields[key] = value.split(',');
        } else if (key === 'location') {
          updateFields[key] = {};
          if (value.city) updateFields[key].city = value.city;
          if (value.neighborhood) updateFields[key].neighborhood = value.neighborhood;
          if (value.address) updateFields[key].address = value.address;
        } else {
          updateFields[key] = value;
        }
      }
    }

    updateFields.updatedAt = new Date();

    try {
      const property = await dbClient.db.collection('properties').findOne({ _id: new ObjectId(id) });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      if (property.ownerId.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedProperty = await dbClient.db.collection('properties').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );

      if (updatedProperty.matchedCount === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      return res.status(200).json({ message: 'Property updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' }); 
    }
  }

  static async deleteProperty(req, res) {
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

    const { id } = req.params;
    try {
      const property = await dbClient.db.collection('properties').findOne({ _id: new ObjectId(id) });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      if (property.ownerId.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      await dbClient.db.collection('properties').deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: `Property ${property.title} deleted successfully` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPropertyByOwnerId(req, res) {
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

    const { id } = req.params;
    try {
      const properties = await dbClient.db.collection('properties').find({ ownerId: new ObjectId(id) }).toArray();
      if (!properties || properties.length === 0) {
        return res.status(404).json({ error: 'Properties not found' });
      }
      return res.status(200).json({ properties });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default PropertyController;
