import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin' && user?.email !== 'alexandreferreirajp01@gmail.com' && user?.subscription_type !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { startDate, endDate } = await req.json();

    // Buscar logs de ocorrências (funções chamadas)
    const occurrences = await base44.asServiceRole.entities.Occurrence.list('-created_date', 1000);

    // Filtrar por período
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredLogs = occurrences.filter(log => {
      const logDate = new Date(log.created_date);
      return logDate >= start && logDate <= end;
    });

    // Agrupar por função e calcular uso
    const functionMap = {};
    let totalCreditsUsed = 0;
    let messageCreditsUsed = 0;

    const creditCosts = {
      'InvokeLLM': 1,
      'SendEmail': 0.5,
      'UploadFile': 0.1,
      'GenerateImage': 5,
      'ExtractDataFromUploadedFile': 1,
      'telegramWebhook': 0.5,
      'receberVagaN8N': 0.5,
      'autoPostScheduled': 0.2,
      'autoPostTelegram': 0.3,
      'notifyJobCreated': 0.5,
      'notifyNewJob': 0.5,
      'sendWhatsAppNotification': 0.5,
      'sendPushNotification': 0.3,
      'geocodeSystem': 0.2,
      'default': 0.1,
    };

    filteredLogs.forEach(log => {
      const funcName = log.function_name || 'Unknown';
      const cost = creditCosts[funcName] || creditCosts.default;

      if (!functionMap[funcName]) {
        functionMap[funcName] = {
          name: funcName,
          callCount: 0,
          creditsPerCall: cost,
          totalCreditsUsed: 0,
        };
      }

      functionMap[funcName].callCount += 1;
      functionMap[funcName].totalCreditsUsed += cost;

      // Separar créditos de IA (InvokeLLM, GenerateImage)
      if (['InvokeLLM', 'GenerateImage'].includes(funcName)) {
        messageCreditsUsed += cost;
      } else {
        totalCreditsUsed += cost;
      }
    });

    // Dados fictícios de plano (em produção, buscar do banco)
    const planData = {
      creditsTotal: 1000, // Créditos inclusos no plano
      creditsUsed: Math.round(totalCreditsUsed),
      messageCreditsTotal: 500,
      messageCreditsUsed: Math.round(messageCreditsUsed),
      nextRenewal: '2026-04-19', // Data simulada
    };

    const functionLogs = Object.values(functionMap)
      .sort((a, b) => b.totalCreditsUsed - a.totalCreditsUsed)
      .slice(0, 20); // Top 20 funções

    return Response.json({
      ...planData,
      functionLogs,
      period: { startDate, endDate },
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro em getSystemHealth:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});