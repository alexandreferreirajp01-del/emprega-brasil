import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = user.role === 'admin' || 
                    user.subscription_type === 'admin' ||
                    user.email === 'alexandreferreirajp01@gmail.com';
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar todas as vagas
    const allJobs = await base44.asServiceRole.entities.Job.list('created_date', 10000);
    
    // Regex para detectar contatos
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /\(?[0-9]{2}\)?[\s-]?[0-9]{4,5}[\s-]?[0-9]{4}/;
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/;
    
    function hasContact(job) {
      // Verificar se tem descrição mínima
      if (!job.description || job.description.trim().length < 10) {
        return false;
      }

      const fullText = `${job.description || ''} ${job.additional_info || ''} ${job.application_link || ''}`.toLowerCase();
      
      // Verificar application_link
      if (job.application_link && urlRegex.test(job.application_link)) {
        return true;
      }
      
      // Verificar email, telefone ou site no texto
      return emailRegex.test(fullText) || 
             phoneRegex.test(fullText) || 
             urlRegex.test(fullText);
    }

    let deleted = 0;
    let kept = 0;
    const deletedJobs = [];

    // Deletar vagas sem contato
    for (const job of allJobs) {
      if (!hasContact(job)) {
        try {
          await base44.asServiceRole.entities.Job.delete(job.id);
          deleted++;
          deletedJobs.push({
            id: job.id,
            title: job.title,
            company: job.company
          });
        } catch (e) {
          console.error(`Erro ao deletar vaga ${job.id}:`, e);
        }
      } else {
        kept++;
      }
    }

    return Response.json({
      success: true,
      message: `Limpeza concluída: ${deleted} vagas deletadas, ${kept} mantidas`,
      deleted,
      kept,
      total: allJobs.length,
      deletedJobs
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});