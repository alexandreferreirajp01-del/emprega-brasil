import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
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

    // Verificar se já existe dados
    const existing = await base44.asServiceRole.entities.FilterMaster.list('order', 10);
    if (existing.length > 0) {
      return Response.json({ 
        success: true, 
        message: 'Filtros já inicializados',
        count: existing.length 
      });
    }

    // Dados iniciais
    const initialData = {
      categories: [
        'Administração e Escritório',
        'Agropecuária e Rural',
        'Alimentação e Gastronomia',
        'Atendimento e Hospitalidade',
        'Beleza e Estética',
        'Comercial e Vendas',
        'Construção Civil',
        'Educação',
        'Engenharia',
        'Saúde',
        'Tecnologia da Informação',
        'Transporte e Logística'
      ],
      jobFunctions: [
        'Auxiliar de cozinha', 'ASG', 'Auxiliar administrativo', 'Analista administrativo',
        'Analista de compras', 'Analista de logística', 'Analista de marketing',
        'Atendente de balcão', 'Auxiliar de limpeza', 'Auxiliar de produção',
        'Caixa de supermercado', 'Carpinteiro', 'Consultor de vendas',
        'Cozinheiro', 'Designer gráfico', 'Desenvolvedor de software',
        'Eletricista', 'Engenheiro civil', 'Farmacêutico', 'Fisioterapeuta',
        'Garçom', 'Motorista', 'Nutricionista', 'Operador de caixa',
        'Pedreiro', 'Professor', 'Psicólogo', 'Recepcionista',
        'Técnico de enfermagem', 'Vendedor', 'Mecânico', 'Balconista',
        'Repositor', 'Gerente', 'Coordenador', 'Outros'
      ],
      jobTypes: [
        'CLT', 'PJ', 'Autônomo', 'Estágio', 'Jovem Aprendiz', 
        'Temporário', 'Freelancer', 'Trainee', 'Banco de Talentos'
      ],
      cities: [
        'João Pessoa', 'Campina Grande', 'Bayeux', 'Cabedelo', 
        'Santa Rita', 'Patos', 'Guarabira', 'Cajazeiras', 
        'Sousa', 'Pombal', 'Conde'
      ],
      workModels: ['Presencial', 'Híbrido', 'Home Office', 'Remoto'],
      seniority: ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista']
    };

    let created = 0;

    // Criar categorias
    for (let i = 0; i < initialData.categories.length; i++) {
      await base44.asServiceRole.entities.FilterMaster.create({
        type: 'category',
        value: initialData.categories[i],
        slug: initialData.categories[i].toLowerCase().replace(/\s+/g, '-'),
        order: i,
        is_active: true
      });
      created++;
    }

    // Criar funções
    for (let i = 0; i < initialData.jobFunctions.length; i++) {
      await base44.asServiceRole.entities.FilterMaster.create({
        type: 'jobFunction',
        value: initialData.jobFunctions[i],
        slug: initialData.jobFunctions[i].toLowerCase().replace(/\s+/g, '-'),
        order: i,
        is_active: true
      });
      created++;
    }

    // Criar tipos
    for (let i = 0; i < initialData.jobTypes.length; i++) {
      await base44.asServiceRole.entities.FilterMaster.create({
        type: 'jobType',
        value: initialData.jobTypes[i],
        slug: initialData.jobTypes[i].toLowerCase().replace(/\s+/g, '-'),
        order: i,
        is_active: true
      });
      created++;
    }

    // Criar cidades
    for (let i = 0; i < initialData.cities.length; i++) {
      await base44.asServiceRole.entities.FilterMaster.create({
        type: 'city',
        value: initialData.cities[i],
        slug: initialData.cities[i].toLowerCase().replace(/\s+/g, '-'),
        order: i,
        is_active: true
      });
      created++;
    }

    // Criar modelos
    for (let i = 0; i < initialData.workModels.length; i++) {
      await base44.asServiceRole.entities.FilterMaster.create({
        type: 'workModel',
        value: initialData.workModels[i],
        slug: initialData.workModels[i].toLowerCase().replace(/\s+/g, '-'),
        order: i,
        is_active: true
      });
      created++;
    }

    // Criar senioridade
    for (let i = 0; i < initialData.seniority.length; i++) {
      await base44.asServiceRole.entities.FilterMaster.create({
        type: 'seniority',
        value: initialData.seniority[i],
        slug: initialData.seniority[i].toLowerCase().replace(/\s+/g, '-'),
        order: i,
        is_active: true
      });
      created++;
    }

    return Response.json({ 
      success: true, 
      message: 'Filtros inicializados com sucesso',
      created 
    });
  } catch (error) {
    console.error('Initialize filters error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});