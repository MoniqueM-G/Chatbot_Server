import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    usuarioId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario',
        required: true 
    },
    titulo: { type: String, default: 'Nova Conversa' },
    dataCriacao: { type: Date, default: Date.now }
});
const MensagemSchema = new mongoose.Schema({
    chatId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Chat', 
        required: true 
    },
    remetente: { 
        type: String, 
        enum: ['usuario', 'ia'],
        required: true 
    },
    conteudo: { type: String, required: true },
    dataEnvio: { type: Date, default: Date.now }
});

export const Chat = mongoose.model('Chat', ChatSchema);
export const Mensagem = mongoose.model('Mensagem', MensagemSchema);