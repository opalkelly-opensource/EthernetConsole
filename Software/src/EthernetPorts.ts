/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EthernetPortAddresses } from "./EthernetPortDriver";

/**
 * Endpoint address map for Ethernet Port A.
 */
export const EthernetPortA: EthernetPortAddresses = {
    resetEndpoint: 0x00,
    settingsEndpoint: 0x01,
    statusEndpoint: 0x20,
    packetsSentEndpoint: 0x22,
    packetsReceivedEndpoint: 0x23,
    eepromMacHighEndpoint: 0x35,
    eepromMacLowEndpoint: 0x34,
    destinationMacHighEndpoint: 0x04,
    destinationMacLowEndpoint: 0x03,
    sourceMacHighEndpoint: 0x06,
    sourceMacLowEndpoint: 0x05,
    destinationGenCheckMacHighEndpoint: 0x27,
    destinationGenCheckMacLowEndpoint: 0x26,
    sourceGenCheckMacHighEndpoint: 0x29,
    sourceGenCheckMacLowEndpoint: 0x28,
    resetPortBit: 0,
    resetCountersBit: 2
};

/**
 * Endpoint address map for Ethernet Port C.
 */
export const EthernetPortC: EthernetPortAddresses = {
    resetEndpoint: 0x00,
    settingsEndpoint: 0x02,
    statusEndpoint: 0x21,
    packetsSentEndpoint: 0x24,
    packetsReceivedEndpoint: 0x25,
    eepromMacHighEndpoint: 0x37,
    eepromMacLowEndpoint: 0x36,
    destinationMacHighEndpoint: 0x08,
    destinationMacLowEndpoint: 0x07,
    sourceMacHighEndpoint: 0x0a,
    sourceMacLowEndpoint: 0x09,
    destinationGenCheckMacHighEndpoint: 0x31,
    destinationGenCheckMacLowEndpoint: 0x30,
    sourceGenCheckMacHighEndpoint: 0x33,
    sourceGenCheckMacLowEndpoint: 0x32,
    resetPortBit: 1,
    resetCountersBit: 3
};
