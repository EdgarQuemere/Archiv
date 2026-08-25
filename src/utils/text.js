export const decodeHTMLEntities = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  let decoded = str;
  for (let i = 0; i < 2; i++) {
    if (!decoded.includes('&')) break;
    decoded = decoded
      .replace(/&#x27;/gi, "'")
      .replace(/&#39;/gi, "'")
      .replace(/&#x2F;/gi, "/")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&");
  }
  return decoded;
};
