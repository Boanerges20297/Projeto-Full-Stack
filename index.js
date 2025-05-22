// 1. Importar os módulos Express e Path
const express = require('express');
const path = require('path'); // Precisamos do módulo 'path'
const sqlite3 = require('sqlite3').verbose(); // Importa o sqlite3 com verbose() para mensagens de erro mais detalhadas
const DB_PATH = path.join(__dirname, 'src', 'data', 'agendaEstudos.db'); // Define o caminho do banco de dados

const app = express();

// 2. Definir a porta
const porta = 3050; // Porta onde o servidor irá escutar as requisições
// 3. Configurar o middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos da pasta 'public'
app.use(express.urlencoded({ extended: true })); // O middleware express.urlencoded() é usado para analisar os dados do corpo da solicitação
app.use(express.json()); // O middleware express.json() é usado para analisar os dados do corpo da solicitação, caso sejam enviados em formato JSON

//4. Criar uma instância do banco de dados SQLite
// O método sqlite3.Database() é usado para abrir ou criar um banco de dados SQLite
// O primeiro parâmetro é o caminho do banco de dados e o segundo é uma função de callback que é chamada quando a conexão é estabelecida
// O método verbose() é usado para habilitar mensagens de erro mais detalhadas
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});
// 5. Criar as tabelas iniciais se não existirem
function criarTabelasIniciais() {
    // O método serialize() é usado para garantir que as consultas sejam executadas em ordem
    // O método run() é usado para executar uma instrução SQL que não retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é uma função de callback que é chamada quando a consulta é concluída
    // O método all() é usado para executar uma instrução SQL que retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    // O método each() é usado para executar uma instrução SQL que retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    // O método get() é usado para executar uma instrução SQL que retorna um único resultado
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    db.serialize(() => {
        // Cria a tabela 'usuarios' se não existir
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT UNIQUE,
            senha TEXT
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Tabela "usuarios" criada ou já existe.');
            }
        });
        // Cria a tabela 'materias' se não existir
        db.run(`CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            descricao TEXT,
            professor TEXT,
            data_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Tabela "materias" criada ou já existe.');
            }
        });
    });
}

criarTabelasIniciais(); // Chama a função para criar as tabelas iniciais

// 6. Configurar as rotas
app.get('/', (req, res) => {
    // Enviar o arquivo HTML para o cliente
    res.sendFile(path.join(__dirname, 'public', 'formulario.html')); // Envia o arquivo index.html
    //res.send('Hello World!');
});

// Rota para exibir todos os usuários
app.get('/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuarios';
    // O método all() é usado para executar uma instrução SQL que retorna resultados
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao consultar o banco de dados.');
        }
        // Enviar os dados dos usuários como resposta
        // O método json() é usado para enviar uma resposta JSON
        // O método send() é usado para enviar uma resposta de texto
        res.json(rows);
    });
});

// Rota para exibir o formulário de cadastro de matérias
app.get('/materias', (req, res) => {   
    const sql = 'SELECT * FROM materias';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao consultar o banco de dados.');
        }
        // Enviar os dados das matérias como resposta
        res.json(rows);
    });
});

// Rota para exibir o formulário de cadastro de usuários e cadastrar um novo usuário
app.post('/usuarios-add', (req, res) => {
    // Extrair os dados do formulário
    // Aqui você pode usar req.body para acessar os dados do formulário
    const nome = req.body.nome_usuario;
    const email = req.body.email_usuario;
    const senha = req.body.texto_mensagem;
    // Verifica se os campos obrigatórios estão preenchidos
    // Se algum campo estiver vazio, retorna uma resposta de erro
    if (!nome || !email || !senha) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }
    // Instrução SQL para inserir os dados do formulário no banco de dados
    const sql = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;
    // Executa a consulta SQL para inserir os dados do formulário no banco de dados
    // O método run() é usado para executar uma instrução SQL que não retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    db.run(sql, [nome, email, senha], function (err) {
        // Verifica se houve erro na inserção
        // Se houver erro, exibe a mensagem de erro e retorna uma resposta de erro
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao inserir dados no banco de dados.');
        }
        // Se a inserção for bem-sucedida, exibe uma mensagem de sucesso
        console.log(`Usuário ${nome} adicionado com ID: ${this.lastID}`);
    });

    // Aqui você pode processar os dados do formulário como quiser
    console.log(`Nome: ${nome}, Email: ${email}, Senha: ${senha}`);

    // Enviar uma resposta ao cliente
    res.send('Formulário recebido com sucesso!');
});

// Rota para exibir o formulário de atualização de usuários
app.post('/usuarios-update', (req, res) => {
    // Extrair os dados do formulário
    const id = req.body.id_usuario;
    const nome = req.body.nome_usuario;
    const email = req.body.email_usuario;
    const senha = req.body.texto_mensagem;

    // Verifica se os campos obrigatórios estão preenchidos
    if (!id || !nome || !email || !senha) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    // Instrução SQL para atualizar os dados do usuário no banco de dados
    const sql = `UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?`;
    
    // Executa a consulta SQL para atualizar os dados do usuário no banco de dados
    db.run(sql, [nome, email, senha, id], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao atualizar dados no banco de dados.');
        }
        console.log(`Usuário ${nome} atualizado com ID: ${id}`);
    });

    // Enviar uma resposta ao cliente
    res.send('Formulário atualizado com sucesso!');
});

// 8. Iniciar o servidor e escuta na porta indicada
app.listen(porta, () => {
    // Exibir uma mensagem no console
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
// 1. Importar os módulos Express e Path
const express = require('express');
const path = require('path'); // Precisamos do módulo 'path'
const sqlite3 = require('sqlite3').verbose(); // Importa o sqlite3 com verbose() para mensagens de erro mais detalhadas
const DB_PATH = path.join(__dirname, 'src', 'data', 'agendaEstudos.db'); // Define o caminho do banco de dados

const app = express();

// 2. Definir a porta
const porta = 3050; // Porta onde o servidor irá escutar as requisições
// 3. Configurar o middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos da pasta 'public'
app.use(express.urlencoded({ extended: true })); // O middleware express.urlencoded() é usado para analisar os dados do corpo da solicitação
app.use(express.json()); // O middleware express.json() é usado para analisar os dados do corpo da solicitação, caso sejam enviados em formato JSON

//4. Criar uma instância do banco de dados SQLite
// O método sqlite3.Database() é usado para abrir ou criar um banco de dados SQLite
// O primeiro parâmetro é o caminho do banco de dados e o segundo é uma função de callback que é chamada quando a conexão é estabelecida
// O método verbose() é usado para habilitar mensagens de erro mais detalhadas
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});
// 5. Criar as tabelas iniciais se não existirem
function criarTabelasIniciais() {
    // O método serialize() é usado para garantir que as consultas sejam executadas em ordem
    // O método run() é usado para executar uma instrução SQL que não retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é uma função de callback que é chamada quando a consulta é concluída
    // O método all() é usado para executar uma instrução SQL que retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    // O método each() é usado para executar uma instrução SQL que retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    // O método get() é usado para executar uma instrução SQL que retorna um único resultado
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    db.serialize(() => {
        // Cria a tabela 'usuarios' se não existir
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT UNIQUE,
            senha TEXT
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Tabela "usuarios" criada ou já existe.');
            }
        });
        // Cria a tabela 'materias' se não existir
        db.run(`CREATE TABLE IF NOT EXISTS materias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            descricao TEXT,
            professor TEXT,
            data_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Tabela "materias" criada ou já existe.');
            }
        });
    });
}

criarTabelasIniciais(); // Chama a função para criar as tabelas iniciais

// 6. Configurar as rotas
app.get('/', (req, res) => {
    // Enviar o arquivo HTML para o cliente
    res.sendFile(path.join(__dirname, 'public', 'formulario.html')); // Envia o arquivo index.html
    //res.send('Hello World!');
});

// Rota para exibir todos os usuários
app.get('/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuarios';
    // O método all() é usado para executar uma instrução SQL que retorna resultados
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao consultar o banco de dados.');
        }
        // Enviar os dados dos usuários como resposta
        // O método json() é usado para enviar uma resposta JSON
        // O método send() é usado para enviar uma resposta de texto
        res.json(rows);
    });
});

// Rota para exibir o formulário de cadastro de matérias
app.get('/materias', (req, res) => {   
    const sql = 'SELECT * FROM materias';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao consultar o banco de dados.');
        }
        // Enviar os dados das matérias como resposta
        res.json(rows);
    });
});

// Rota para exibir o formulário de cadastro de usuários e cadastrar um novo usuário
app.post('/usuarios-add', (req, res) => {
    // Extrair os dados do formulário
    // Aqui você pode usar req.body para acessar os dados do formulário
    const nome = req.body.nome_usuario;
    const email = req.body.email_usuario;
    const senha = req.body.texto_mensagem;
    // Verifica se os campos obrigatórios estão preenchidos
    // Se algum campo estiver vazio, retorna uma resposta de erro
    if (!nome || !email || !senha) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }
    // Instrução SQL para inserir os dados do formulário no banco de dados
    const sql = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;
    // Executa a consulta SQL para inserir os dados do formulário no banco de dados
    // O método run() é usado para executar uma instrução SQL que não retorna resultados
    // O primeiro parâmetro é a consulta SQL e o segundo é um array com os valores a serem inseridos, já "err" é o erro caso ocorra
    db.run(sql, [nome, email, senha], function (err) {
        // Verifica se houve erro na inserção
        // Se houver erro, exibe a mensagem de erro e retorna uma resposta de erro
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao inserir dados no banco de dados.');
        }
        // Se a inserção for bem-sucedida, exibe uma mensagem de sucesso
        console.log(`Usuário ${nome} adicionado com ID: ${this.lastID}`);
    });

    // Aqui você pode processar os dados do formulário como quiser
    console.log(`Nome: ${nome}, Email: ${email}, Senha: ${senha}`);

    // Enviar uma resposta ao cliente
    res.send('Formulário recebido com sucesso!');
});

// Rota para exibir o formulário de atualização de usuários
app.post('/usuarios-update', (req, res) => {
    // Extrair os dados do formulário
    const id = req.body.id_usuario;
    const nome = req.body.nome_usuario;
    const email = req.body.email_usuario;
    const senha = req.body.texto_mensagem;

    // Verifica se os campos obrigatórios estão preenchidos
    if (!id || !nome || !email || !senha) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    // Instrução SQL para atualizar os dados do usuário no banco de dados
    const sql = `UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?`;
    
    // Executa a consulta SQL para atualizar os dados do usuário no banco de dados
    db.run(sql, [nome, email, senha, id], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Erro ao atualizar dados no banco de dados.');
        }
        console.log(`Usuário ${nome} atualizado com ID: ${id}`);
    });

    // Enviar uma resposta ao cliente
    res.send('Formulário atualizado com sucesso!');
});

// 8. Iniciar o servidor e escuta na porta indicada
app.listen(porta, () => {
    // Exibir uma mensagem no console
    console.log(`Servidor rodando em http://localhost:${porta}`);
});