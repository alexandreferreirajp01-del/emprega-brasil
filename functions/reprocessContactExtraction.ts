import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Função para reprocessar vagas sem contato
 * Tenta extrair contatos até 3 vezes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Apenas admin pode executar
    if (user?.role !== 'admin' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'job_id é obrigatório' }, { status: 400 });
    }

    // Buscar a vaga
    const job = await base44.asServiceRole.entities.Job.get(job_id);

    if (!job) {
      return Response.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    // Verificar tentativas
    const attempts = job.reprocess_attempts || 0;
    if (attempts >= 3) {
      return Response.json({ 
        error: 'Limite de tentativas atingido',
        message: 'Esta vaga já foi reprocessada 3 vezes sem sucesso'
      }, { status: 400 });
    }

    // Tentar extrair contatos novamente
    const prompt = `🔍 ANÁLISE CRÍTICA - BUSCA PROFUNDA DE CONTATOS:

IMPORTANTE: Analise com MÁXIMA ATENÇÃO para encontrar QUALQUER forma de contato.

📞 BUSQUE TODOS OS CONTATOS POSSÍVEIS:
   - Telefones (WhatsApp, fixo, celular) - QUALQUER número
   - Emails - TODOS os emails visíveis
   - Instagram, Facebook, LinkedIn - @username ou links
   - Sites da empresa
   - Links de formulário/candidatura
   - QR Codes (extraia o link)
   - Qualquer outro meio de contato mencionado

⚠️ REGRA CRÍTICA: 
   - Se houver QUALQUER forma de contato, extraia
   - Não deixe passar nenhum contato
   - Analise texto, imagem, cantos, rodapé
   - Procure em logos, marcas d'água

TEXTO/DESCRIÇÃO:
${job.description || ''}

INFORMAÇÕES ADICIONAIS:
${job.additional_info || ''}

TÍTULO: ${job.title}
EMPRESA: ${job.company}`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: job.image_url ? [job.image_url] : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          contact_phone: { type: "string" },
          contact_whatsapp: { type: "string" },
          contact_email: { type: "string" },
          application_link: { type: "string" },
          instagram: { type: "string" },
          facebook: { type: "string" },
          website: { type: "string" },
          found_any_contact: { type: "boolean" }
        }
      }
    });

    // Verificar se encontrou algum contato
    const hasContact = resultado.found_any_contact || 
                      resultado.application_link || 
                      resultado.contact_phone || 
                      resultado.contact_whatsapp || 
                      resultado.contact_email;

    // Atualizar a vaga
    const updateData = {
      reprocess_attempts: attempts + 1,
      last_validated_at: new Date().toISOString(),
      validation_agent: 'reprocess_system'
    };

    if (hasContact) {
      // Atualizar contatos
      if (resultado.contact_phone) updateData.contact_phone = resultado.contact_phone;
      if (resultado.contact_whatsapp) updateData.contact_whatsapp = resultado.contact_whatsapp;
      if (resultado.contact_email) updateData.contact_email = resultado.contact_email;
      if (resultado.application_link) updateData.application_link = resultado.application_link;
      
      // Adicionar links sociais em additional_info
      let socialLinks = '';
      if (resultado.instagram) socialLinks += `📷 Instagram: ${resultado.instagram}\n`;
      if (resultado.facebook) socialLinks += `👥 Facebook: ${resultado.facebook}\n`;
      if (resultado.website) socialLinks += `🌐 Site: ${resultado.website}\n`;
      
      if (socialLinks) {
        updateData.additional_info = (job.additional_info || '') + '\n\n' + socialLinks;
      }

      updateData.status = 'ativa';
      updateData.contact_status = 'ok';
      updateData.needs_review = false;
    } else {
      // Se ainda não tem contato após 3 tentativas, manter como pending_contact
      updateData.status = attempts >= 2 ? 'pending_contact' : job.status;
      updateData.contact_status = 'missing';
      updateData.needs_review = true;
      updateData.review_notes = `Reprocessado ${attempts + 1}x - Nenhum contato encontrado`;
    }

    await base44.asServiceRole.entities.Job.update(job_id, updateData);

    return Response.json({
      success: true,
      found_contact: hasContact,
      attempts: attempts + 1,
      message: hasContact 
        ? '✅ Contato extraído com sucesso! Vaga ativada.'
        : `⚠️ Tentativa ${attempts + 1}/3 - Nenhum contato encontrado.`,
      extracted_data: hasContact ? resultado : null
    });

  } catch (error) {
    console.error('Erro ao reprocessar:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao reprocessar extração de contato'
    }, { status: 500 });
  }
});