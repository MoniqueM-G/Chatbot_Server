import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Email em formato inválido']
    },
    senha: {
        type: String,
        required: true,
        minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
    },
    telefone: {
        type: String,
        default: ""
    },
    local: {
        type: String,
        default: ""
    },
    horarioAtendimento: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

adminSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});
adminSchema.methods.matchSenha = async function (senhaDigitada) {
    return await bcrypt.compare(senhaDigitada, this.senha);
};

const Admin = mongoose.model('Admin', adminSchema, 'admin');

export default Admin;