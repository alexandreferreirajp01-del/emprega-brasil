import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

const SALT_ROUNDS = 10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Login Manual
    if (pathname === '/manual_login' || pathname.endsWith('/manual_login')) {
      const { username, password } = await req.json();

      if (!username || !password) {
        return Response.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 });
      }

      // Buscar usuário por username ou email
      const users = await base44.asServiceRole.entities.User.filter({
        $or: [{ username }, { email: username }]
      });

      if (users.length === 0) {
        return Response.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
      }

      const user = users[0];

      // Verificar se tem senha configurada
      if (!user.password_hash || !user.password_salt) {
        return Response.json({ error: 'Usuário não possui senha configurada. Use login com Google.' }, { status: 401 });
      }

      // Validar senha
      const isValid = await bcrypt.compare(password + user.password_salt, user.password_hash);

      if (!isValid) {
        return Response.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
      }

      return Response.json({ success: true, user });
    }

    // Registro Manual
    if (pathname === '/manual_register' || pathname.endsWith('/manual_register')) {
      const { custom_full_name, username, email, password } = await req.json();

      if (!custom_full_name || !username || !email || !password) {
        return Response.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }

      // Verificar se username ou email já existem
      const existingUsers = await base44.asServiceRole.entities.User.filter({
        $or: [{ username }, { email }]
      });

      if (existingUsers.length > 0) {
        if (existingUsers.some(u => u.email === email)) {
          return Response.json({ error: 'E-mail já cadastrado' }, { status: 409 });
        }
        if (existingUsers.some(u => u.username === username)) {
          return Response.json({ error: 'Nome de usuário já existe' }, { status: 409 });
        }
      }

      // Criar hash da senha
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hash = await bcrypt.hash(password + salt, SALT_ROUNDS);

      // Criar usuário
      const newUser = await base44.asServiceRole.entities.User.create({
        email,
        custom_full_name,
        username,
        password_hash: hash,
        password_salt: salt,
        subscription_type: 'basic'
      });

      return Response.json({ success: true, user: newUser });
    }

    // Atualizar Credenciais
    if (pathname === '/update_credentials' || pathname.endsWith('/update_credentials')) {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Não autenticado' }, { status: 401 });
      }

      const { custom_full_name, username, password, phone, city, state, profile_photo } = await req.json();
      const updateData = {};

      // Atualizar custom_full_name
      if (custom_full_name !== undefined && custom_full_name.trim()) {
        updateData.custom_full_name = custom_full_name.trim();
      }

      // Atualizar username
      if (username !== undefined && username.trim() && username !== user.username) {
        const existingUser = await base44.asServiceRole.entities.User.filter({ username: username.trim() });
        if (existingUser.length > 0 && existingUser[0].id !== user.id) {
          return Response.json({ error: 'Nome de usuário já existe' }, { status: 409 });
        }
        updateData.username = username.trim();
      }

      // Atualizar senha
      if (password !== undefined && password.trim()) {
        if (password.length < 6) {
          return Response.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
        }
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(password + salt, SALT_ROUNDS);
        updateData.password_hash = hash;
        updateData.password_salt = salt;
      }

      // Outros campos
      if (phone !== undefined) updateData.phone = phone.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim().toUpperCase();
      if (profile_photo !== undefined) updateData.profile_photo = profile_photo.trim();

      if (Object.keys(updateData).length === 0) {
        return Response.json({ success: true, user });
      }

      // Atualizar via service role
      await base44.asServiceRole.entities.User.update(user.id, updateData);
      
      // Buscar usuário atualizado
      const updatedUser = await base44.auth.me();

      return Response.json({ success: true, user: updatedUser });
    }

    return Response.json({ error: 'Rota não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('Erro na função auth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});