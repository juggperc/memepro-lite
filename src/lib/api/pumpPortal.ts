/**
 * PumpPortal WebSocket Client
 * 
 * Connects to PumpPortal's real-time data feed for:
 * - New token creations
 * - Trade events
 * - Migration events
 * 
 * Designed for low-latency, fee-optimized trading
 */

import type { Token, NewTokenEvent, TradeEvent, MigrationEvent } from '@/lib/types';

const PUMPPORTAL_WS_URL = 'wss://pumpportal.fun/api/data';

type EventCallback = (event: NewTokenEvent | TradeEvent | MigrationEvent) => void;

interface PumpPortalSubscription {
    type: 'newTokens' | 'trades' | 'migrations';
    callback: EventCallback;
}

class PumpPortalClient {
    private ws: WebSocket | null = null;
    private subscriptions: PumpPortalSubscription[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private messageQueue: object[] = [];

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                // Wait for existing connection attempt
                const checkConnection = setInterval(() => {
                    if (this.ws?.readyState === WebSocket.OPEN) {
                        clearInterval(checkConnection);
                        resolve();
                    }
                }, 100);
                return;
            }

            this.isConnecting = true;

            try {
                this.ws = new WebSocket(PUMPPORTAL_WS_URL);

                this.ws.onopen = () => {
                    console.log('[PumpPortal] Connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;

                    // Send queued messages
                    while (this.messageQueue.length > 0) {
                        const msg = this.messageQueue.shift();
                        if (msg) this.send(msg);
                    }

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (err) {
                        console.error('[PumpPortal] Failed to parse message:', err);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[PumpPortal] WebSocket error:', error);
                    this.isConnecting = false;
                };

                this.ws.onclose = () => {
                    console.log('[PumpPortal] Disconnected');
                    this.isConnecting = false;
                    this.attemptReconnect();
                };
            } catch (err) {
                this.isConnecting = false;
                reject(err);
            }
        });
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[PumpPortal] Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[PumpPortal] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(console.error);
        }, delay);
    }

    private send(data: object) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.messageQueue.push(data);
        }
    }

    private handleMessage(data: unknown) {
        if (!data || typeof data !== 'object') return;

        const msg = data as Record<string, unknown>;

        // Handle different event types from PumpPortal
        if (msg.txType === 'create' || msg.signature && msg.mint && !msg.traderPublicKey) {
            // New token creation
            const event: NewTokenEvent = {
                mint: msg.mint as string,
                name: msg.name as string || 'Unknown',
                symbol: msg.symbol as string || '???',
                uri: msg.uri as string || '',
                creator: msg.traderPublicKey as string || '',
                initialBuyAmountSol: (msg.initialBuy as number) || 0,
            };
            this.notifySubscribers('newTokens', event);
        } else if (msg.txType === 'buy' || msg.txType === 'sell') {
            // Trade event
            const event: TradeEvent = {
                signature: msg.signature as string,
                mint: msg.mint as string,
                traderPublicKey: msg.traderPublicKey as string,
                txType: msg.txType as 'buy' | 'sell',
                solAmount: (msg.solAmount as number) || 0,
                tokenAmount: (msg.tokenAmount as number) || 0,
                newMarketCap: (msg.marketCapSol as number) || 0,
                timestamp: Date.now(),
            };
            this.notifySubscribers('trades', event);
        } else if (msg.pool) {
            // Migration event
            const event: MigrationEvent = {
                mint: msg.mint as string,
                name: msg.name as string || 'Unknown',
                symbol: msg.symbol as string || '???',
                poolAddress: msg.pool as string,
                timestamp: Date.now(),
            };
            this.notifySubscribers('migrations', event);
        }
    }

    private notifySubscribers(type: PumpPortalSubscription['type'], event: NewTokenEvent | TradeEvent | MigrationEvent) {
        this.subscriptions
            .filter(sub => sub.type === type)
            .forEach(sub => {
                try {
                    sub.callback(event);
                } catch (err) {
                    console.error('[PumpPortal] Subscriber error:', err);
                }
            });
    }

    // Subscribe to new token creations
    subscribeNewTokens(callback: (event: NewTokenEvent) => void) {
        this.subscriptions.push({ type: 'newTokens', callback: callback as EventCallback });
        this.send({ method: 'subscribeNewToken' });
    }

    // Subscribe to trades for specific tokens
    subscribeTokenTrades(mints: string[], callback: (event: TradeEvent) => void) {
        this.subscriptions.push({ type: 'trades', callback: callback as EventCallback });
        this.send({ method: 'subscribeTokenTrade', keys: mints });
    }

    // Subscribe to migrations
    subscribeMigrations(callback: (event: MigrationEvent) => void) {
        this.subscriptions.push({ type: 'migrations', callback: callback as EventCallback });
        // Note: PumpPortal migration subscription method may vary
    }

    // Unsubscribe from specific tokens
    unsubscribeTokens(mints: string[]) {
        this.send({ method: 'unsubscribeTokenTrade', keys: mints });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscriptions = [];
        this.messageQueue = [];
    }
}

// Singleton instance
export const pumpPortal = new PumpPortalClient();

// React hook for PumpPortal connection
export function usePumpPortal() {
    return pumpPortal;
}
