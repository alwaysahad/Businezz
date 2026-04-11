import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-midnight-700/50 rounded-xl ${className}`}
            {...props}
        />
    );
}
