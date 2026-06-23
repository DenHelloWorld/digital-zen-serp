const BLOCKED_DOMAINS = new Set([
  'youtube.com',
  'www.youtube.com',
  'google.com',
  'www.google.com',
  'google.ru',
  'www.google.ru',
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'netflix.com',
  'www.netflix.com',
  'linkedin.com',
  'www.linkedin.com',
  'tiktok.com',
  'www.tiktok.com',
  'reddit.com',
  'www.reddit.com',
  'amazon.com',
  'www.amazon.com',
]);

export const isPageSpeedBlocked = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return BLOCKED_DOMAINS.has(hostname);
  } catch {
    return false;
  }
};
