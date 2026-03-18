import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.subscription_type !== 'admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { start_date, cycle } = body;

    if (!start_date || !cycle) {
      return Response.json({ error: 'start_date and cycle required' }, { status: 400 });
    }

    const start = new Date(start_date);
    const expiration = new Date(start);

    const cycles = {
      monthly: { months: 1 },
      quarterly: { months: 3 },
      semiannual: { months: 6 },
      annual: { months: 12 }
    };

    const add = cycles[cycle] || { months: 1 };
    expiration.setMonth(expiration.getMonth() + add.months);

    const now = new Date();
    const daysRemaining = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24));

    return Response.json({
      expiration_date: expiration.toISOString(),
      days_remaining: Math.max(0, daysRemaining),
      is_expired: daysRemaining < 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});