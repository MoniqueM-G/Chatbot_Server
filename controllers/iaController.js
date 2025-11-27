import fs from 'fs';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { Chat, Mensagem } from '../models/ChatModel.js'; 

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

let baseDeConhecimento = [];

const sinonimosFiscais = {
    "remedio": ["medicamento", "farmácia", "hospital", "médico", "saúde"],
    "remédio": ["medicamento", "farmácia", "hospital", "médico", "saúde"],
    "carro": ["veículo", "automóvel", "motor"],
    "moto": ["veículo", "motocicleta"],
    "casa": ["imóvel", "residência", "apartamento", "terreno"],
    "apto": ["imóvel", "apartamento"],
    "aluguel": ["locação", "inquilino"],
    "filho": ["dependente", "alimentando"],
    "esposa": ["cônjuge", "dependente"],
    "marido": ["cônjuge", "dependente"],
    "faculdade": ["instrução", "educação", "ensino"],
    "escola": ["instrução", "educação", "ensino"],
    "mei": ["microempreendedor", "simples nacional", "das"],
    "autonomo": ["trabalho não assalariado", "sem vínculo"],
    "valor": ["limite", "quantia", "montante"]
};

const carregarDocumento = () => {
    try {
        console.log("📄 Lendo documento.txt...");
        const caminhoArquivo = path.resolve('documento.txt');
        
        if (fs.existsSync(caminhoArquivo)) {
            const rawData = fs.readFileSync(caminhoArquivo, 'utf-8');
            let blocosBrutos = rawData.split(/\n(?=\d{1,4}\s*[-—])/);

            baseDeConhecimento = blocosBrutos.filter(bloco => {
                if (bloco.includes(".....")) return false;
                if (bloco.length < 50) return false;       
                return true;
            });
            
            console.log(`Base carregada com ${baseDeConhecimento.length} tópicos!`);
        } else {
            console.error("Arquivo documento.txt não encontrado.");
        }
    } catch (error) {
        console.error("Erro ao processar arquivo:", error.message);
    }
};

carregarDocumento();

function buscarMelhoresBlocos(perguntaUsuario) {
    if (!baseDeConhecimento || baseDeConhecimento.length === 0) return "";
    let termos = perguntaUsuario.toLowerCase()
        .replace(/[.,?!]/g, "")
        .split(" ")
        .filter(t => t.length > 2);
    let termosExpandidos = [...termos];
    termos.forEach(termo => {
        if (sinonimosFiscais[termo]) {
            termosExpandidos.push(...sinonimosFiscais[termo]);
        }
    });

    const resultados = baseDeConhecimento.map(bloco => {

        let pontos = 0;
        const textoBaixo = bloco.toLowerCase();

        termosExpandidos.forEach(termo => {
            if (textoBaixo.includes(termo)) {
                pontos += 10;
                if (textoBaixo.indexOf(termo) < 150) {
                    pontos += 20;
                }
            }
        });
        return { bloco, pontos };

    });

    const melhores = resultados
        .filter(r => r.pontos > 0)
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, 20);

    return melhores.map(r => r.bloco).join("\n\n---\n\n");

}



export const conversarComIA = async (req, res) => {
    const { pergunta, usuarioId, chatId } = req.body;

    if (!pergunta) return res.status(400).json({ erro: "Pergunta vazia." });
    if (!usuarioId) return res.status(400).json({ erro: "ID do usuário obrigatório." });

    try {
        let chatAtualId = chatId;
        if (!chatAtualId) {
            const tituloChat = pergunta.substring(0, 30) + "..."; 
            const novoChat = await Chat.create({
                usuarioId: usuarioId,
                titulo: tituloChat
            });
            chatAtualId = novoChat._id;
        }
        await Mensagem.create({
            chatId: chatAtualId,
            remetente: 'usuario',
            conteudo: pergunta
        });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });
        
        let contexto = buscarMelhoresBlocos(pergunta);
        if (!contexto) contexto = baseDeConhecimento.slice(0, 5).join("\n");

        const prompt = `
        Você é um Consultor Especialista do NAF.
        Use os trechos do manual oficial abaixo para responder.
        
        --- MANUAL OFICIAL (TRECHOS RELEVANTES) ---
        ${contexto}
        -------------------------------------------

        PERGUNTA DO CIDADÃO: "${pergunta}"

        INSTRUÇÕES:
         1. Procure a resposta exata nos trechos acima.
        2. Se encontrar, cite a pergunta, não precisa do número.
        3. Se a pergunta for sobre um termo informal (ex: "remédio"), entenda que o manual usa o termo técnico (ex: "medicamento").
        4. Ao final de cada pergunta respondida com exito, pergunte se o cidadao deseja continuar o atendimento, se ele tem mais perguntas e se as duvidas foram resolvidas.
        5. Se as duvidas ainda não foram resolvidas, pergunte se o cidadao quer entrar agendar um atendimento com o NAF, se ele responder "sim", direcione o telefone do NAF, o telefone pode ser ficticio, ex: 0000-0000.
        6. Seja simpático e use emojis. 😊
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textoResposta = response.text();
        await Mensagem.create({
            chatId: chatAtualId,
            remetente: 'ia',
            conteudo: textoResposta
        });
        res.json({ 
            resposta: textoResposta,
            chatId: chatAtualId 
        });

    } catch (error) {
        console.error("Erro Gemini:", error);
        if (error.message && error.message.includes("429")) {
            return res.status(429).json({ resposta: "Muita gente acessando! Tente daqui a pouco. ⏳" });
        }
        res.status(500).json({ resposta: "Erro no servidor." });
    }
};
export const buscarHistorico = async (req, res) => {
    const { chatId } = req.params;
    try {
        const mensagens = await Mensagem.find({ chatId }).sort({ dataEnvio: 1 });
        res.json(mensagens);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
};