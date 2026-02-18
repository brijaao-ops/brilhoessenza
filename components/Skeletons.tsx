
import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/5 rounded-2xl ${className}`} />
);

export const ProductCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-[#15140b] p-4 rounded-[2rem] border border-gray-100 dark:border-[#222115] flex flex-col gap-4">
        <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[1.5rem] animate-pulse relative overflow-hidden">

        </div>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex justify-between items-center mt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="size-10 rounded-full" />
        </div>
    </div>
);

export const ProductDetailsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
        <div className="bg-gray-100 dark:bg-white/5 aspect-square rounded-[2.5rem] animate-pulse" />
        <div className="flex flex-col gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-4 my-4">
                <Skeleton className="h-12 w-32 rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
    </div>
);
