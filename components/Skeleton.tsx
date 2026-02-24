import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-white/5 rounded-2xl ${className}`}></div>
    );
};

export const ProductSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-4 w-full">
            <Skeleton className="aspect-square min-h-[250px] w-full rounded-[2.5rem]" />
            <div className="space-y-3 px-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full mt-4 rounded-xl" />
            </div>
        </div>
    );
};
