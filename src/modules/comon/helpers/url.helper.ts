export const cleanUrl = (value: string | null | undefined): string => {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.origin === 'null') return value;
    const hostname = url.hostname.replace(/^www\./, '');
    const port = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${hostname}${port}`;
  } catch {
    return value;
  }
};

export const cleanProtocol = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/^https?:\/\//, '');
};
