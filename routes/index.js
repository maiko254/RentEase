import { Router } from 'express';
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';

const router = Router();

router.get('/status', AppController.getStatus);
router.post('/users', UsersController.postNew);

export default router;