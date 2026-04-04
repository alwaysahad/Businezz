import type { User } from '@supabase/supabase-js';
import md5 from 'md5';

/** Gravatar for the account email (often matches Gmail / Google profile picture if linked). */
export function gravatarUrl(email: string, size = 128): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Best display URL: custom upload → OAuth (Google picture) → Gravatar.
 */
export function getAvatarUrlFromUser(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown>;

  if (typeof meta.profile_avatar === 'string' && meta.profile_avatar.length > 0) {
    return meta.profile_avatar;
  }

  if (typeof meta.picture === 'string' && meta.picture.length > 0) {
    return meta.picture;
  }
  if (typeof meta.avatar_url === 'string' && meta.avatar_url.length > 0) {
    return meta.avatar_url;
  }

  const id = user.identities?.[0]?.identity_data as Record<string, unknown> | undefined;
  if (id?.picture && typeof id.picture === 'string') return id.picture;
  if (id?.avatar_url && typeof id.avatar_url === 'string') return id.avatar_url;

  if (user.email) return gravatarUrl(user.email);
  return null;
}

export function getEmailInitials(email: string): string {
  const local = email.split('@')[0] || '?';
  const cleaned = local.replace(/[^a-zA-Z0-9]/g, '');
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local.slice(0, 1).toUpperCase() || '?';
}
