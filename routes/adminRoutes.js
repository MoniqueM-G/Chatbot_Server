import express from 'express';
import {
    criarAdmin,
    loginAdmin,
    atualizarAdmin,
    buscarAdmin
} from '../controllers/adminController.js';

const router = express.Router();

router.post('/', criarAdmin);

router.get('/:id', buscarAdmin);

router.post('/login', loginAdmin);

router.put('/:id', atualizarAdmin);

export default router;