
import pg from 'pg';
const { Client } = pg;

// Usando senha válida do banco (Pooler)
const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:WnVqgwTZEsSJc7Yv@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const CLIENTES = [
  { nome: 'Maria Silva', cidade: 'São Paulo', wpp: '11999991111' },
  { nome: 'João Santos', cidade: 'Campinas', wpp: '19988882222' },
  { nome: 'Ana Costa', cidade: 'São Paulo', wpp: '11977773333' },
  { nome: 'Pedro Oliveira', cidade: 'Osasco', wpp: '11966664444' },
  { nome: 'Lucia Lima', cidade: 'Guarulhos', wpp: '11955555555' }
];

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000
  });

  try {
    await client.connect();
    console.log("🌱 Iniciando Seed de Dados...");

    // 1. Inserir Clientes
    const clienteIds = [];
    for (const c of CLIENTES) {
      const res = await client.query(`
        INSERT INTO clientes (nome_completo, cidade, telefone_whatsapp, email)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [c.nome, c.cidade, c.wpp, `teste_${Math.floor(Math.random()*1000)}@teste.com`]);
      clienteIds.push(res.rows[0].id);
    }
    console.log(`✅ ${clienteIds.length} clientes inseridos.`);

    // 2. Buscar Planos e Poltronas existentes
    const planosRes = await client.query("SELECT id, preco_base FROM planos_locacao LIMIT 2");
    const poltronasRes = await client.query("SELECT id FROM poltronas LIMIT 2");
    
    if (planosRes.rows.length === 0 || poltronasRes.rows.length === 0) {
        console.warn("⚠️ Sem planos ou poltronas para vincular. Pule a etapa de locações.");
        return;
    }

    const planoId = planosRes.rows[0].id;
    const preco = planosRes.rows[0].preco_base;
    const poltronaId = poltronasRes.rows[0].id;

    // 3. Buscar Código de Indicação do Admin (para simular uso)
    const adminRes = await client.query("SELECT codigo_indicacao FROM usuarios WHERE email = 'admin@locacare.com.br'");
    const adminCode = adminRes.rows[0]?.codigo_indicacao || 'ADMIN';

    // 4. Inserir Locações
    // Status variados para testar dashboard
    const locacoes = [
      { status: 'confirmada', code: adminCode, dias: -5 }, // Já começou
      { status: 'em_uso', code: adminCode, dias: -2 },     // Em uso
      { status: 'aguardando_pagamento', code: adminCode, dias: 0 }, // Pendente
      { status: 'lead', code: null, dias: 0 },             // Lead sem código
      { status: 'cancelada', code: adminCode, dias: -1 }   // Cancelada
    ];

    for (let i = 0; i < locacoes.length; i++) {
        const l = locacoes[i];
        const clienteId = clienteIds[i % clienteIds.length];
        
        await client.query(`
            INSERT INTO locacoes (
                cliente_id, plano_locacao_id, poltrona_id, 
                status_locacao, codigo_indicacao_usado, valor_total,
                origem_lead, criado_em
            ) VALUES ($1, $2, $3, $4, $5, $6, 'whatsapp', NOW() + interval '${l.dias} days')
        `, [clienteId, planoId, poltronaId, l.status, l.code, preco]);
    }

    console.log(`✅ ${locacoes.length} locações inseridas.`);
    console.log("🎉 Seed concluído com sucesso!");

  } catch (err) {
    console.error("❌ Erro no seed:", err);
  } finally {
    await client.end();
  }
}

seed();
