import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = "BCadDFNIP2f5vb4qw-FDIE4oErydBEGKUjvSz__sZaHOTSy6krKkuhcmh-FQ-t5xClfI-IE90yNMyBYAbVd5F6Q";
const VAPID_PRIVATE_KEY = "3jK8_LCcooMHF3xjb8sSjT3u5qXkwkdmewCzTolOjDA";
const VAPID_EMAIL = 'mailto:alexandreferreirajp01@gmail.com';
const APP_URL = 'https://vagasabertasparaiba.info';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// ─── Cargos de alto valor → Premium+Destaque ──────────────────────────────────
const HIGH_VALUE_ROLES = [
  'médico', 'medico', 'dentista', 'advogado', 'contador', 'engenheiro', 'arquiteto',
  'diretor', 'gerente', 'coordenador', 'analista sênior', 'analista senior',
  'especialista', 'consultor', 'farmacêutico', 'farmaceutico', 'veterinário', 'veterinario',
  'psicólogo', 'psicologo', 'nutricionista', 'fisioterapeuta', 'enfermeiro', 'terapeuta',
  'juiz', 'promotor', 'delegado', 'auditor', 'superintendente', 'gestor'
];

function parseSalary(salaryStr) {
  if (!salaryStr) return 0;
  const cleaned = salaryStr.replace(/[^\d,\.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function classifyJob(job) {
  const title = (job.title || '').toLowerCase();
  const salary = parseSalary(job.salary_range);
  const workMode = (job.work_mode || '').toLowerCase();
  const isRemote = job.is_remote === true;
  const jobType = (job.job_type || '').toLowerCase();
  const contractTypes = (job.contract_types || []).map(c => c.toLowerCase());

  const isHighSalary = salary >= 2500;
  const isHighValueRole = HIGH_VALUE_ROLES.some(role => title.includes(role));
  const isPJ = jobType === 'pj' || contractTypes.includes('pj');

  if (isHighSalary || isHighValueRole || isPJ) {
    return { isPremium: true, isFeatured: true, reason: 'Premium+Destaque (salário alto/cargo especializado/PJ)' };
  }

  const isHomeOffice = workMode === 'remoto' || workMode === 'híbrido' || workMode === 'hibrido' || isRemote;
  if (isHomeOffice) {
    return { isPremium: true, isFeatured: false, reason: 'Premium (home office/remoto/híbrido)' };
  }

  return { isPremium: false, isFeatured: false, reason: 'Geral' };
}

// ─── Notificar uma única vaga (sininho + push) ────────────────────────────────
async function notifyJob(base44, job) {
  const jobId = job.id;
  const jobUrl = `${APP_URL}/JobDetail?id=${jobId}`;
  const isHomeOffice = job.work_mode === 'Remoto' || job.is_remote === true;

  const title = `🚨 Nova vaga disponível!`;
  const body = `${job.title} em ${job.company || 'Empresa'}${job.city ? ` · ${job.city}` : ''}. Clique e candidate-se agora!`;

  // 1. Criar notificação no sininho (sent_to_all = aparece para todos)
  await base44.asServiceRole.entities.Notification.create({
    title,
    message: body,
    type: 'job',
    reference_type: 'job',
    reference_id: jobId,
    job_id: jobId,
    redirect_page: 'JobDetail',
    redirect_params: { id: jobId },
    sent_to_all: true,
    is_read: false
  });

  // 2. Push notifications
  const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({ is_active: true }, '-created_date', 5000);
  const pushPayload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    url: jobUrl,
    data: { url: jobUrl },
    timestamp: Date.now()
  });

  const failedSubs = [];
  const BATCH = 50;
  for (let i = 0; i < subscriptions.length; i += BATCH) {
    const batch = subscriptions.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload
          );
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) failedSubs.push(sub.id);
        }
      })
    );
  }

  // Limpar subscriptions inválidas
  if (failedSubs.length > 0) {
    await Promise.allSettled(failedSubs.map(id => base44.asServiceRole.entities.PushSubscription.delete(id)));
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || (user.role !== 'admin' && user.email !== 'alexandreferreirajp01@gmail.com')) {
    return Response.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  const body = await req.json();
  const { mode, jobIds } = body;
  // mode: 'premium' | 'geral' | 'premium_destaque' | 'geral_destaque' | 'auto_ia'

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

      // Publicar vaga
      await base44.asServiceRole.entities.Job.update(jobId, {
        is_premium: isPremium,
        is_featured: isFeatured,
        published_at: new Date().toISOString(),
        status: 'ativa'
      });

      // Notificar (sininho + push) — diretamente, sem invocar outra função
      await notifyJob(base44, { ...job, id: jobId });

      published++;
      results.push({ id: jobId, title: job.title, reason });
    } catch (e) {
      console.error('Erro ao publicar', jobId, e.message);
      errors++;
    }
  }

  return Response.json({ published, errors, results });
});