import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const method = req.method;

    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                    user.role === 'admin' || 
                    user.subscription_type === 'admin';

    // GET - Buscar filtros
    if (method === 'GET') {
      const filters = await base44.entities.FilterMaster.filter({ is_active: true }, 'order', 1000);
      
      const grouped = {
        categories: [],
        jobFunctions: [],
        jobTypes: [],
        cities: [],
        workModels: [],
        seniority: []
      };

      filters.forEach(f => {
        const key = f.type === 'category' ? 'categories' :
                    f.type === 'jobFunction' ? 'jobFunctions' :
                    f.type === 'jobType' ? 'jobTypes' :
                    f.type === 'city' ? 'cities' :
                    f.type === 'workModel' ? 'workModels' : 'seniority';
        grouped[key].push(f.value);
      });

      return Response.json({ success: true, filters: grouped, timestamp: Date.now() });
    }

    // Operações de escrita requerem admin
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // POST - Criar filtro
    if (method === 'POST') {
      const { type, value } = await req.json();
      
      if (!type || !value) {
        return Response.json({ error: 'Missing type or value' }, { status: 400 });
      }

      // Verificar duplicata
      const existing = await base44.entities.FilterMaster.filter({ type, value });
      if (existing.length > 0) {
        return Response.json({ error: 'Filter already exists' }, { status: 409 });
      }

      const slug = value.toLowerCase().replace(/\s+/g, '-');
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type,
        value,
        slug,
        is_active: true,
        order: 0
      });

      // Log de auditoria
      await base44.asServiceRole.entities.FilterAuditLog.create({
        action: 'create',
        filter_type: type,
        filter_value: value,
        user_email: user.email,
        user_name: user.full_name || user.email,
        changes_summary: `Criado filtro: ${value}`
      });

      return Response.json({ success: true, filter });
    }

    // PUT - Atualizar filtro
    if (method === 'PUT') {
      const { id, value } = await req.json();
      
      if (!id || !value) {
        return Response.json({ error: 'Missing id or value' }, { status: 400 });
      }

      const oldFilter = await base44.entities.FilterMaster.filter({ id });
      if (oldFilter.length === 0) {
        return Response.json({ error: 'Filter not found' }, { status: 404 });
      }

      const updated = await base44.asServiceRole.entities.FilterMaster.update(id, {
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-')
      });

      // Log de auditoria
      await base44.asServiceRole.entities.FilterAuditLog.create({
        action: 'update',
        filter_type: oldFilter[0].type,
        filter_value: value,
        old_value: oldFilter[0].value,
        user_email: user.email,
        user_name: user.full_name || user.email,
        changes_summary: `Atualizado: ${oldFilter[0].value} → ${value}`
      });

      return Response.json({ success: true, filter: updated });
    }

    // DELETE - Deletar filtro
    if (method === 'DELETE') {
      const { id } = await req.json();
      
      if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400 });
      }

      const filter = await base44.entities.FilterMaster.filter({ id });
      if (filter.length === 0) {
        return Response.json({ error: 'Filter not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities.FilterMaster.delete(id);

      // Log de auditoria
      await base44.asServiceRole.entities.FilterAuditLog.create({
        action: 'delete',
        filter_type: filter[0].type,
        filter_value: filter[0].value,
        user_email: user.email,
        user_name: user.full_name || user.email,
        changes_summary: `Deletado filtro: ${filter[0].value}`
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Filter API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});