import { Router } from 'express';
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
import PropertyController from '../controllers/PropertyController.js';

const router = Router();

router.get('/status', AppController.getStatus);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/properties', PropertyController.createProperty);
router.get('/properties', PropertyController.getProperties);
router.get('/properties/:id', PropertyController.getPropertyById);
router.put('/properties/:id', PropertyController.updateProperty);
router.delete('/properties/:id', PropertyController.deleteProperty);
router.get('/properties/user/:id', PropertyController.getPropertyByOwnerId);
router.post('/properties/:id/apartments', PropertyController.createApartment);
router.get('/properties/:id/apartments', PropertyController.getApartments);

export default router;