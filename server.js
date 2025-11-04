import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config()


const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Conectado ao MongoDB");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
    }
    
}

connectDB();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => console.log(`O servidot está rodando na porta http://localhost:${PORT}`));