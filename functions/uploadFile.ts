import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    console.log('📤 Upload iniciado:', file.name, file.size, 'bytes');

    // Upload usando Core.UploadFile
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    
    console.log('✅ Upload concluído:', uploadResult.file_url);

    return Response.json({ 
      success: true,
      file_url: uploadResult.file_url,
      file_name: file.name
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return Response.json({ 
      error: error.message || 'Erro ao fazer upload' 
    }, { status: 500 });
  }
});