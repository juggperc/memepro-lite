'use client';

/**
 * Custom SVG illustrations for empty states
 */

export function EmptyTokensIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer ring */}
            <circle cx="60" cy="60" r="50" stroke="#222" strokeWidth="2" strokeDasharray="8 4" />

            {/* Inner circle */}
            <circle cx="60" cy="60" r="30" fill="#111" stroke="#1a1a1a" strokeWidth="2" />

            {/* Lightning bolt */}
            <path
                d="M65 40L50 62H58L55 80L70 55H62L65 40Z"
                fill="#333"
                stroke="#444"
                strokeWidth="1"
            />

            {/* Scan lines */}
            <g opacity="0.3">
                <line x1="20" y1="60" x2="30" y2="60" stroke="#444" strokeWidth="1" />
                <line x1="90" y1="60" x2="100" y2="60" stroke="#444" strokeWidth="1" />
                <line x1="60" y1="20" x2="60" y2="30" stroke="#444" strokeWidth="1" />
                <line x1="60" y1="90" x2="60" y2="100" stroke="#444" strokeWidth="1" />
            </g>
        </svg>
    );
}

export function NoResultsIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Magnifying glass */}
            <circle cx="50" cy="50" r="25" stroke="#333" strokeWidth="3" fill="#0a0a0a" />
            <line x1="68" y1="68" x2="90" y2="90" stroke="#333" strokeWidth="4" strokeLinecap="round" />

            {/* X inside */}
            <path d="M40 40L60 60M60 40L40 60" stroke="#444" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function WalletIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Wallet body */}
            <rect x="20" y="35" width="80" height="50" rx="4" fill="#111" stroke="#333" strokeWidth="2" />

            {/* Wallet flap */}
            <path d="M20 45C20 41.6863 22.6863 39 26 39H80C80 39 75 55 50 55C25 55 20 45 20 45Z" fill="#1a1a1a" stroke="#333" strokeWidth="1" />

            {/* Card slot */}
            <rect x="70" y="50" width="20" height="15" rx="2" fill="#0a0a0a" stroke="#333" strokeWidth="1" />
            <circle cx="80" cy="57.5" r="3" fill="#333" />
        </svg>
    );
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#222"
                strokeWidth="3"
            />
            <path
                d="M12 2C6.47715 2 2 6.47715 2 12"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}
