'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfettiPiece {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
    size: number;
    life: number;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Canvas-based confetti explosion effect
 */
export function Confetti({
    active,
    duration = 3000,
    particleCount = 100
}: {
    active: boolean;
    duration?: number;
    particleCount?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const particlesRef = useRef<ConfettiPiece[]>([]);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create particles
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.7) * 20,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 8 + 4,
            life: 1,
        }));

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach(p => {
                // Update physics
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3; // Gravity
                p.rotation += p.rotationSpeed;
                p.life = 1 - progress;

                // Draw
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [active, duration, particleCount]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1000]"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
}

/**
 * Hook to trigger confetti
 */
export function useConfetti() {
    const [active, setActive] = useState(false);

    const fire = () => {
        setActive(true);
        setTimeout(() => setActive(false), 3000);
    };

    return { active, fire, ConfettiComponent: () => <Confetti active={active} /> };
}

