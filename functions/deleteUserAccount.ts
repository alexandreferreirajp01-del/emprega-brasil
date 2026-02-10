import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmEmail } = await req.json();

    // Validação de segurança
    if (confirmEmail !== user.email) {
      return Response.json({ error: 'Email de confirmação não corresponde' }, { status: 400 });
    }

    // Deletar todos os dados do usuário usando service role
    const userEmail = user.email;

    // 1. Deletar registros de entidades onde user_email é usado
    await Promise.allSettled([
      base44.asServiceRole.entities.FavoriteJob.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.FavoriteJob.delete(item.id)))
      ),
      base44.asServiceRole.entities.ViewHistory.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.ViewHistory.delete(item.id)))
      ),
      base44.asServiceRole.entities.Notification.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.Notification.delete(item.id)))
      ),
      base44.asServiceRole.entities.ProfessionalResume.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.ProfessionalResume.delete(item.id)))
      ),
      base44.asServiceRole.entities.CurriculoUsuario.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.CurriculoUsuario.delete(item.id)))
      ),
      base44.asServiceRole.entities.FeedPost.filter({ autor_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.FeedPost.delete(item.id)))
      ),
      base44.asServiceRole.entities.FeedComentario.filter({ autor_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.FeedComentario.delete(item.id)))
      ),
      base44.asServiceRole.entities.FeedSalvo.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.FeedSalvo.delete(item.id)))
      ),
      base44.asServiceRole.entities.Payment.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.Payment.delete(item.id)))
      ),
      base44.asServiceRole.entities.JobView.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.JobView.delete(item.id)))
      ),
      base44.asServiceRole.entities.PushSubscription.filter({ user_email: userEmail }).then(items => 
        Promise.all(items.map(item => base44.asServiceRole.entities.PushSubscription.delete(item.id)))
      ),
    ]);

    // 2. Deletar vagas criadas pelo usuário
    const userJobs = await base44.asServiceRole.entities.Job.filter({ created_by: userEmail });
    await Promise.all(userJobs.map(job => base44.asServiceRole.entities.Job.delete(job.id)));

    // 3. Deletar a conta do usuário usando auth admin
    await base44.asServiceRole.auth.deleteUser(user.id);

    return Response.json({ 
      success: true, 
      message: 'Conta deletada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return Response.json({ 
      error: 'Erro ao deletar conta: ' + error.message 
    }, { status: 500 });
  }
});