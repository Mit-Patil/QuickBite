export function cloudinaryResize(url, width, aspectRatio) {
  if (!url || !url.includes('/upload/')) return url;
  const crop = aspectRatio ? `,c_fill,ar_${aspectRatio},g_auto` : '';
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}${crop}/`);
}