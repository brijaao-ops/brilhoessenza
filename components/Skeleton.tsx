import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-white/5 rounded-2xl ${className}`}></div>
    );
};

export const ProductSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-4">
            <Skeleton className="aspect-square rounded-[2rem]" />
            <div className="space-y-2 px-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full mt-4" />
            </div>
        </div>
    );
};
