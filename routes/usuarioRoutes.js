import express from 'express';
import {
    criarUsuario,
    loginUsuario,
    atualizarInformacoes,
    alterarSenha,
    buscarUsuario
} from '../controllers/usuarioController.js';

const router = express.Router();

router.post('/', criarUsuario); 

router.post('/login', loginUsuario);

router.get('/:id', buscarUsuario);

router.put('/:id', atualizarInformacoes);

router.put('/alterar-senha/:id', alterarSenha);

export default router;