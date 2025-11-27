import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const perguntar = () => {
    rl.question('👤 Você: ', async (pergunta) => {
        if (pergunta.toLowerCase() === 'sair') {
            console.log('Encerrando chat...');
            rl.close();
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/ia/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pergunta: pergunta })
            });

            const data = await response.json();

            console.log('\n🤖 Bot: ' + (data.resposta || "Erro: Sem resposta da API"));
            console.log('------------------------------------------');

        } catch (error) {
            console.log('\n Erro: Não foi possível conectar ao servidor.');
            console.log('Dica: Verifique se o "node server.js" está rodando em outra janela.\n');
        }

        perguntar();
    });
};

perguntar();
