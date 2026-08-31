import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getFileUrl } from '../utils/url';

export function SEO({ title, description, image, url }) {
  const defaultTitle = "Artchiv' - La plateforme qui réunit les Books et Mémoires des étudiants en design";
  const defaultDescription = 'Découvrez les books, mémoires et projets de diplôme des étudiants en écoles de design. Inspirez-vous, partagez vos créations et faites briller votre travail.';
  const defaultImage = 'https://artchiv.fr/archiv_logo_condesed.webp';
  const siteUrl = 'https://artchiv.fr';

  let resolvedImage = defaultImage;
  if (image) {
    const fileUrl = getFileUrl(image);
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      resolvedImage = fileUrl;
    } else {
      resolvedImage = `${siteUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }
  }

  const seo = {
    title: title ? `${title} | Artchiv'` : defaultTitle,
    description: description || defaultDescription,
    image: resolvedImage,
    url: url ? `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}` : siteUrl,
  };

  return (
    <Helmet>
      {/* Balises standards */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />

      {/* OpenGraph (Facebook, LinkedIn, etc) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Helmet>
  );
}

export default SEO;
