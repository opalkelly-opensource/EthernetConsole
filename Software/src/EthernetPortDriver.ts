/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IFPGADataPortClassic } from "@opalkelly/frontpanel-platform-api";

/**
 * Endpoint addresses for one Ethernet port. Settings/status bit offsets are
 * the same on both ports and live in the driver; only the endpoint addresses
 * (and the two reset bits within the shared reset endpoint) differ.
 */
export interface EthernetPortAddresses {
    resetEndpoint: number;
    settingsEndpoint: number;
    statusEndpoint: number;
    packetsSentEndpoint: number;
    packetsReceivedEndpoint: number;
    eepromMacHighEndpoint: number;
    eepromMacLowEndpoint: number;
    destinationMacHighEndpoint: number;
    destinationMacLowEndpoint: number;
    sourceMacHighEndpoint: number;
    sourceMacLowEndpoint: number;
    destinationGenCheckMacHighEndpoint: number;
    destinationGenCheckMacLowEndpoint: number;
    sourceGenCheckMacHighEndpoint: number;
    sourceGenCheckMacLowEndpoint: number;
    resetPortBit: number;
    resetCountersBit: number;
}

interface BitSpan {
    offset: number;
    length: number;
}

const SETTINGS_BITS = {
    speedAdvertised: { offset: 0, length: 2 },
    updateSpeed: { offset: 2, length: 1 },
    generateTxData: { offset: 4, length: 1 },
    checkRxData: { offset: 5, length: 1 },
    resetError: { offset: 6, length: 1 },
    hdlLoopback: { offset: 7, length: 1 },
    injectError: { offset: 8, length: 1 },
    hdlLoopbackAddressSwap: { offset: 9, length: 1 },
    phyLoopback: { offset: 10, length: 1 },
    setPort: { offset: 11, length: 1 }
} as const satisfies Record<string, BitSpan>;

const STATUS_BITS = {
    link: { offset: 0, length: 1 },
    phyNegSpeed: { offset: 1, length: 2 },
    duplex: { offset: 3, length: 1 },
    error: { offset: 4, length: 1 },
    rxActivity: { offset: 5, length: 1 }
} as const satisfies Record<string, BitSpan>;

// Native `&` reinterprets a 32-bit mask as int32, producing negative numbers
// for the upper half. BigInt arithmetic avoids this.
const readSpan = (wire: number, span: BitSpan): number => {
    const mask = (1n << BigInt(span.length)) - 1n;
    return Number((BigInt(wire >>> 0) >> BigInt(span.offset)) & mask);
};

const spanWrite = (span: BitSpan, value: number): { value: number; mask: number } => {
    const fieldMask = (1 << span.length) - 1;
    return { value: (value & fieldMask) << span.offset, mask: fieldMask << span.offset };
};

const combineMac = (high: number, low: number): bigint =>
    ((BigInt(high >>> 0) & 0xffffn) << 32n) | BigInt(low >>> 0);

/**
 * Driver for one Ethernet port. Wraps the WireIn / WireOut bit-packing math
 * behind semantic getters and setters. Setters are async because each one
 * commits a `updateWireIns()`. Getters read from the WireOut/WireIn cache and
 * are synchronous; call `pollStatus()` first to refresh the WireOut cache.
 */
export class EthernetPortDriver {
    private readonly _DataPort: IFPGADataPortClassic;
    private readonly _Addresses: EthernetPortAddresses;

    constructor(dataPort: IFPGADataPortClassic, addresses: EthernetPortAddresses) {
        this._DataPort = dataPort;
        this._Addresses = addresses;
    }

    public async pollStatus(): Promise<void> {
        await this._DataPort.updateWireOuts();
    }

    // ---- Status (WireOut) -------------------------------------------------

    public getLink(): boolean {
        return this.getStatusBit(STATUS_BITS.link.offset);
    }

    public getDuplex(): boolean {
        return this.getStatusBit(STATUS_BITS.duplex.offset);
    }

    public getRxActivity(): boolean {
        return this.getStatusBit(STATUS_BITS.rxActivity.offset);
    }

    public getError(): boolean {
        return this.getStatusBit(STATUS_BITS.error.offset);
    }

    public getNegotiatedSpeed(): number {
        return readSpan(
            this._DataPort.getWireOutValue(this._Addresses.statusEndpoint),
            STATUS_BITS.phyNegSpeed
        );
    }

    public getPacketsSent(): bigint {
        return BigInt(this._DataPort.getWireOutValue(this._Addresses.packetsSentEndpoint) >>> 0);
    }

    public getPacketsReceived(): bigint {
        return BigInt(
            this._DataPort.getWireOutValue(this._Addresses.packetsReceivedEndpoint) >>> 0
        );
    }

    public getEepromMac(): bigint {
        return combineMac(
            this._DataPort.getWireOutValue(this._Addresses.eepromMacHighEndpoint),
            this._DataPort.getWireOutValue(this._Addresses.eepromMacLowEndpoint)
        );
    }

    public getDestinationGenCheckMac(): bigint {
        return combineMac(
            this._DataPort.getWireOutValue(this._Addresses.destinationGenCheckMacHighEndpoint),
            this._DataPort.getWireOutValue(this._Addresses.destinationGenCheckMacLowEndpoint)
        );
    }

    public getSourceGenCheckMac(): bigint {
        return combineMac(
            this._DataPort.getWireOutValue(this._Addresses.sourceGenCheckMacHighEndpoint),
            this._DataPort.getWireOutValue(this._Addresses.sourceGenCheckMacLowEndpoint)
        );
    }

    // ---- Settings (WireIn, persistent) ------------------------------------

    public getAdvertisedSpeed(): number {
        return this.readSettingsSpan(SETTINGS_BITS.speedAdvertised);
    }
    public setAdvertisedSpeed(value: number): Promise<void> {
        return this.writeSettingsSpan(SETTINGS_BITS.speedAdvertised, value);
    }

    public getGenerateTxData(): boolean {
        return this.readSettingsBool(SETTINGS_BITS.generateTxData);
    }
    public setGenerateTxData(value: boolean): Promise<void> {
        return this.writeSettingsBool(SETTINGS_BITS.generateTxData, value);
    }

    public getCheckRxData(): boolean {
        return this.readSettingsBool(SETTINGS_BITS.checkRxData);
    }
    public setCheckRxData(value: boolean): Promise<void> {
        return this.writeSettingsBool(SETTINGS_BITS.checkRxData, value);
    }

    public getPhyLoopback(): boolean {
        return this.readSettingsBool(SETTINGS_BITS.phyLoopback);
    }
    public setPhyLoopback(value: boolean): Promise<void> {
        return this.writeSettingsBool(SETTINGS_BITS.phyLoopback, value);
    }

    public getHdlLoopback(): boolean {
        return this.readSettingsBool(SETTINGS_BITS.hdlLoopback);
    }
    public setHdlLoopback(value: boolean): Promise<void> {
        return this.writeSettingsBool(SETTINGS_BITS.hdlLoopback, value);
    }

    public getHdlLoopbackAddressSwap(): boolean {
        return this.readSettingsBool(SETTINGS_BITS.hdlLoopbackAddressSwap);
    }
    public setHdlLoopbackAddressSwap(value: boolean): Promise<void> {
        return this.writeSettingsBool(SETTINGS_BITS.hdlLoopbackAddressSwap, value);
    }

    // ---- Momentary settings (held while pressed) --------------------------
    // Arrow properties so they can be passed by reference without losing `this`.

    public setUpdateSpeed = (value: boolean): Promise<void> =>
        this.writeSettingsBool(SETTINGS_BITS.updateSpeed, value);

    public setSetPort = (value: boolean): Promise<void> =>
        this.writeSettingsBool(SETTINGS_BITS.setPort, value);

    public setInjectError = (value: boolean): Promise<void> =>
        this.writeSettingsBool(SETTINGS_BITS.injectError, value);

    public setResetError = (value: boolean): Promise<void> =>
        this.writeSettingsBool(SETTINGS_BITS.resetError, value);

    public setResetCounters = (value: boolean): Promise<void> =>
        this.writeResetBit(this._Addresses.resetCountersBit, value);

    public setResetPort = (value: boolean): Promise<void> =>
        this.writeResetBit(this._Addresses.resetPortBit, value);

    // ---- MAC address entry (WireIn 48-bit pairs) --------------------------

    public getDestinationMac(): bigint {
        return combineMac(
            this._DataPort.getWireInValue(this._Addresses.destinationMacHighEndpoint),
            this._DataPort.getWireInValue(this._Addresses.destinationMacLowEndpoint)
        );
    }

    public setDestinationMac(value: bigint): Promise<void> {
        return this.writeMac(
            this._Addresses.destinationMacHighEndpoint,
            this._Addresses.destinationMacLowEndpoint,
            value
        );
    }

    public getSourceMac(): bigint {
        return combineMac(
            this._DataPort.getWireInValue(this._Addresses.sourceMacHighEndpoint),
            this._DataPort.getWireInValue(this._Addresses.sourceMacLowEndpoint)
        );
    }

    public setSourceMac(value: bigint): Promise<void> {
        return this.writeMac(
            this._Addresses.sourceMacHighEndpoint,
            this._Addresses.sourceMacLowEndpoint,
            value
        );
    }

    // ---- Internals --------------------------------------------------------

    private getStatusBit(bit: number): boolean {
        const wire = this._DataPort.getWireOutValue(this._Addresses.statusEndpoint);
        return (wire & (1 << bit)) !== 0;
    }

    private readSettingsSpan(span: BitSpan): number {
        return readSpan(this._DataPort.getWireInValue(this._Addresses.settingsEndpoint), span);
    }

    private async writeSettingsSpan(span: BitSpan, value: number): Promise<void> {
        const w = spanWrite(span, value);
        this._DataPort.setWireInValue(this._Addresses.settingsEndpoint, w.value, w.mask);
        await this._DataPort.updateWireIns();
    }

    private readSettingsBool(span: BitSpan): boolean {
        return this.readSettingsSpan(span) !== 0;
    }

    private writeSettingsBool(span: BitSpan, value: boolean): Promise<void> {
        return this.writeSettingsSpan(span, value ? 1 : 0);
    }

    private async writeResetBit(bit: number, value: boolean): Promise<void> {
        const mask = 1 << bit;
        this._DataPort.setWireInValue(this._Addresses.resetEndpoint, value ? 0xffffffff : 0, mask);
        await this._DataPort.updateWireIns();
    }

    private async writeMac(
        highEndpoint: number,
        lowEndpoint: number,
        value: bigint
    ): Promise<void> {
        const high = Number((value >> 32n) & 0xffffn);
        const low = Number(value & 0xffffffffn);
        this._DataPort.setWireInValue(highEndpoint, high, 0xffff);
        this._DataPort.setWireInValue(lowEndpoint, low, 0xffffffff);
        await this._DataPort.updateWireIns();
    }
}
