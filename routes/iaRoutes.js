import express from 'express';
import { conversarComIA } from '../controllers/iaController.js';

const router = express.Router();

router.post('/chat', conversarComIA);

export default router;