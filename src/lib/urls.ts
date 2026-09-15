import { site } from '../config/site';

export const siteBase = 'base' in site && typeof site.base === 'string' ? site.base.replace(/\/$/, '') : '';

export function withBase(path = '/', configuredBase = siteBase) {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const base = configuredBase.replace(/\/$/, '');
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export function absolute(path: string) {
  return new URL(withBase(path), site.url).href;
}

export function segment(value: string) {
  return encodeURIComponent(value);
}
