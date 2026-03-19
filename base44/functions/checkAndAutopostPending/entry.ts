import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Função que verifica se chaves de AutoPost estão ativas
 * e publica automaticamente todas as vagas pendentes.
 * 
 * Deve ser disparada por uma automação de entity quando uma vaga chega com status 'pending_review'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Validar se é admin
    const user = await base44.auth.me();
    if (!user || (user.email !== 'alexandreferreirajp01@gmail.com' && user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('[checkAndAutopostPending] Iniciando verificação de chaves ativas...');

    // Buscar as chaves ativas (armazenadas em um documento de configuração)
    let activeKeys = {};
    try {
      // Tentar buscar de um possível documento de config
      // Por enquanto, vamos usar localStorage do admin (que foi sincronizado)
      // Mas para automação, precisamos de um backend storage
      
      // FALLBACK: usar Occurrence para armazenar config
      const configs = await base44.asServiceRole.entities.Occurrence.filter({
        type: 'autopost_keys_config'
      });
      
      if (configs?.length > 0) {
        activeKeys = configs[0].metadata?.activeKeys || {};
        console.log('[checkAndAutopostPending] Chaves ativas encontradas:', Object.keys(activeKeys));
      } else {
        console.log('[checkAndAutopostPending] Nenhuma chave ativa configurada');
        return Response.json({ ok: true, message: 'Sem chaves ativas' });
      }
    } catch (e) {
      console.warn('[checkAndAutopostPending] Erro ao buscar chaves:', e.message);
      return Response.json({ ok: true, message: 'Config not found, usando defaults' });
    }

    // Se nenhuma chave ativa, sair
    const activeMode = Object.keys(activeKeys).find(k => activeKeys[k]);
    if (!activeMode) {
      console.log('[checkAndAutopostPending] Nenhuma chave ativa no momento');
      return Response.json({ ok: true, message: 'No active keys' });
    }

    console.log(`[checkAndAutopostPending] Modo de AutoPost ativo: ${activeMode}`);

    // Buscar todas as vagas pendentes
    const pendingJobs = await base44.asServiceRole.entities.Job.filter({
      status: { $in: ['pending_review', 'pending_contact', 'n8n_automatico'] }
    });

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('[checkAndAutopostPending] Nenhuma vaga pendente');
      return Response.json({ ok: true, message: 'No pending jobs', published: 0 });
    }

    console.log(`[checkAndAutopostPending] Encontradas ${pendingJobs.length} vagas pendentes`);

    // Executar publicação automática
    const jobIds = pendingJobs.map(j => j.id);
    const response = await base44.asServiceRole.functions.invoke('autoPublishPending', {
      mode: activeMode,
      jobIds: jobIds
    });

    const result = response?.data || { published: 0, errors: 0 };
    console.log(`[checkAndAutopostPending] Resultado: ${result.published} publicadas, ${result.errors} erros`);

    return Response.json({
      ok: true,
      activeMode,
      totalPending: pendingJobs.length,
      published: result.published,
      errors: result.errors
    });

  } catch (error) {
    console.error('[checkAndAutopostPending] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});