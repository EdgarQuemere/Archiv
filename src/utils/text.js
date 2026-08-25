export const decodeHTMLEntities = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  let decoded = str;
  let prev;
  do {
    prev = decoded;
    decoded = decoded
      .replace(/&amp;/gi, '&')
      .replace(/&#x27;/gi, "'")
      .replace(/&#39;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  } while (decoded !== prev && decoded.includes('&'));
  return decoded;
};
