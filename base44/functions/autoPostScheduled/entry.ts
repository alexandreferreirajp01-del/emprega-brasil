import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Automação agendada (a cada 5 minutos)
 * Verifica chaves ativas e publica TODAS as vagas pendentes de uma vez
 * Com proteção contra race conditions usando lock
 */
Deno.serve(async (req) => {
  const LOCK_KEY = 'autopost_lock';
  const LOCK_TIMEOUT = 4 * 60 * 1000; // 4 minutos (menor que intervalo de 5 min)

  try {
    const base44 = createClientFromRequest(req);

    console.log('[autoPostScheduled] ============ INICIANDO VERIFICAÇÃO ============');
    const startTime = Date.now();

    // ─── 1. BUSCAR CHAVES ATIVAS DO BACKEND ───────────────────────────
    let activeMode = null;
    try {
      const configs = await base44.asServiceRole.entities.Occurrence.filter({
        type: 'autopost_keys_config'
      });
      
      if (configs?.length > 0 && configs[0].metadata?.activeKeys) {
        const keys = configs[0].metadata.activeKeys;
        activeMode = Object.keys(keys).find(k => keys[k]);
        console.log(`[autoPostScheduled] Chaves carregadas. Modo ativo: ${activeMode || 'NENHUM'}`);
      }
    } catch (e) {
      console.log('[autoPostScheduled] Config não encontrada. Abortando.');
      return Response.json({ ok: true, message: 'No config found' });
    }

    if (!activeMode) {
      console.log('[autoPostScheduled] Nenhuma chave ativa. Abortando.');
      return Response.json({ ok: true, message: 'No active keys' });
    }

    // ─── 2. VERIFICAR LOCK (evitar race conditions) ───────────────────
    let lock = null;
    try {
      const locks = await base44.asServiceRole.entities.Occurrence.filter({
        type: 'autopost_lock'
      });
      
      if (locks?.length > 0) {
        lock = locks[0];
        const lockAge = Date.now() - new Date(lock.updated_date).getTime();
        
        if (lockAge < LOCK_TIMEOUT) {
          console.log(`[autoPostScheduled] ⚠️ LOCK ATIVO (${Math.round(lockAge / 1000)}s). Próxima execução em ${Math.round((LOCK_TIMEOUT - lockAge) / 1000)}s`);
          return Response.json({
            ok: true,
            message: `Lock active. Age: ${Math.round(lockAge / 1000)}s`,
            locked: true
          });
        }
        
        // Lock expirado, atualizar
        console.log('[autoPostScheduled] Lock expirado, renovando...');
      }
    } catch (e) {
      console.log('[autoPostScheduled] Primeira execução, criando lock');
    }

    // ─── 3. CRIAR/ATUALIZAR LOCK ─────────────────────────────────────
    try {
      if (lock) {
        await base44.asServiceRole.entities.Occurrence.update(lock.id, {
          type: 'autopost_lock',
          updated_date: new Date().toISOString()
        });
      } else {
        await base44.asServiceRole.entities.Occurrence.create({
          type: 'autopost_lock',
          description: 'Lock para evitar race conditions no AutoPost',
          status: 'active'
        });
      }
      console.log('[autoPostScheduled] ✅ Lock adquirido');
    } catch (e) {
      console.error('[autoPostScheduled] Erro ao criar lock:', e.message);
      return Response.json({ error: 'Failed to acquire lock' }, { status: 500 });
    }

    // ─── 4. BUSCAR VAGAS PENDENTES ───────────────────────────────────
    let pendingJobs = [];
    try {
      pendingJobs = await base44.asServiceRole.entities.Job.filter({
        status: { $in: ['pending_review', 'draft', 'pending_contact'] }
      });
      console.log(`[autoPostScheduled] 📋 ${pendingJobs.length} vaga(s) pendente(s)`);
    } catch (e) {
      console.error('[autoPostScheduled] Erro ao buscar vagas:', e.message);
      return Response.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (pendingJobs.length === 0) {
      console.log('[autoPostScheduled] Sem vagas para processar. Sucesso.');
      return Response.json({
        ok: true,
        message: 'No pending jobs',
        published: 0
      });
    }

    // ─── 5. PUBLICAR TODAS AS VAGAS DE UMA VEZ ──────────────────────
    console.log(`[autoPostScheduled] 🚀 Publicando ${pendingJobs.length} vaga(s) como "${activeMode}"`);
    
    let published = 0;
    let errors = 0;

    for (const job of pendingJobs) {
      try {
        // Determinar flags baseado no modo
        let isPremium = false;
        let isFeatured = false;

        switch (activeMode) {
          case 'premium':
            isPremium = true;
            break;
          case 'geral_destaque':
            isFeatured = true;
            break;
          case 'premium_destaque':
            isPremium = true;
            isFeatured = true;
            break;
          case 'auto_ia':
            // IA inteligente baseado em critérios
            const salary = job.salary_range ? parseInt(job.salary_range.replace(/\D/g, '')) : 0;
            const isSpecialized = ['Desenvolvedor', 'Arquiteto', 'Especialista', 'Senior', 'Lead'].some(
              word => job.title?.includes(word) || job.job_function?.includes(word)
            );
            const isPJ = job.job_type === 'PJ';
            const isRemote = job.work_mode === 'Remoto' || job.is_remote === true;

            if ((salary > 2500 && isSpecialized) || isPJ) {
              isPremium = true;
              isFeatured = true;
            } else if (isRemote) {
              isPremium = true;
            }
            break;
          case 'geral':
          default:
            // Geral: sem flags
            break;
        }

        // Atualizar job
        await base44.asServiceRole.entities.Job.update(job.id, {
          status: 'ativa',
          is_premium: isPremium,
          is_featured: isFeatured,
          published_at: new Date().toISOString()
        });

        // Enviar notificação
        try {
          await base44.asServiceRole.functions.invoke('notifyNewJob', {
            jobId: job.id,
            jobTitle: job.title,
            jobCompany: job.company,
            jobCity: job.city,
            isHomeOffice: job.is_remote === true,
            force: true
          });
        } catch (e) {
          console.warn(`[autoPostScheduled] ⚠️ Erro ao notificar vaga ${job.id}:`, e.message);
          // Não contar como erro de publicação
        }

        published++;
        console.log(`[autoPostScheduled] ✅ ${published}. ${job.title} (${isPremium ? 'Premium' : 'Geral'}${isFeatured ? '+Destaque' : ''})`);
      } catch (e) {
        errors++;
        console.error(`[autoPostScheduled] ❌ Erro ao publicar ${job.title}:`, e.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[autoPostScheduled] ============ CONCLUÍDO EM ${duration}s ============`);
    console.log(`[autoPostScheduled] Resultado: ${published} publicadas, ${errors} erro(s)`);

    return Response.json({
      ok: true,
      activeMode,
      totalPending: pendingJobs.length,
      published,
      errors,
      duration: `${duration}s`
    });

  } catch (error) {
    console.error('[autoPostScheduled] ERRO FATAL:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});