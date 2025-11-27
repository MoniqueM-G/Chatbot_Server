import Usuario from "../models/usuarioModel.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { enviarEmailRecuperacao } from "../service/emailService.js";
export const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, bairro, rua, telefone } = req.body;

    const documentoInput = req.body.cnpj || req.body.cpf || "";
    const docLimpo = documentoInput.replace(/[^\d]/g, "");

    let cpfParaSalvar = "";
    let cnpjParaSalvar = "";

    if (docLimpo.length === 11) {
      cpfParaSalvar = docLimpo;
    } else if (docLimpo.length > 11) {
      cnpjParaSalvar = docLimpo;
    }

    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ msg: "Usuário com este email já existe." });
    }

    const usuario = await Usuario.create({
      nome,
      email,
      senha,
      bairro,
      rua,
      cnpj: cnpjParaSalvar,
      cpf: cpfParaSalvar,
      telefone,
    });

    res.status(201).json({
      _id: usuario._id,
      nome: usuario.nome,
      email: usuario.email,
      rua: usuario.rua,
      bairro: usuario.bairro,
    });
  } catch (error) {
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
    usuario.bairro = req.body.bairro || usuario.bairro;
    usuario.rua = req.body.rua || usuario.rua;
    usuario.telefone = req.body.telefone || usuario.telefone;
    const documentoInput = req.body.cnpj;

    if (documentoInput !== undefined) {
      const docLimpo = documentoInput.replace(/[^\d]/g, "");

      if (docLimpo.length === 11) {
        usuario.cpf = docLimpo;
        usuario.cnpj = "";
      } else if (docLimpo.length > 11) {
        usuario.cnpj = docLimpo;
        usuario.cpf = "";
      } else {
        usuario.cnpj = "";
        usuario.cpf = "";
      }
    }
    const usuarioAtualizado = await usuario.save();

    res.json({
      _id: usuarioAtualizado._id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      bairro: usuarioAtualizado.bairro,
      rua: usuarioAtualizado.rua,
      cnpj: usuarioAtualizado.cnpj,
      telefone: usuarioAtualizado.telefone,
      cpf: usuarioAtualizado.cpf,
    });
  } catch (error) {
    res.status(500).json({ msg: "Erro no servidor", error: error.message });
  }
};

export const alterarSenha = async (req, res) => {
  try {
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      return res
        .status(400)
        .json({ msg: "Por favor, preencha todos os campos de senha." });
    }

    if (novaSenha !== confirmarNovaSenha) {
      return res
        .status(400)
        .json({ msg: "Nova senha e confirmação não batem." });
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

export const recuperarSenha = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email é obrigatório" });
    }

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.json({ message: "Se o e-mail estiver correto, um link de recuperação foi enviado." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    usuario.resetToken = token;
    usuario.resetTokenExpires = Date.now() + 3600000; // 1 hora
    await usuario.save();

    await enviarEmailRecuperacao(email, token);

    res.json({ message: "Link de recuperação enviado para o e-mail!" });

  } catch (error) {
    console.error("ERRO NO RECUPERARSENHA:", error);
    res
      .status(500)
      .json({ msg: "Erro no servidor", error: error.message });
  }
};

export const resetarSenha = async (req, res) => {
  const { token, novaSenha } = req.body;

  const usuario = await Usuario.findOne({
    resetToken: token,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!usuario) {
    return res.status(400).json({ message: "Token inválido ou expirado." });
  }

  usuario.senha = novaSenha;
  usuario.resetToken = undefined;
  usuario.resetTokenExpires = undefined;
  await usuario.save();
  console.log("Senha redefinida para o usuário:", usuario.email);
  res.json({ message: "Senha atualizada!" });
};

export const buscarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-senha");

    if (!usuario) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error.message);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ msg: "Usuário não encontrado (ID inválido)" });
    }
    res.status(500).send("Erro no servidor");
  }
};
