// Simple sound manager for P2P games

type SoundName = 'flip' | 'land' | 'win' | 'lose' | 'join' | 'click';

const soundUrls: Record<SoundName, string> = {
    flip: '/sounds/flip.mp3',
    land: '/sounds/land.mp3',
    win: '/sounds/win.mp3',
    lose: '/sounds/lose.mp3',
    join: '/sounds/join.mp3',
    click: '/sounds/click.mp3',
};

const audioCache: Map<SoundName, HTMLAudioElement> = new Map();

// Preload sounds
export function preloadSounds() {
    if (typeof window === 'undefined') return;

    Object.entries(soundUrls).forEach(([name, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioCache.set(name as SoundName, audio);
    });
}

// Play a sound
export function playSound(name: SoundName, volume = 0.5) {
    if (typeof window === 'undefined') return;

    let audio = audioCache.get(name);

    if (!audio) {
        audio = new Audio(soundUrls[name]);
        audioCache.set(name, audio);
    }

    // Clone for overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = volume;
    clone.play().catch(() => {
        // Ignore autoplay errors
    });
}

// Initialize on first user interaction
let initialized = false;
export function initSounds() {
    if (initialized) return;
    initialized = true;
    preloadSounds();
}
