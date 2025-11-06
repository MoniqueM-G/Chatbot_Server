import Admin from '../models/adminModel.js';

export const criarAdmin = async (req, res) => {
    try {
        const { nome, email, senha, telefone, local, horarioAtendimento } = req.body;

        const adminExiste = await Admin.findOne({ email });
        if (adminExiste) {
            return res.status(400).json({ msg: "Admin com este email já existe." });
        }

        const admin = await Admin.create({
            nome,
            email,
            senha,
            telefone,
            local,
            horarioAtendimento
        });

        res.status(201).json({
            _id: admin._id,
            nome: admin.nome,
            email: admin.email,
        });

    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};
export const loginAdmin = async (req, res) => {
    try {
        const { email, senha } = req.body;
        const admin = await Admin.findOne({ email });

        if (admin && (await admin.matchSenha(senha))) {
            res.json({
                _id: admin._id,
                nome: admin.nome,
                email: admin.email
            });
        } else {
            res.status(401).json({ msg: "Email ou senha de admin inválidos" });
        }

    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};
export const atualizarAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({ msg: "Admin não encontrado" });
        }
        admin.nome = req.body.nome || admin.nome;
        admin.email = req.body.email || admin.email;
        admin.telefone = req.body.telefone !== undefined ? req.body.telefone : admin.telefone;
        admin.local = req.body.local !== undefined ? req.body.local : admin.local;
        admin.horarioAtendimento = req.body.horarioAtendimento !== undefined ? req.body.horarioAtendimento : admin.horarioAtendimento;

        if (req.body.senha) {
            admin.senha = req.body.senha;
        }

        const adminAtualizado = await admin.save();

        res.json({
            _id: adminAtualizado._id,
            nome: adminAtualizado.nome,
            email: adminAtualizado.email,
            telefone: adminAtualizado.telefone,
            local: adminAtualizado.local,
            horarioAtendimento: adminAtualizado.horarioAtendimento,
        });

    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor", error: error.message });
    }
};

export const buscarAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-senha');

        if (!admin) {
            return res.status(404).json({ msg: "Admin não encontrado" });
        }
        res.json(admin); 

    } catch (error) {
        console.error("Erro ao buscar admin:", error.message);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ msg: "Admin não encontrado (ID inválido)" });
        }
        res.status(500).send("Erro no servidor");
    }
};