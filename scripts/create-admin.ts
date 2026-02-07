// Configuração
const supabaseUrl = 'https://wwltjlnlutnuypmkwbuy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bHRqbG5sdXRudXlwbWt3YnV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MTY1MywiZXhwIjoyMDg2MDQ3NjUzfQ.TVTgsAB6h39mqRzXpXsCj9T-UqBXqQdNFjiJqfTJzY0';

const email = 'admin@locacare.com.br';
const password = 'LocaCareAdmin2024!'; // Senha inicial

async function createAdmin() {
  console.log(`Tentando criar usuário admin: ${email}...`);

  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  };

  let userId: string | null = null;

  // 1. Listar usuários para ver se já existe (usando endpoint de admin do GoTrue)
  try {
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers
    });
    
    if (!listRes.ok) {
        const err = await listRes.text();
        console.error('Erro ao listar usuários:', err);
        return;
    }

    const listData = await listRes.json();
    const existingUser = listData.users?.find((u: any) => u.email === email);

    if (existingUser) {
      console.log('Usuário já existe. ID:', existingUser.id);
      userId = existingUser.id;
      // Atualizar senha
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password })
      });
      if (!updateRes.ok) console.error('Erro ao atualizar senha:', await updateRes.text());
      else console.log('Senha atualizada com sucesso.');
      
    } else {
      // Criar novo usuário
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          password,
          email_confirm: true
        })
      });

      if (!createRes.ok) {
        console.error('Erro ao criar usuário:', await createRes.text());
        return;
      }

      const createData = await createRes.json();
      userId = createData.id || createData.user?.id;
      console.log(`Usuário criado com ID: ${userId}`);
    }
  } catch (e) {
    console.error('Exceção ao gerenciar Auth:', e);
    return;
  }

  if (!userId) return;

  // 2. Garantir perfil em 'usuarios'
  try {
    // Check if profile exists
    const checkProfileRes = await fetch(`${supabaseUrl}/rest/v1/usuarios?user_id=eq.${userId}&select=*`, {
        method: 'GET',
        headers
    });
    
    const profiles = await checkProfileRes.json();
    
    if (profiles.length === 0) {
        console.log('Criando perfil na tabela usuarios...');
        const createProfileRes = await fetch(`${supabaseUrl}/rest/v1/usuarios`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                user_id: userId,
                email: email,
                nome: 'Administrador'
            })
        });
        
        if (!createProfileRes.ok) console.error('Erro ao criar perfil:', await createProfileRes.text());
        else console.log('Perfil criado.');
    } else {
        console.log('Perfil já existe.');
    }
  } catch (e) {
    console.error('Erro ao gerenciar perfil:', e);
  }

  // 3. Garantir role 'admin'
  try {
    const checkRoleRes = await fetch(`${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=*`, {
        method: 'GET',
        headers
    });
    
    const roles = await checkRoleRes.json();

    if (roles.length === 0) {
        console.log('Atribuindo role admin...');
        const createRoleRes = await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                user_id: userId,
                role: 'admin'
            })
        });

        if (!createRoleRes.ok) console.error('Erro ao atribuir role:', await createRoleRes.text());
        else console.log('Role de admin atribuída.');
    } else {
        console.log('Usuário já possui role admin.');
    }
  } catch (e) {
    console.error('Erro ao gerenciar role:', e);
  }

  console.log('------------------------------------------------');
  console.log('PROCESSO CONCLUÍDO');
  console.log(`Login: ${email}`);
  console.log(`Senha: ${password}`);
  console.log('------------------------------------------------');
}

createAdmin();
