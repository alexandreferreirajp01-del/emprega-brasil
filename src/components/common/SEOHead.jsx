import { Helmet } from 'react-helmet';

const SITE_NAME = 'Vagas Abertas PB';
const BASE_URL = 'https://vagasabertaspb.com.br';
const DEFAULT_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692a4c2d5228a0792af288b2/95d6fd65b_222578-removebg-preview.png';
const DEFAULT_DESCRIPTION = 'Encontre vagas de emprego em João Pessoa, Campina Grande e toda a Paraíba. Vagas de CLT, estágio, home office e muito mais. Cadastre-se grátis!';

// Schema Organization global do site
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  'name': SITE_NAME,
  'url': BASE_URL,
  'logo': {
    '@type': 'ImageObject',
    'url': DEFAULT_IMAGE,
    'width': 512,
    'height': 512,
  },
  'description': DEFAULT_DESCRIPTION,
  'address': {
    '@type': 'PostalAddress',
    'addressLocality': 'João Pessoa',
    'addressRegion': 'PB',
    'addressCountry': 'BR',
  },
  'contactPoint': {
    '@type': 'ContactPoint',
    'telephone': '+55-83-99197-1320',
    'contactType': 'customer service',
    'availableLanguage': 'Portuguese',
  },
  'sameAs': [
    BASE_URL,
  ],
};

// Schema WebSite com SearchAction (sitelinks search box no Google)
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  'name': SITE_NAME,
  'url': BASE_URL,
  'description': DEFAULT_DESCRIPTION,
  'inLanguage': 'pt-BR',
  'publisher': { '@id': `${BASE_URL}/#organization` },
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': `${BASE_URL}/Jobs?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function SEOHead({
  title,
  description,
  keywords,
  url,
  image,
  type = 'website',
  job = null,
  newsArticle = null,
  blogPost = null,
  noindex = false,
  author = null,
  publishedAt = null,
  modifiedAt = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Empregos em João Pessoa, Campina Grande e Paraíba`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const finalImage = image || DEFAULT_IMAGE;

  const isArticle = !!(job || newsArticle || blogPost);
  const ogType = isArticle ? 'article' : type;

  // ---- JobPosting Schema ----
  const jobJsonLd = job ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': job.title,
    'description': (job.description || job.title) + (job.additional_info ? '\n\n' + job.additional_info : ''),
    'identifier': {
      '@type': 'PropertyValue',
      'name': job.company || SITE_NAME,
      'value': job.id,
    },
    'datePosted': job.published_at || job.created_date,
    'validThrough': job.expiration_date || undefined,
    'employmentType': mapJobType(job.job_type, job.contract_types),
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
        'streetAddress': job.neighborhood || undefined,
        'addressLocality': job.city || 'Paraíba',
        'addressRegion': job.state || 'PB',
        'postalCode': job.cep || undefined,
        'addressCountry': 'BR',
      }
    },
    'applicantLocationRequirements': job.work_mode === 'Remoto' ? {
      '@type': 'Country',
      'name': 'Brasil'
    } : undefined,
    'jobLocationType': job.work_mode === 'Remoto' ? 'TELECOMMUTE' : undefined,
    ...(job.work_mode === 'Híbrido' ? { 'jobLocationType': 'TELECOMMUTE' } : {}),
    ...(job.salary_range ? {
      'baseSalary': {
        '@type': 'MonetaryAmount',
        'currency': 'BRL',
        'value': {
          '@type': 'QuantitativeValue',
          'value': parseSalary(job.salary_range),
          'unitText': 'MONTH',
          'description': job.salary_range,
        }
      }
    } : {}),
    'url': `${BASE_URL}/JobDetail?id=${job.id}`,
    'directApply': !!(job.contact_whatsapp || job.contact_email || job.application_link),
    'jobBenefits': job.additional_info && !job.additional_info.startsWith('__HOME_OFFICE_LINKS__') ? job.additional_info.substring(0, 200) : undefined,
    ...(job.category ? { 'occupationalCategory': job.category } : {}),
    ...(job.job_function ? { 'responsibilities': job.job_function } : {}),
  } : null;

  // ---- NewsArticle Schema ----
  const newsJsonLd = newsArticle ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': fullUrl,
    'headline': newsArticle.title,
    'description': newsArticle.subtitle || finalDescription,
    'url': fullUrl,
    'datePublished': newsArticle.created_date,
    'dateModified': newsArticle.updated_date || newsArticle.created_date,
    'author': {
      '@type': 'Person',
      'name': newsArticle.author_name || 'Redação Vagas Abertas PB',
    },
    'publisher': { '@id': `${BASE_URL}/#organization` },
    'image': finalImage !== DEFAULT_IMAGE ? {
      '@type': 'ImageObject',
      'url': finalImage,
    } : { '@type': 'ImageObject', 'url': DEFAULT_IMAGE },
    'articleSection': newsArticle.category || 'Mercado de Trabalho',
    'inLanguage': 'pt-BR',
    'isAccessibleForFree': true,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
  } : null;

  // ---- BlogPosting Schema ----
  const blogJsonLd = blogPost ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': fullUrl,
    'headline': blogPost.title,
    'description': blogPost.subtitle || finalDescription,
    'url': fullUrl,
    'datePublished': blogPost.created_date,
    'dateModified': blogPost.updated_date || blogPost.created_date,
    'author': {
      '@type': 'Person',
      'name': blogPost.author_name || 'Redação Vagas Abertas PB',
    },
    'publisher': { '@id': `${BASE_URL}/#organization` },
    'image': finalImage !== DEFAULT_IMAGE ? {
      '@type': 'ImageObject',
      'url': finalImage,
    } : { '@type': 'ImageObject', 'url': DEFAULT_IMAGE },
    'articleSection': blogPost.category || 'Carreira',
    'inLanguage': 'pt-BR',
    'isAccessibleForFree': true,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
  } : null;

  // ---- BreadcrumbList Schema ----
  const breadcrumbItems = [
    { position: 1, name: 'Início', item: BASE_URL },
  ];
  if (job) {
    breadcrumbItems.push({ position: 2, name: 'Vagas', item: `${BASE_URL}/Jobs` });
    breadcrumbItems.push({ position: 3, name: job.title, item: `${BASE_URL}/JobDetail?id=${job.id}` });
  } else if (newsArticle) {
    breadcrumbItems.push({ position: 2, name: 'Notícias', item: `${BASE_URL}/News` });
    breadcrumbItems.push({ position: 3, name: newsArticle.title, item: fullUrl });
  } else if (blogPost) {
    breadcrumbItems.push({ position: 2, name: 'Blog', item: `${BASE_URL}/Blog` });
    breadcrumbItems.push({ position: 3, name: blogPost.title, item: fullUrl });
  } else if (url && url !== '/') {
    breadcrumbItems.push({ position: 2, name: title || 'Página', item: fullUrl });
  }

  const breadcrumbJsonLd = breadcrumbItems.length > 1 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems.map(item => ({
      '@type': 'ListItem',
      'position': item.position,
      'name': item.name,
      'item': item.item,
    })),
  } : null;

  // ---- WebPage Schema ----
  const webPageJsonLd = !job ? {
    '@context': 'https://schema.org',
    '@type': isArticle ? 'Article' : 'WebPage',
    '@id': fullUrl,
    'url': fullUrl,
    'name': fullTitle,
    'description': finalDescription,
    'isPartOf': { '@id': `${BASE_URL}/#website` },
    'inLanguage': 'pt-BR',
    ...(publishedAt ? { 'datePublished': publishedAt } : {}),
    ...(modifiedAt ? { 'dateModified': modifiedAt } : {}),
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
      <meta name="author" content={author || SITE_NAME} />
      <meta name="publisher" content={SITE_NAME} />
      <meta name="language" content="pt-BR" />
      <meta name="geo.region" content="BR-PB" />
      <meta name="geo.placename" content="João Pessoa, Paraíba" />
      <meta name="geo.position" content="-7.1195;-34.8450" />
      <meta name="ICBM" content="-7.1195, -34.8450" />

      {/* Article specific */}
      {isArticle && publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {isArticle && modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
      {isArticle && author && <meta property="article:author" content={author} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || SITE_NAME} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@vagasabertaspb" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={title || SITE_NAME} />

      {/* JSON-LD: Organization + WebSite (sempre presentes) */}
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>

      {/* JSON-LD: Conteúdo específico */}
      {jobJsonLd && <script type="application/ld+json">{JSON.stringify(jobJsonLd)}</script>}
      {newsJsonLd && <script type="application/ld+json">{JSON.stringify(newsJsonLd)}</script>}
      {blogJsonLd && <script type="application/ld+json">{JSON.stringify(blogJsonLd)}</script>}
      {breadcrumbJsonLd && <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>}
      {webPageJsonLd && <script type="application/ld+json">{JSON.stringify(webPageJsonLd)}</script>}
    </Helmet>
  );
}

function mapJobType(jobType, contractTypes) {
  const map = {
    'CLT': 'FULL_TIME',
    'PJ': 'CONTRACTOR',
    'Autônomo': 'CONTRACTOR',
    'Estágio': 'INTERN',
    'Freelancer': 'FREELANCE',
    'Temporário': 'TEMPORARY',
    'Jovem Aprendiz': 'PART_TIME',
    'Trainee': 'FULL_TIME',
    'Home Office': 'FULL_TIME',
    'Banco de Talentos': 'OTHER',
  };

  if (contractTypes && contractTypes.length > 0) {
    return contractTypes.map(t => map[t] || 'OTHER');
  }
  return map[jobType] || 'OTHER';
}

function parseSalary(salaryStr) {
  if (!salaryStr) return undefined;
  // Tenta extrair valor numérico (ex: "R$ 2.500,00" → 2500)
  const cleaned = salaryStr.replace(/[^\d,\.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  return isNaN(num) ? salaryStr : num;
}