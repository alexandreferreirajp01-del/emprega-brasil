import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BASE_URL = 'https://vagasabertaspb.com.br';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/Jobs', priority: '0.9', changefreq: 'hourly' },
  { url: '/News', priority: '0.8', changefreq: 'daily' },
  { url: '/Blog', priority: '0.7', changefreq: 'daily' },
  { url: '/Groups', priority: '0.7', changefreq: 'weekly' },
  { url: '/Feed', priority: '0.6', changefreq: 'daily' },
  { url: '/About', priority: '0.5', changefreq: 'monthly' },
  { url: '/Contact', priority: '0.5', changefreq: 'monthly' },
  { url: '/FAQ', priority: '0.5', changefreq: 'monthly' },
  { url: '/Subscription', priority: '0.6', changefreq: 'weekly' },
  { url: '/GeradorCurriculo', priority: '0.6', changefreq: 'weekly' },
  { url: '/Privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/Terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/Cookies', priority: '0.3', changefreq: 'yearly' },
  { url: '/Security', priority: '0.3', changefreq: 'yearly' },
  { url: '/LGPD', priority: '0.3', changefreq: 'yearly' },
  { url: '/Advertise', priority: '0.4', changefreq: 'monthly' },
  { url: '/Parcerias', priority: '0.4', changefreq: 'monthly' },
  { url: '/Careers', priority: '0.4', changefreq: 'monthly' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar vagas ativas, notícias e blog em paralelo
    const [jobs, news, blogPosts] = await Promise.all([
      base44.asServiceRole.entities.Job.filter({ status: 'ativa' }, '-created_date', 2000),
      base44.asServiceRole.entities.News.filter({ status: 'published' }, '-created_date', 500),
      base44.asServiceRole.entities.BlogPost.filter({ status: 'published' }, '-created_date', 500).catch(() => []),
    ]);

    const now = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

    // Páginas estáticas
    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Páginas de vagas individuais
    for (const job of jobs) {
      const lastmod = job.updated_date
        ? new Date(job.updated_date).toISOString().split('T')[0]
        : now;
      xml += `  <url>
    <loc>${BASE_URL}/JobDetail?id=${job.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Páginas de notícias individuais
    for (const item of news) {
      const lastmod = item.updated_date
        ? new Date(item.updated_date).toISOString().split('T')[0]
        : now;
      xml += `  <url>
    <loc>${BASE_URL}/NewsDetail?id=${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(`Erro: ${error.message}`, { status: 500 });
  }
});