/**
 * Stopgap replacement for the removed FPGADataPortClassicPeriodicUpdateTimer
 * from @opalkelly/frontpanel-platform-api v0.5.
 *
 * Periodically calls updateWireOuts() and notifies subscribers so that
 * the vendored frontpanel-react-components can refresh their displayed values.
 */

import { IFPGADataPortClassic, WorkQueue } from "@opalkelly/frontpanel-platform-api";

type WireOutHandler = (sender: IFPGADataPortClassic) => void;

interface ISubscription {
    cancel(): void;
}

interface IWireOutEvent {
    subscribe(handler: WireOutHandler): ISubscription;
}

/**
 * Provides the IFPGADataPortClassicEventSource-compatible interface
 * expected by the vendored FrontPanel React components.
 */
export class FPGADataPortClassicPeriodicUpdateTimer {
    private readonly fpgaDataPort: IFPGADataPortClassic;
    private readonly workQueue: WorkQueue;
    private readonly intervalMs: number;
    private timerId: ReturnType<typeof setInterval> | null = null;
    private handlers: Set<WireOutHandler> = new Set();

    public readonly wireOutValuesChangedEvent: IWireOutEvent;

    constructor(fpgaDataPort: IFPGADataPortClassic, workQueue: WorkQueue, intervalMs: number) {
        this.fpgaDataPort = fpgaDataPort;
        this.workQueue = workQueue;
        this.intervalMs = intervalMs;

        this.wireOutValuesChangedEvent = {
            subscribe: (handler: WireOutHandler): ISubscription => {
                this.handlers.add(handler);
                return {
                    cancel: () => {
                        this.handlers.delete(handler);
                    }
                };
            }
        };
    }

    start(): void {
        if (this.timerId !== null) return;

        this.timerId = setInterval(() => {
            this.workQueue.post(async () => {
                await this.fpgaDataPort.updateWireOuts();
                for (const handler of this.handlers) {
                    handler(this.fpgaDataPort);
                }
            });
        }, this.intervalMs);
    }

    stop(): void {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
}
