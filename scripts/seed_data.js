import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Connection string from cre.txt (updated with correct password)
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) throw new Error('Defina SUPABASE_DB_URL no ambiente antes de rodar este script.');

async function seed() {
  console.log("🌱 Conectando para semear dados...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Inserir Planos de Locação
    console.log("📦 Verificando planos...");
    const planos = [
        { nome: 'Mensal', dias: 30, preco: 150.00 },
        { nome: 'Quinzenal', dias: 15, preco: 90.00 },
        { nome: 'Semanal', dias: 7, preco: 50.00 }
    ];

    for (const p of planos) {
        const check = await client.query('SELECT id FROM public.planos_locacao WHERE nome_plano = $1', [p.nome]);
        if (check.rows.length === 0) {
            await client.query(
                'INSERT INTO public.planos_locacao (nome_plano, dias_duracao, preco_base, ativo) VALUES ($1, $2, $3, true)',
                [p.nome, p.dias, p.preco]
            );
            console.log(`   + Plano ${p.nome} criado.`);
        }
    }

    // 2. Inserir Poltronas
    console.log("💺 Verificando poltronas...");
    const poltronas = [
        { nome: 'Poltrona Reclinável A', codigo: 'POL-001', status: 'disponivel' },
        { nome: 'Poltrona Reclinável B', codigo: 'POL-002', status: 'em_locacao' },
        { nome: 'Poltrona Reclinável C', codigo: 'POL-003', status: 'manutencao' }
    ];

    for (const p of poltronas) {
        const check = await client.query('SELECT id FROM public.poltronas WHERE codigo_interno = $1', [p.codigo]);
        if (check.rows.length === 0) {
            await client.query(
                'INSERT INTO public.poltronas (nome, codigo_interno, status) VALUES ($1, $2, $3)',
                [p.nome, p.codigo, p.status]
            );
            console.log(`   + Poltrona ${p.codigo} criada.`);
        }
    }

    // 3. Garantir Admin Role (precisa do ID do usuário do Auth)
    const res = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@locacare.com.br'`);
    if (res.rows.length > 0) {
        const userId = res.rows[0].id;
        console.log(`👤 Usuário Admin encontrado (${userId})...`);
        
        // Role
        const checkRole = await client.query('SELECT id FROM public.user_roles WHERE user_id = $1 AND role = $2', [userId, 'admin']);
        if (checkRole.rows.length === 0) {
            await client.query('INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2)', [userId, 'admin']);
            console.log("   + Role 'admin' atribuída.");
        }

        // Profile
        const checkProfile = await client.query('SELECT id FROM public.usuarios WHERE user_id = $1', [userId]);
        if (checkProfile.rows.length === 0) {
            await client.query(
                'INSERT INTO public.usuarios (user_id, nome, email, codigo_indicacao, saldo_indicacoes) VALUES ($1, $2, $3, $4, $5)',
                [userId, 'Administrador', 'admin@locacare.com.br', 'ADMIN', 0.00]
            );
            console.log("   + Perfil 'usuarios' criado.");
        } else {
            // Garantir codigo_indicacao se já existe
            await client.query(
                "UPDATE public.usuarios SET codigo_indicacao = 'ADMIN' WHERE user_id = $1 AND codigo_indicacao IS NULL",
                [userId]
            );
        }
    } else {
        console.log("⚠️ Usuário 'admin@locacare.com.br' não encontrado em auth.users.");
    }

    console.log("✅ Dados iniciais verificados/inseridos com sucesso!");

  } catch (err) {
    console.error("❌ Erro ao semear dados:", err);
  } finally {
    await client.end();
  }
}

seed();
