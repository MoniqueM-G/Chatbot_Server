import Usuario from '../models/usuarioModel.js';

export const criarUsuario = async (req, res) => {
    try {
        const { nome, email, senha, curso, periodo, telefone } = req.body;

        const usuarioExiste = await Usuario.findOne({ email });
        if (usuarioExiste) {
            return res.status(400).json({ msg: "Usuário com este email já existe." });
        }

        const usuario = await Usuario.create({
            nome,
            email,
            senha,
            curso,
            periodo,
            telefone
        });

        res.status(201).json({
            _id: usuario._id,
            nome: usuario.nome,
            email: usuario.email
        });

    } catch (error)
    {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};

export const loginUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (usuario && (await usuario.matchSenha(senha))) {
            res.json({
                _id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
            });
        } else {
            res.status(401).json({ msg: "Email ou senha inválidos" });
        }
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};

export const atualizarInformacoes = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: "Usuário não encontrado" });
        }
        usuario.nome = req.body.nome || usuario.nome;
        usuario.email = req.body.email || usuario.email;
        usuario.curso = req.body.curso || usuario.curso;
        usuario.periodo = req.body.periodo || usuario.periodo;
        usuario.telefone = req.body.telefone || usuario.telefone;

        const usuarioAtualizado = await usuario.save();

        res.json({
            _id: usuarioAtualizado._id,
            nome: usuarioAtualizado.nome,
            email: usuarioAtualizado.email,
            curso: usuarioAtualizado.curso,
            periodo: usuarioAtualizado.periodo,
            telefone: usuarioAtualizado.telefone,
        });

    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};
export const alterarSenha = async (req, res) => {
    try {
        const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            return res.status(400).json({ msg: "Por favor, preencha todos os campos de senha." });
        }
        
        if (novaSenha !== confirmarNovaSenha) {
            return res.status(400).json({ msg: "Nova senha e confirmação não batem." });
        }

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuário não encontrado" });
        }
        
        const senhaCorreta = await usuario.matchSenha(senhaAtual);
        if (!senhaCorreta) {
            return res.status(401).json({ msg: "Senha atual incorreta." });
        }
        usuario.senha = novaSenha;
        await usuario.save();
        
        res.json({ msg: "Senha atualizada com sucesso!" });

    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};

export const buscarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-senha');

        if (!usuario) {
            return res.status(404).json({ msg: "Usuário não encontrado" });
        }

        res.json(usuario); 

    } catch (error) {
        console.error("Erro ao buscar usuário:", error.message);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ msg: "Usuário não encontrado (ID inválido)" });
        }
        res.status(500).send("Erro no servidor");
    }
    };