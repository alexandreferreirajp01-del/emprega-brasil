import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Cargos de alto salário que classificam como Premium+Destaque
const HIGH_VALUE_ROLES = [
  'médico', 'medico', 'dentista', 'advogado', 'contador', 'engenheiro', 'arquiteto',
  'diretor', 'gerente', 'coordenador', 'analista sênior', 'analista senior',
  'especialista', 'consultor', 'farmacêutico', 'farmaceutico', 'veterinário', 'veterinario',
  'psicólogo', 'psicologo', 'nutricionista', 'fisioterapeuta', 'enfermeiro', 'terapeuta',
  'juiz', 'promotor', 'delegado', 'auditor', 'superintendente', 'gestor'
];

// Extrair valor numérico do salário
function parseSalary(salaryStr) {
  if (!salaryStr) return 0;
  const cleaned = salaryStr.replace(/[^\d,\.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Classificar vaga por tipo de publicação
function classifyJob(job) {
  const title = (job.title || '').toLowerCase();
  const salary = parseSalary(job.salary_range);
  const workMode = (job.work_mode || '').toLowerCase();
  const isRemote = job.is_remote === true;
  const jobType = (job.job_type || '').toLowerCase();
  const contractTypes = (job.contract_types || []).map(c => c.toLowerCase());

  // Premium+Destaque: salário alto ou cargo de alto valor ou PJ
  const isHighSalary = salary >= 2500;
  const isHighValueRole = HIGH_VALUE_ROLES.some(role => title.includes(role));
  const isPJ = jobType === 'pj' || contractTypes.includes('pj');

  if (isHighSalary || isHighValueRole || isPJ) {
    return { isPremium: true, isFeatured: true, reason: 'Premium+Destaque (salário alto/cargo especializado/PJ)' };
  }

  // Premium: home office / remoto / híbrido
  const isHomeOffice = workMode === 'remoto' || workMode === 'híbrido' || workMode === 'hibrido' || isRemote;
  if (isHomeOffice) {
    return { isPremium: true, isFeatured: false, reason: 'Premium (home office/remoto/híbrido)' };
  }

  // Geral: demais vagas
  return { isPremium: false, isFeatured: false, reason: 'Geral' };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || (user.role !== 'admin' && user.email !== 'alexandreferreirajp01@gmail.com')) {
    return Response.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  const body = await req.json();
  const { mode, jobIds } = body;
  // mode: 'premium' | 'geral' | 'premium_destaque' | 'geral_destaque' | 'auto_ia'
  // jobIds: array de IDs a publicar

  if (!mode || !jobIds?.length) {
    return Response.json({ error: 'Informe mode e jobIds' }, { status: 400 });
  }

  let published = 0, errors = 0;
  const results = [];

  for (const jobId of jobIds) {
    try {
      // Buscar vaga
      const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId });
      const job = jobs[0];
      if (!job) { errors++; continue; }

      let isPremium = false;
      let isFeatured = false;
      let reason = '';

      if (mode === 'auto_ia') {
        const classified = classifyJob(job);
        isPremium = classified.isPremium;
        isFeatured = classified.isFeatured;
        reason = classified.reason;
      } else if (mode === 'premium') {
        isPremium = true; isFeatured = false; reason = 'Premium';
      } else if (mode === 'geral') {
        isPremium = false; isFeatured = false; reason = 'Geral';
      } else if (mode === 'premium_destaque') {
        isPremium = true; isFeatured = true; reason = 'Premium+Destaque';
      } else if (mode === 'geral_destaque') {
        isPremium = false; isFeatured = true; reason = 'Geral+Destaque';
      }

      await base44.asServiceRole.entities.Job.update(jobId, {
        is_premium: isPremium,
        is_featured: isFeatured,
        published_at: new Date().toISOString(),
        status: 'ativa'
      });

      // Disparar notificação
      await base44.asServiceRole.functions.invoke('notifyNewJob', {
        jobId: job.id,
        jobTitle: job.title,
        jobCompany: job.company,
        jobCity: job.city,
        isHomeOffice: job.work_mode === 'Remoto' || job.is_remote === true,
      });

      published++;
      results.push({ id: jobId, title: job.title, reason });
    } catch (e) {
      console.error('Erro ao publicar', jobId, e.message);
      errors++;
    }
  }

  return Response.json({ published, errors, results });
});