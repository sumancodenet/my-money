import { useEffect } from 'react';

const SITE_NAME = 'My Money';
const SITE_URL = 'https://my-money-alpha-one.vercel.app';
const DEFAULT_IMAGE = '/icon-512.png';

function upsertMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function useSEO({
  title,
  description,
  keywords,
  robots = 'index, follow',
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Personal Finance`;
    document.title = fullTitle;

    upsertMeta('description', description);
    upsertMeta('keywords', keywords);
    upsertMeta('robots', robots);

    const url = canonical ? `${SITE_URL}${canonical}` : (typeof window !== 'undefined' ? window.location.href : SITE_URL);
    upsertLink('canonical', url);

    // Open Graph
    upsertMeta('og:title', fullTitle, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:type', type, 'property');
    upsertMeta('og:url', url, 'property');
    upsertMeta('og:image', image.startsWith('http') ? image : `${SITE_URL}${image}`, 'property');
    upsertMeta('og:site_name', SITE_NAME, 'property');
    upsertMeta('og:locale', 'en_IN', 'property');

    // Twitter
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', fullTitle);
    upsertMeta('twitter:description', description);
    upsertMeta('twitter:image', image.startsWith('http') ? image : `${SITE_URL}${image}`);

    // JSON-LD
    const existing = document.getElementById('seo-jsonld');
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById('seo-jsonld');
      if (s) s.remove();
    };
  }, [title, description, keywords, robots, canonical, image, type, jsonLd]);
}
