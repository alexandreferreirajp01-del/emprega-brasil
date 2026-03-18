import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Audita links de vagas ativas
 * - Detecta links wa.me com número inválido
 * - Detecta links obviamente quebrados
 * - Corrige números de WhatsApp malformados
 * - Retorna relatório completo
 */

function normalizeWhatsAppLink(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Já é wa.me — validar número
  const waMatch = trimmed.match(/wa\.me\/(\+?[\d\s\-().]+)/i);
  if (waMatch) {
    const digits = waMatch[1].replace(/\D/g, '');
    // Número válido BR: 55 + DDD(2) + número(8 ou 9) = 12 ou 13 dígitos
    if (digits.length < 10) return { fixed: null, issue: 'numero_curto_demais' };

    let phone = digits;
    if (!phone.startsWith('55')) phone = `55${phone}`;

    // DDD + 8 digitos (fixo antigo) → adicionar 9
    if (phone.length === 12) {
      const ddd = phone.substring(2, 4);
      const num = phone.substring(4);
      // Se começa com 2,3,4,5 é fixo — não adicionar 9
      if (/^[6-9]/.test(num)) {
        phone = `55${ddd}9${num}`;
      }
    }

    if (phone.length === 13 || phone.length === 12) {
      return { fixed: `https://wa.me/${phone}`, issue: null };
    }

    return { fixed: `https://wa.me/${phone}`, issue: 'numero_ajustado' };
  }

  return null; // não é wa.me
}

function isObviouslyBroken(url) {
  if (!url || url.trim() === '') return true;
  const u = url.trim().toLowerCase();

  // Links obviamente inválidos
  if (u === 'null' || u === 'undefined' || u === 'n/a' || u === '-') return true;

  // Não tem protocolo nem wa.me
  if (!u.startsWith('http') && !u.startsWith('wa.me') && !u.startsWith('mailto:') && !u.startsWith('tel:')) {
    // Pode ser um número solto
    const digits = u.replace(/\D/g, '');
    if (digits.length >= 10) return false; // é número, pode ser consertado
    return true;
  }

  // URL muito curta
  if (u.replace(/https?:\/\//, '').length < 5) return true;

  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.subscription_type !== 'admin' &&
        user?.email !== 'alexandreferreirajp01@gmail.com') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { fix = false, limit = 500 } = body;

    console.log(`🔍 Auditando links de vagas (fix=${fix}, limit=${limit})...`);

    // Buscar vagas ativas com application_link
    const jobs = await base44.asServiceRole.entities.Job.filter(
      { status: 'ativa' },
      '-created_date',
      limit
    );

    const report = {
      total_checked: jobs.length,
      broken_links: [],
      fixed_links: [],
      wa_normalized: [],
      ok_links: 0,
      no_link: 0,
    };

    for (const job of jobs) {
      const link = job.application_link;

      if (!link || link.trim() === '') {
        report.no_link++;
        continue;
      }

      // Checar se é wa.me
      if (link.includes('wa.me') || link.includes('whatsapp')) {
        const waResult = normalizeWhatsAppLink(link);
        if (waResult) {
          if (waResult.fixed && waResult.fixed !== link) {
            report.wa_normalized.push({
              id: job.id,
              title: job.title,
              company: job.company,
              original: link,
              fixed: waResult.fixed,
              issue: waResult.issue
            });

            if (fix) {
              await base44.asServiceRole.entities.Job.update(job.id, {
                application_link: waResult.fixed,
                last_validated_at: new Date().toISOString(),
                validation_agent: 'audit_system'
              });
            }
            continue;
          } else if (!waResult.fixed) {
            report.broken_links.push({
              id: job.id,
              title: job.title,
              company: job.company,
              link,
              issue: waResult.issue || 'wa_invalido'
            });
            continue;
          }
        }
      }

      // Checar links obviamente quebrados
      if (isObviouslyBroken(link)) {
        // Se parece número solto, tentar montar wa.me
        const digits = link.replace(/\D/g, '');
        if (digits.length >= 10) {
          let phone = digits;
          if (!phone.startsWith('55')) phone = `55${phone}`;
          if (phone.length === 12) {
            const ddd = phone.substring(2, 4);
            const num = phone.substring(4);
            if (/^[6-9]/.test(num)) phone = `55${ddd}9${num}`;
          }
          const fixedLink = `https://wa.me/${phone}`;
          report.wa_normalized.push({
            id: job.id,
            title: job.title,
            company: job.company,
            original: link,
            fixed: fixedLink,
            issue: 'numero_solto_convertido'
          });

          if (fix) {
            await base44.asServiceRole.entities.Job.update(job.id, {
              application_link: fixedLink,
              last_validated_at: new Date().toISOString(),
              validation_agent: 'audit_system'
            });
          }
        } else {
          report.broken_links.push({
            id: job.id,
            title: job.title,
            company: job.company,
            link,
            issue: 'link_invalido'
          });
        }
        continue;
      }

      report.ok_links++;
    }

    report.fixed_links = fix ? report.wa_normalized : [];

    console.log(`✅ Auditoria concluída: ${report.ok_links} ok, ${report.wa_normalized.length} wa.me corrigidos, ${report.broken_links.length} quebrados`);

    return Response.json({
      success: true,
      fix_applied: fix,
      report
    });

  } catch (error) {
    console.error('Erro em auditJobLinks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});