-- backend/schema.sql

CREATE TABLE IF NOT EXISTS doadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS doacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doador_id INTEGER,
  tipo TEXT NOT NULL, -- 'financeira' ou 'material'
  descricao TEXT,
  quantidade INTEGER DEFAULT 1,
  valor REAL DEFAULT 0.0,
  data TEXT NOT NULL,
  FOREIGN KEY (doador_id) REFERENCES doadores(id)
);
