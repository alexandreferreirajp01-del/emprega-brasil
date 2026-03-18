import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
  }

  // Buscar todas as vagas do whatsapp_agent
  const allJobs = await base44.asServiceRole.entities.Job.filter({ origem: 'whatsapp_agent' });

  // Agrupar por chave de deduplicação: title + contact_email + contact_phone + contact_whatsapp
  const seen = new Map();
  const toDelete = [];

  // Ordenar por created_date para manter o mais antigo
  allJobs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  for (const job of allJobs) {
    const key = [
      (job.title || '').trim().toLowerCase(),
      (job.contact_email || '').trim().toLowerCase(),
      (job.contact_phone || '').trim(),
      (job.contact_whatsapp || '').trim(),
      (job.company || '').trim().toLowerCase(),
    ].join('|');

    if (seen.has(key)) {
      toDelete.push(job.id);
    } else {
      seen.set(key, job.id);
    }
  }

  // Deletar duplicados
  let deleted = 0;
  let errors = 0;
  for (const id of toDelete) {
    try {
      await base44.asServiceRole.entities.Job.delete(id);
      deleted++;
    } catch (e) {
      console.error('Erro ao deletar', id, e.message);
      errors++;
    }
  }

  return Response.json({
    total_analisadas: allJobs.length,
    duplicados_encontrados: toDelete.length,
    deletados: deleted,
    erros: errors,
  });
});