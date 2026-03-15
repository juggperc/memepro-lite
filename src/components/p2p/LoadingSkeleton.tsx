/**
 * Loading Skeleton Components
 *
 * Reusable skeleton components for loading states across the P2P casino.
 * Provides better UX than empty states or spinners.
 */

export function LobbyCardSkeleton() {
    return (
        <div className="p-4 bg-[#0d0d0d] border border-[#222] rounded-xl animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-[#1a1a1a] rounded w-32"></div>
                <div className="h-6 w-6 bg-[#1a1a1a] rounded-full"></div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-[#1a1a1a] rounded w-24"></div>
                <div className="h-8 bg-[#1a1a1a] rounded w-full"></div>
            </div>
        </div>
    );
}

export function LobbyGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <LobbyCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="p-4 bg-[#0d0d0d] border border-[#222] rounded-xl animate-pulse">
            <div className="h-3 bg-[#1a1a1a] rounded w-20 mb-2"></div>
            <div className="h-8 bg-[#1a1a1a] rounded w-32"></div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3">
                <div className="h-4 bg-[#1a1a1a] rounded w-32"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-4 bg-[#1a1a1a] rounded w-24"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-6 bg-[#1a1a1a] rounded w-16"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-4 bg-[#1a1a1a] rounded w-20"></div>
            </td>
            <td className="px-4 py-3 text-center">
                <div className="h-6 bg-[#1a1a1a] rounded w-20 mx-auto"></div>
            </td>
            <td className="px-4 py-3 text-center">
                <div className="h-4 bg-[#1a1a1a] rounded w-12 mx-auto"></div>
            </td>
        </tr>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-[#0d0d0d] border border-[#222] rounded-xl overflow-hidden">
            <table className="w-full">
                <thead className="bg-[#0a0a0a] border-b border-[#222]">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <div className="h-3 bg-[#1a1a1a] rounded w-16 animate-pulse"></div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="h-3 bg-[#1a1a1a] rounded w-20 animate-pulse"></div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="h-3 bg-[#1a1a1a] rounded w-12 animate-pulse"></div>
                        </th>
                        <th className="px-4 py-3 text-right">
                            <div className="h-3 bg-[#1a1a1a] rounded w-16 ml-auto animate-pulse"></div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="h-3 bg-[#1a1a1a] rounded w-14 mx-auto animate-pulse"></div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="h-3 bg-[#1a1a1a] rounded w-20 mx-auto animate-pulse"></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function GameInfoSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-[#1a1a1a] rounded w-48"></div>
            <div className="h-4 bg-[#1a1a1a] rounded w-full"></div>
            <div className="h-4 bg-[#1a1a1a] rounded w-3/4"></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-[#1a1a1a] rounded"></div>
                <div className="h-12 bg-[#1a1a1a] rounded"></div>
            </div>
        </div>
    );
}

export function SpinnerOverlay({ message }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mb-4"></div>
                {message && (
                    <p className="text-white text-lg font-medium">{message}</p>
                )}
            </div>
        </div>
    );
}

export function InlineSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4'
    };

    return (
        <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-emerald-500 border-t-transparent`} />
    );
}

export function ShimmerEffect() {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
    );
}
