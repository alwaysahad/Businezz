import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getAvatarUrlFromUser, getEmailInitials } from '../utils/avatar';

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-base',
};

interface UserAvatarProps {
  user: User | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = user && !imgFailed ? getAvatarUrlFromUser(user) : null;
  const initials = user?.email ? getEmailInitials(user.email) : '?';

  useEffect(() => {
    setImgFailed(false);
  }, [user?.id, user?.user_metadata]);

  const dim = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ${dim} ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shrink-0 ${dim} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
