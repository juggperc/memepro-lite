'use client';

/**
 * Skeleton loader component matching TokenCard layout
 */
export function TokenCardSkeleton() {
    return (
        <div className="w-full p-4 bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse">
            {/* Top Row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Token Icon Skeleton */}
                    <div className="w-10 h-10 bg-[#1a1a1a] rounded-sm shimmer" />

                    {/* Name & Symbol Skeleton */}
                    <div>
                        <div className="h-4 w-16 bg-[#1a1a1a] rounded mb-1 shimmer" />
                        <div className="h-3 w-24 bg-[#151515] rounded shimmer" />
                    </div>
                </div>

                {/* Score Skeleton */}
                <div className="h-5 w-8 bg-[#1a1a1a] rounded shimmer" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-3 gap-4 mb-3">
                {[1, 2, 3].map(i => (
                    <div key={i}>
                        <div className="h-3 w-6 bg-[#151515] rounded mb-1 shimmer" />
                        <div className="h-4 w-12 bg-[#1a1a1a] rounded shimmer" />
                    </div>
                ))}
            </div>

            {/* Progress Bar Skeleton */}
            <div className="mb-3">
                <div className="flex justify-between mb-1">
                    <div className="h-2 w-12 bg-[#151515] rounded shimmer" />
                    <div className="h-2 w-8 bg-[#151515] rounded shimmer" />
                </div>
                <div className="h-0.5 bg-[#1a1a1a] rounded shimmer" />
            </div>

            {/* Bottom Row Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-8 bg-[#151515] rounded shimmer" />
                    <div className="h-2 w-10 bg-[#151515] rounded shimmer" />
                </div>
                <div className="h-2 w-12 bg-[#151515] rounded shimmer" />
            </div>
        </div>
    );
}

/**
 * Multiple skeleton cards for loading state
 */
export function TokenColumnSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="divide-y divide-[#1a1a1a]">
            {Array.from({ length: count }).map((_, i) => (
                <TokenCardSkeleton key={i} />
            ))}
        </div>
    );
}
