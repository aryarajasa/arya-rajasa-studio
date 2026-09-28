import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  breadcrumbs?: BreadcrumbItem[];
  schema?: Record<string, any>;
}

const DEFAULT_TITLE = 'arya rajasa studio — brand designer';
const DEFAULT_DESCRIPTION =
  'I design unforgettable brand & visual identities for your business — so you stand out in a crowded market. Brand designer based in Canggu, Bali.';
const DEFAULT_KEYWORDS =
  'Arya Rajasa, Arya Rajasa Studio, brand designer, visual identity, brand identity, logo design, Canggu, Bali brand designer, graphic design, packaging design, editorial design, art direction, Bali design studio';
const SITE_NAME = 'arya rajasa studio';
const DEFAULT_SITE_DOMAIN = 'https://aryarajasa.github.io/arya-rajasa-studio';

const getBaseDomain = () => {
  if (import.meta.env.VITE_SITE_URL) return import.meta.env.VITE_SITE_URL.replace(/\/$/, '');
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    const isGhPages = window.location.hostname.endsWith('github.io');
    return isGhPages
      ? `${window.location.origin}/arya-rajasa-studio`
      : window.location.origin.replace(/\/$/, '');
  }
  return DEFAULT_SITE_DOMAIN;
};

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image,
  type = 'website',
  breadcrumbs,
  schema,
}: SEOProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
  const baseDomain = getBaseDomain();
  const defaultImage = `${baseDomain}/og-image.png`;
  
  // Clean canonical URL without trailing slash issues (except root)
  const path = location.pathname.startsWith('/') ? location.pathname : `/${location.pathname}`;
  const canonicalUrl = `${baseDomain}${path === '/' ? '/' : path}`;
  
  const metaImage = image?.startsWith('http')
    ? image
    : image
    ? `${baseDomain}${image.startsWith('/') ? '' : '/'}${image}`
    : defaultImage;

  useEffect(() => {
    // 1. Document Title
    document.title = fullTitle;

    // Helper to set/create meta tags
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', 'Arya Rajasa');
    setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:image', metaImage);
    setMetaTag('property', 'og:locale', 'en_US');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', metaImage);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // 6. Dynamic JSON-LD Structured Data
    const graph: any[] = [
      {
        '@type': 'WebSite',
        '@id': `${baseDomain}/#website`,
        url: `${baseDomain}/`,
        name: SITE_NAME,
        inLanguage: 'en-US',
      },
    ];

    if (breadcrumbs && breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url.startsWith('http') ? crumb.url : `${baseDomain}${crumb.url.startsWith('/') ? '' : '/'}${crumb.url}`,
        })),
      });
    }

    if (schema) {
      graph.push({
        ...schema,
        url: canonicalUrl,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: `${baseDomain}/`,
        },
      });
    }

    let scriptEl = document.getElementById('dynamic-seo-ld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'dynamic-seo-ld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });
  }, [fullTitle, description, keywords, canonicalUrl, metaImage, type, breadcrumbs, schema]);

  return null;
}
