import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
}

const DEFAULT_TITLE = 'arya rajasa studio — brand designer';
const DEFAULT_DESCRIPTION =
  'Minimalist brand design studio — unforgettable brand & visual identities for modern businesses.';
const SITE_NAME = 'arya rajasa studio';
const BASE_DOMAIN = 'https://aryarajasa.github.io/arya-rajasa-studio';

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  type = 'website',
}: SEOProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = `${BASE_DOMAIN}${location.pathname}`;
  const metaImage = image?.startsWith('http')
    ? image
    : image
    ? `${BASE_DOMAIN}${image.startsWith('/') ? '' : '/'}${image}`
    : `${BASE_DOMAIN}/favicon-512x512.png`;

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

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:image', metaImage);

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
  }, [fullTitle, description, canonicalUrl, metaImage, type]);

  return null;
}
