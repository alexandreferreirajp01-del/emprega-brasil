import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação e admin
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.email === 'alexandreferreirajp01@gmail.com' || 
                    user.role === 'admin' || 
                    user.subscription_type === 'admin';

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { filters, password } = await req.json();

    // Validar senha
    if (password !== 'Vagas2026#') {
      return Response.json({ error: 'Invalid password' }, { status: 403 });
    }

    // Iniciar transação (deletar todos e recriar)
    const startTime = Date.now();
    
    // 1. Buscar filtros existentes
    const existingFilters = await base44.asServiceRole.entities.FilterMaster.list('order', 5000);
    
    // 2. Deletar todos
    for (const filter of existingFilters) {
      await base44.asServiceRole.entities.FilterMaster.delete(filter.id);
    }

    // 3. Criar novos filtros
    const created = [];
    let order = 0;

    // Categorias
    for (const value of filters.categories || []) {
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type: 'category',
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        order: order++,
        is_active: true
      });
      created.push(filter);
    }

    // Funções
    order = 0;
    for (const value of filters.jobFunctions || []) {
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type: 'jobFunction',
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        order: order++,
        is_active: true
      });
      created.push(filter);
    }

    // Tipos de Vaga
    order = 0;
    for (const value of filters.jobTypes || []) {
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type: 'jobType',
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        order: order++,
        is_active: true
      });
      created.push(filter);
    }

    // Cidades
    order = 0;
    for (const value of filters.cities || []) {
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type: 'city',
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        order: order++,
        is_active: true
      });
      created.push(filter);
    }

    // Modelos de Trabalho
    order = 0;
    for (const value of filters.workModels || []) {
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type: 'workModel',
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        order: order++,
        is_active: true
      });
      created.push(filter);
    }

    // Senioridade
    order = 0;
    for (const value of filters.seniority || []) {
      const filter = await base44.asServiceRole.entities.FilterMaster.create({
        type: 'seniority',
        value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        order: order++,
        is_active: true
      });
      created.push(filter);
    }

    // Log de auditoria
    await base44.asServiceRole.entities.FilterAuditLog.create({
      action: 'bulk_update',
      user_email: user.email,
      user_name: user.full_name || user.email,
      changes_summary: `Atualização em massa: ${created.length} filtros salvos`
    });

    // Sincronizar categorias profissionais
    const oldCategories = await base44.asServiceRole.entities.ProfessionalCategory.list('category_order', 500);
    for (const cat of oldCategories) {
      await base44.asServiceRole.entities.ProfessionalCategory.delete(cat.id);
    }

    if (filters.categories && filters.categories.length > 0) {
      for (let i = 0; i < filters.categories.length; i++) {
        await base44.asServiceRole.entities.ProfessionalCategory.create({
          category_name: filters.categories[i],
          category_order: i + 1,
          job_titles: filters.jobFunctions || [],
          keywords: [filters.categories[i].toLowerCase()],
          is_active: true
        });
      }
    }

    const duration = Date.now() - startTime;

    return Response.json({ 
      success: true, 
      message: 'Filtros atualizados com sucesso',
      created: created.length,
      duration: `${duration}ms`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Bulk commit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});