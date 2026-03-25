 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/base44/functions/expirePremiumTrials/entry.ts b/base44/functions/expirePremiumTrials/entry.ts
new file mode 100644
index 0000000000000000000000000000000000000000..f4eeb889771e2e3e3db9d15eb67c97bdcf13e0ed
--- /dev/null
+++ b/base44/functions/expirePremiumTrials/entry.ts
@@ -0,0 +1,75 @@
+import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
+
+Deno.serve(async (req) => {
+  try {
+    const base44 = createClientFromRequest(req);
+
+    const secret = Deno.env.get('TRIAL_CRON_SECRET');
+    const secretHeader = req.headers.get('x-cron-secret');
+    if (secret && secretHeader !== secret) {
+      return Response.json({ error: 'Não autorizado' }, { status: 401 });
+    }
+
+    const now = new Date();
+    const trialUsers = await base44.asServiceRole.entities.User.filter({
+      premium_trial_active: true,
+    }, '-premium_trial_expires_at', 2000);
+
+    if (!trialUsers?.length) {
+      return Response.json({ success: true, processed: 0, expired: 0, emailed: 0 });
+    }
+
+    let expired = 0;
+    let emailed = 0;
+
+    for (const user of trialUsers) {
+      if (!user.premium_trial_expires_at) continue;
+      const expiresAt = new Date(user.premium_trial_expires_at);
+      if (expiresAt.getTime() > now.getTime()) continue;
+
+      await base44.asServiceRole.entities.User.update(user.id, {
+        subscription_type: 'basic',
+        premium_trial_active: false,
+        premium_trial_expired_at: now.toISOString(),
+        trial_status: 'expired',
+      });
+
+      expired += 1;
+
+      if (user.email && !user.trial_expiration_email_sent_at) {
+        await base44.asServiceRole.integrations.Core.SendEmail({
+          to: user.email,
+          subject: 'Seu teste Premium expirou ⏰',
+          body: `
+            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
+              <h2 style="color:#0A66C2;">Seu acesso Premium de teste expirou</h2>
+              <p>Olá, ${user.full_name || user.email}!</p>
+              <p>Seu período de teste Premium foi encerrado.</p>
+              <p>Para continuar com todos os benefícios Premium, assine agora:</p>
+              <p>
+                <a href="https://vagasabertaspb.com.br/subscription" style="display:inline-block;background:#0A66C2;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
+                  Assinar Premium
+                </a>
+              </p>
+            </div>
+          `,
+        });
+
+        await base44.asServiceRole.entities.User.update(user.id, {
+          trial_expiration_email_sent_at: now.toISOString(),
+        });
+        emailed += 1;
+      }
+    }
+
+    return Response.json({
+      success: true,
+      processed: trialUsers.length,
+      expired,
+      emailed,
+    });
+  } catch (error) {
+    console.error('Erro no expurgo de trials premium:', error);
+    return Response.json({ error: error.message || 'Erro interno' }, { status: 500 });
+  }
+});
 
EOF
)
