export const isPrivateUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  } catch {
    return false;
  }
};
