import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import usuarioRoutes from './routes/usuarioRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao MongoDB no banco 'ChatBot'!");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
};

connectDB();

app.get("/", (req, res) => {
    res.send("API do ChatBot está no ar!");
});

app.use('/api/usuarios', usuarioRoutes);

app.use('/api/admin', adminRoutes);

app.listen(PORT, () => console.log(`O servidor está rodando na porta http://localhost:${PORT}`));