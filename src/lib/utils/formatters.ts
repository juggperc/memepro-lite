/**
 * Shared formatting utilities
 */

export function formatCompact(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
}

export function formatPrice(price: number): string {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price >= 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 0.0001) return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return price.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function formatAge(createdAt: number): string {
    const now = Date.now();
    const minutes = Math.floor((now - createdAt) / (1000 * 60));
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export function formatVolume(vol: number): string {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    return `$${vol.toLocaleString()}`;
}

export function formatPercent(value: number, includeSign = true): string {
    const sign = includeSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

export function truncateAddress(address: string, chars = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
