import type {
  MetaTag,
  MetaTagStatus,
  OgBlockStatus,
  ValidationMessage,
} from '../models/og-data.model';

const VALID_OG_TYPES = new Set([
  'website',
  'article',
  'book',
  'profile',
  'music.song',
  'music.album',
  'music.playlist',
  'music.radio_station',
  'video.movie',
  'video.episode',
  'video.tv_show',
  'video.other',
]);

const VALID_TWITTER_CARDS = new Set(['summary', 'summary_large_image', 'app', 'player']);

function get(tags: MetaTag[], key: string): MetaTag | undefined {
  return tags.find(t => t.key === key);
}

export function validateMetaTags(tags: MetaTag[]): MetaTag[] {
  const result = tags.map(t => ({ ...t }));

  const set = (key: string, status: MetaTagStatus, msg?: ValidationMessage) => {
    const tag = result.find(t => t.key === key);
    if (tag) {
      tag.status = status;
      if (msg) tag.statusMessage = msg;
    } else {
      result.push({ key, value: null, group: groupFor(key), status, statusMessage: msg });
    }
  };

  const m = (key: string, params?: Record<string, unknown>): ValidationMessage => ({ key, params });

  // og:title
  const ogTitle = get(result, 'og:title');
  if (!ogTitle || !ogTitle.value) {
    set('og:title', 'missing');
  } else if (ogTitle.value.length > 70) {
    set('og:title', 'warning', m('social.og.msg.title_too_long'));
  }

  // og:description
  const ogDesc = get(result, 'og:description');
  if (!ogDesc || !ogDesc.value) {
    set('og:description', 'missing');
  } else if (ogDesc.value.length > 200) {
    set('og:description', 'warning', m('social.og.msg.desc_too_long'));
  } else if (ogDesc.value.length < 50) {
    set('og:description', 'warning', m('social.og.msg.desc_too_short'));
  }

  // og:image
  const ogImage = get(result, 'og:image');
  if (!ogImage || !ogImage.value) {
    set('og:image', 'missing');
  }

  // og:url
  const ogUrl = get(result, 'og:url');
  if (!ogUrl || !ogUrl.value) {
    set('og:url', 'warning', m('social.og.msg.url_missing'));
  } else {
    const canonical = get(result, 'canonical');
    if (canonical?.value && canonical.value !== ogUrl.value) {
      set('og:url', 'warning', m('social.og.msg.url_mismatch'));
    }
  }

  // og:type
  const ogType = get(result, 'og:type');
  if (!ogType || !ogType.value) {
    set('og:type', 'warning', m('social.og.msg.type_missing'));
  } else if (!VALID_OG_TYPES.has(ogType.value.toLowerCase())) {
    set('og:type', 'invalid', m('social.og.msg.type_invalid', { value: ogType.value }));
  }

  // twitter:card
  const twitterCard = get(result, 'twitter:card');
  if (!twitterCard || !twitterCard.value) {
    set('twitter:card', 'warning', m('social.og.msg.twitter_card_missing'));
  } else if (!VALID_TWITTER_CARDS.has(twitterCard.value.toLowerCase())) {
    set(
      'twitter:card',
      'invalid',
      m('social.og.msg.twitter_card_invalid', { value: twitterCard.value })
    );
  }

  // twitter:image fallback
  const twitterImage = get(result, 'twitter:image');
  if ((!twitterImage || !twitterImage.value) && ogImage?.value) {
    result.push({
      key: 'twitter:image',
      value: null,
      group: 'twitter',
      status: 'ok',
      statusMessage: m('social.og.msg.twitter_image_fallback'),
    });
  }

  // twitter:site / twitter:creator
  for (const key of ['twitter:site', 'twitter:creator']) {
    const tag = get(result, key);
    if (tag?.value && !tag.value.startsWith('@')) {
      set(key, 'warning', m('social.og.msg.handle_at'));
    }
  }

  return result;
}

export function computeOgBlockStatus(tags: MetaTag[]): OgBlockStatus {
  const title = tags.find(t => t.key === 'og:title');
  if (!title?.value || title.status === 'invalid') return 'broken';
  const hasIssue = tags.some(
    t => t.status === 'missing' || t.status === 'warning' || t.status === 'invalid'
  );
  if (hasIssue) return 'needs-improvement';
  return 'ready';
}

function groupFor(key: string): import('../models/og-data.model').MetaTagGroup {
  if (key.startsWith('og:')) return 'og';
  if (key.startsWith('twitter:')) return 'twitter';
  if (key === 'fb:app_id' || key === 'fb:pages') return 'facebook';
  if (key.startsWith('article:')) return 'article';
  return 'basic';
}
