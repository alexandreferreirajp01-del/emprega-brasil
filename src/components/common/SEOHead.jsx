import { Helmet } from 'react-helmet';

const SITE_NAME = 'Vagas Abertas PB';
const BASE_URL = 'https://vagasabertaspb.com.br';
const DEFAULT_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png';
const DEFAULT_DESCRIPTION = 'Encontre vagas de emprego em João Pessoa, Campina Grande e toda a Paraíba. Vagas de CLT, estágio, home office e muito mais. Cadastre-se grátis!';

export default function SEOHead({
  title,
  description,
  keywords,
  url,
  image,
  type = 'website',
  job = null,
  noindex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Empregos em João Pessoa, Campina Grande e Paraíba`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const finalImage = image || DEFAULT_IMAGE;

  // JSON-LD para Vagas de Emprego (JobPosting Schema)
  const jobJsonLd = job ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': job.title,
    'description': job.description || job.title,
    'datePosted': job.published_at || job.created_date,
    'validThrough': job.expiration_date || undefined,
    'employmentType': mapJobType(job.job_type),
    'hiringOrganization': {
      '@type': 'Organization',
      'name': job.company || 'Empresa Confidencial',
      'sameAs': BASE_URL,
    },
    'jobLocation': job.work_mode === 'Remoto' ? {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'BR',
      }
    } : {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': job.city || 'Paraíba',
        'addressRegion': job.state || 'PB',
        'addressCountry': 'BR',
      }
    },
    'applicantLocationRequirements': job.work_mode === 'Remoto' ? {
      '@type': 'Country',
      'name': 'Brasil'
    } : undefined,
    'jobLocationType': job.work_mode === 'Remoto' ? 'TELECOMMUTE' : undefined,
    ...(job.salary_range ? {
      'baseSalary': {
        '@type': 'MonetaryAmount',
        'currency': 'BRL',
        'value': {
          '@type': 'QuantitativeValue',
          'value': job.salary_range,
          'unitText': 'MONTH',
        }
      }
    } : {}),
    'url': `${BASE_URL}/JobDetail?id=${job.id}`,
    'directApply': true,
  } : null;

  // JSON-LD para listagem de empregos (BreadcrumbList)
  const breadcrumbJsonLd = url ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Início',
        'item': BASE_URL,
      },
      ...(job ? [
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Vagas',
          'item': `${BASE_URL}/Jobs`,
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': job.title,
          'item': `${BASE_URL}/JobDetail?id=${job.id}`,
        }
      ] : [
        {
          '@type': 'ListItem',
          'position': 2,
          'name': title || 'Página',
          'item': fullUrl,
        }
      ])
    ]
  } : null;

  return (
    <Helmet>
      {/* Básico */}
      <html lang="pt-BR" />
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />

      {/* Open Graph */}
      <meta property="og:type" content={job ? 'article' : type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* JSON-LD */}
      {jobJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jobJsonLd)}
        </script>
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}
    </Helmet>
  );
}

function mapJobType(jobType) {
  const map = {
    'CLT': 'FULL_TIME',
    'PJ': 'CONTRACTOR',
    'Estágio': 'INTERN',
    'Freelancer': 'FREELANCE',
    'Temporário': 'TEMPORARY',
    'Jovem Aprendiz': 'PART_TIME',
    'Home Office': 'FULL_TIME',
  };
  return map[jobType] || 'OTHER';
}