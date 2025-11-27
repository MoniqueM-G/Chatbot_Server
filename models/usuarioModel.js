import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório']
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Email em formato inválido']
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
    },
    bairro: {
        type: String,
        default: ""
    },
    cnpj: {
        type: String,
        default: ""
    },
    telefone: {
        type: String,
        default: ""
    },
    cpf: {
        type: String,
        default: ""
    },
    resetToken: {
        type: String,
        default: ""
    },
    resetTokenExpires: {
        type: Date
    }
}, {
    timestamps: true
});
usuarioSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});
usuarioSchema.methods.matchSenha = async function (senhaDigitada) {
    return await bcrypt.compare(senhaDigitada, this.senha);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;