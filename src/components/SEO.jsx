import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({ title, description, image, url }) {
  const defaultTitle = 'Artchiv\' - La plateforme des étudiants';
  const defaultDescription = 'Découvrez les meilleurs projets des étudiants en design et création.';
  const defaultImage = 'https://artchiv.fr/archiv_logo_condesed.webp'; // Ou toute autre image par défaut
  const siteUrl = 'https://artchiv.fr';

  const seo = {
    title: title ? `${title} | Artchiv'` : defaultTitle,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: url ? `${siteUrl}${url}` : siteUrl,
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
