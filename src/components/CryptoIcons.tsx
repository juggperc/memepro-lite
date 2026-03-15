'use client';

// Professional SVG crypto icons
export function BitcoinIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#F7931A" />
            <path
                d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.7-.2-1-.2v-.1l-2.3-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .2.1h-.2l-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.8.5 4.8.3 5.7-2.2.7-2-.1-3.1-1.5-3.9 1-.2 1.8-.9 2-2.3zm-3.6 5.1c-.5 2-3.9.9-5 .6l.9-3.6c1.1.3 4.6.8 4.1 3zm.5-5.1c-.5 1.8-3.3.9-4.2.7l.8-3.2c.9.2 3.9.7 3.4 2.5z"
                fill="white"
            />
        </svg>
    );
}

export function EthereumIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#627EEA" />
            <path d="M16 4v8.9l7.5 3.3L16 4z" fill="white" fillOpacity="0.6" />
            <path d="M16 4l-7.5 12.2 7.5-3.3V4z" fill="white" />
            <path d="M16 21.9v6.1l7.5-10.4-7.5 4.3z" fill="white" fillOpacity="0.6" />
            <path d="M16 28v-6.1l-7.5-4.3L16 28z" fill="white" />
            <path d="M16 20.4l7.5-4.3-7.5-3.3v7.6z" fill="white" fillOpacity="0.2" />
            <path d="M8.5 16.1l7.5 4.3v-7.6l-7.5 3.3z" fill="white" fillOpacity="0.6" />
        </svg>
    );
}

export function SolanaIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#solana-gradient)" />
            <path
                d="M9.5 19.8c.1-.1.3-.2.5-.2h13.3c.3 0 .4.3.2.5l-2.6 2.6c-.1.1-.3.2-.5.2H7.1c-.3 0-.4-.3-.2-.5l2.6-2.6zM9.5 9.2c.1-.1.3-.2.5-.2h13.3c.3 0 .4.3.2.5l-2.6 2.6c-.1.1-.3.2-.5.2H7.1c-.3 0-.4-.3-.2-.5l2.6-2.6zM20.4 14.5c-.1-.1-.3-.2-.5-.2H6.6c-.3 0-.4.3-.2.5l2.6 2.6c.1.1.3.2.5.2h13.3c.3 0 .4-.3.2-.5l-2.6-2.6z"
                fill="white"
            />
            <defs>
                <linearGradient id="solana-gradient" x1="0" y1="32" x2="32" y2="0">
                    <stop stopColor="#9945FF" />
                    <stop offset="0.5" stopColor="#14F195" />
                    <stop offset="1" stopColor="#00D1FF" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function XRPIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#23292F" />
            <path
                d="M10.6 8h2.7l4.7 4.7L22.7 8h2.7l-6.1 6.1L22.7 8H10.6l8.4 8.4 4.7 4.7h-2.7l-4.7-4.7-4.7 4.7H9.3l6.1-6.1-4.8-4.7V8z"
                fill="white"
            />
        </svg>
    );
}

export function DogecoinIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#C2A633" />
            <path
                d="M13.7 8.5h4.4c3.9 0 7 3.1 7 7s-3.1 7-7 7h-4.4v-14zm2.5 11.9h1.8c2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5h-1.8v9z"
                fill="white"
            />
            <rect x="10" y="14.5" width="8" height="2.5" fill="white" />
        </svg>
    );
}

// Icon map for easy access
export const CryptoIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BTC: BitcoinIcon,
    ETH: EthereumIcon,
    SOL: SolanaIcon,
    XRP: XRPIcon,
    DOGE: DogecoinIcon,
};

export function getCryptoIcon(symbol: string) {
    return CryptoIconMap[symbol] || null;
}
