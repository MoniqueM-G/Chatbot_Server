import express from 'express';
import {
    criarUsuario,
    loginUsuario,
    atualizarInformacoes,
    alterarSenha,
    buscarUsuario,
    recuperarSenha,
    resetarSenha
} from '../controllers/usuarioController.js';

const router = express.Router();

router.post('/', criarUsuario); 

router.post('/login', loginUsuario);

router.get('/:id', buscarUsuario);

router.put('/:id', atualizarInformacoes);

router.put('/alterar-senha/:id', alterarSenha);

router.post("/recuperar", recuperarSenha);

router.post("/resetar", resetarSenha);

export default router;