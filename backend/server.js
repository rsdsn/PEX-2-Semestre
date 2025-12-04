// backend/server.js
const express = require('express');
const cors = require('cors');
const { db, run, all, get } = require('./db');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicializa o DB com schema se ainda não existir
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) console.error('Erro ao criar tabelas:', err);
    else console.log('Tabelas verificadas/criadas com sucesso.');
  });
});

// Rotas DOADORES
app.post('/doadores', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const result = await run(
      'INSERT INTO doadores (nome, telefone, email) VALUES (?, ?, ?)',
      [nome, telefone || null, email || null]
    );
    const novo = await get('SELECT * FROM doadores WHERE id = ?', [result.id]);
    res.status(201).json(novo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/doadores', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM doadores ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rotas DOAÇÕES
app.post('/doacoes', async (req, res) => {
  try {
    const { doador_id, tipo, descricao, quantidade, valor, data } = req.body;
    if (!tipo || !data) return res.status(400).json({ error: 'Tipo e data são obrigatórios' });

    const result = await run(
      'INSERT INTO doacoes (doador_id, tipo, descricao, quantidade, valor, data) VALUES (?, ?, ?, ?, ?, ?)',
      [doador_id || null, tipo, descricao || null, quantidade || 1, valor || 0.0, data]
    );
    const nova = await get('SELECT * FROM doacoes WHERE id = ?', [result.id]);
    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/doacoes', async (req, res) => {
  try {
    // filtros simples: tipo, data_inicio, data_fim
    let { tipo, data_inicio, data_fim } = req.query;
    let sql = `SELECT d.*, do.nome as nome_doador FROM doacoes d LEFT JOIN doadores do ON d.doador_id = do.id`;
    const params = [];
    const conds = [];

    if (tipo) { conds.push('d.tipo = ?'); params.push(tipo); }
    if (data_inicio) { conds.push('date(d.data) >= date(?)'); params.push(data_inicio); }
    if (data_fim) { conds.push('date(d.data) <= date(?)'); params.push(data_fim); }

    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY d.data DESC';

    const rows = await all(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Endpoint para resumo mensal simples
app.get('/resumo/mensal', async (req, res) => {
  try {
    const { ano, mes } = req.query;
    if (!ano || !mes) return res.status(400).json({ error: 'Parâmetros ano e mes são necessários' });

    const inicio = `${ano}-${String(mes).padStart(2,'0')}-01`;
    // calcular fim (simples: next month)
    const m = parseInt(mes, 10);
    const nextMonth = m === 12 ? `${parseInt(ano)+1}-01-01` : `${ano}-${String(m+1).padStart(2,'0')}-01`;

    // total financeiro
    const financeiro = await get(
      `SELECT SUM(valor) as total_valor FROM doacoes WHERE tipo = 'financeira' AND date(data) >= date(?) AND date(data) < date(?)`,
      [inicio, nextMonth]
    );

    // total material (contagem)
    const material = await get(
      `SELECT SUM(quantidade) as total_itens FROM doacoes WHERE tipo = 'material' AND date(data) >= date(?) AND date(data) < date(?)`,
      [inicio, nextMonth]
    );

    res.json({ total_valor: financeiro.total_valor || 0, total_itens: material.total_itens || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
