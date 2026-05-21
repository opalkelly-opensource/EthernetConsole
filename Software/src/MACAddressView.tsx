/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import { Code } from "@radix-ui/themes";

export interface MACAddressViewProps {
    /** 48-bit MAC address. */
    value: bigint;
}

const formatMac = (value: bigint): string => {
    const bytes: string[] = [];
    for (let i = 5; i >= 0; i--) {
        const byte = Number((value >> BigInt(i * 8)) & 0xffn);
        bytes.push(byte.toString(16).toUpperCase().padStart(2, "0"));
    }
    return bytes.join(":");
};

/** Read-only MAC address readout. */
const MACAddressView: React.FC<MACAddressViewProps> = ({ value }) => (
    <Code variant="soft" size="1" style={{ letterSpacing: 1 }}>
        {formatMac(value)}
    </Code>
);

export default MACAddressView;
