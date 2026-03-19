import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Salva as chaves de AutoPost ativas no backend
 * para que a automação possa acessá-las
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.email !== 'alexandreferreirajp01@gmail.com' && user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { activeKeys = {} } = body;

    console.log('[saveAutopostKeys] Salvando chaves ativas:', Object.keys(activeKeys).filter(k => activeKeys[k]));

    // Usar Occurrence para armazenar a config (é a tabela mais "genérica")
    // Ou criar um entity específico se preferir
    
    // Buscar config existente
    let config = null;
    try {
      const configs = await base44.asServiceRole.entities.Occurrence.filter({
        type: 'autopost_keys_config'
      });
      if (configs?.length > 0) {
        config = configs[0];
      }
    } catch (e) {
      console.log('[saveAutopostKeys] Primeira vez salvando config');
    }

    if (config) {
      // Atualizar
      await base44.asServiceRole.entities.Occurrence.update(config.id, {
        type: 'autopost_keys_config',
        description: `AutoPost Keys - Última atualização: ${new Date().toISOString()}`,
        metadata: { activeKeys, updatedAt: new Date().toISOString() }
      });
      console.log('[saveAutopostKeys] Config atualizada');
    } else {
      // Criar
      await base44.asServiceRole.entities.Occurrence.create({
        type: 'autopost_keys_config',
        description: `AutoPost Keys - Criado: ${new Date().toISOString()}`,
        metadata: { activeKeys, createdAt: new Date().toISOString() },
        status: 'active'
      });
      console.log('[saveAutopostKeys] Config criada');
    }

    const activeMode = Object.keys(activeKeys).find(k => activeKeys[k]);
    return Response.json({
      ok: true,
      message: activeMode ? `Chaves sincronizadas. Ativo: ${activeMode}` : 'Chaves sincronizadas. Nenhuma ativa.'
    });

  } catch (error) {
    console.error('[saveAutopostKeys] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});