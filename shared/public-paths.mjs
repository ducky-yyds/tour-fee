export function normalizeBasePath(value = '/') {
  const input = String(value || '/');
  if (/[\\?#:]/.test(input) || input.split('/').some(part => part === '.' || part === '..')) throw new Error('部署 base 必须是站内绝对路径，例如 /tour-fee/');
  const parts = input.split('/').filter(Boolean);
  return parts.length ? `/${parts.join('/')}/` : '/';
}

export function publicAssetUrl(path, base = '/') {
  if (typeof path !== 'string' || !path || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
  const normalized = normalizeBasePath(base);
  if (path.startsWith(normalized)) return path;
  return normalized + path.replace(/^\/+/, '');
}
