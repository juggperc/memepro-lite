// SVG Icons for P2P Games
// Using Heroicons and custom icons

export function CoinIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v12M9 9h6M9 15h6" />
        </svg>
    );
}

export function DiceIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
            <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    );
}

export function CardsIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="3" width="12" height="16" rx="1" />
            <path d="M9 7h6M9 11h6M9 15h3" />
            <rect x="4" y="5" width="12" height="16" rx="1" opacity="0.3" />
        </svg>
    );
}

export function LockIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 118 0v4" />
        </svg>
    );
}

export function BotIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="8" width="14" height="12" rx="2" />
            <circle cx="9" cy="13" r="1.5" fill="currentColor" />
            <circle cx="15" cy="13" r="1.5" fill="currentColor" />
            <path d="M10 17h4" />
            <path d="M12 4v4" />
            <circle cx="12" cy="3" r="1" fill="currentColor" />
            <path d="M3 12h2M19 12h2" />
        </svg>
    );
}

export function UserIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    );
}

export function SwordsIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l7 7M4 4l3 0M4 4l0 3" />
            <path d="M20 4l-7 7M20 4l-3 0M20 4l0 3" />
            <path d="M11 13l-7 7M4 20l3-1 1-3" />
            <path d="M13 13l7 7M20 20l-3-1-1-3" />
        </svg>
    );
}

export function CrownIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 17h16v2H4v-2zM12 4l3 5 5-2-2 8H6l-2-8 5 2 3-5z" />
        </svg>
    );
}

export function HashIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4l-2 16M16 4l-2 16M4 9h16M4 15h16" />
        </svg>
    );
}

export function TrophyIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 01-10 0V4z" />
            <path d="M7 4H5a2 2 0 00-2 2v1a3 3 0 003 3h1M17 4h2a2 2 0 012 2v1a3 3 0 01-3 3h-1" />
        </svg>
    );
}

export function XCircleIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
    );
}

export function WalletIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="6" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
            <circle cx="16" cy="14" r="1" fill="currentColor" />
        </svg>
    );
}
