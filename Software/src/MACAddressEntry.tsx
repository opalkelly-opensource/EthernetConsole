/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import { Flex, TextField, Text } from "@radix-ui/themes";

export interface MACAddressEntryProps {
    /** Current 48-bit MAC address. Used to seed the field when not focused. */
    value: bigint;
    /** Called whenever the user changes a byte. */
    onChange: (value: bigint) => void;
    disabled?: boolean;
}

const HEX_BYTE = /^[0-9A-Fa-f]{0,2}$/;

const splitToBytes = (value: bigint): string[] => {
    const bytes: string[] = [];
    for (let i = 5; i >= 0; i--) {
        const byte = Number((value >> BigInt(i * 8)) & 0xffn);
        bytes.push(byte.toString(16).toUpperCase().padStart(2, "0"));
    }
    return bytes;
};

const bytesToValue = (bytes: string[]): bigint => {
    let value = 0n;
    for (let i = 0; i < 6; i++) {
        const byte = parseInt(bytes[i] || "0", 16) & 0xff;
        value = (value << 8n) | BigInt(byte);
    }
    return value;
};

interface MACAddressEntryState {
    bytes: string[];
    editing: boolean;
}

/**
 * Six-byte MAC address entry widget. Calls `onChange` with the new 48-bit
 * value on every byte change.
 */
class MACAddressEntry extends React.Component<MACAddressEntryProps, MACAddressEntryState> {
    private inputs: Array<HTMLInputElement | null> = [];
    private wheelCleanups: Array<() => void> = [];

    constructor(props: MACAddressEntryProps) {
        super(props);
        this.state = {
            bytes: splitToBytes(props.value),
            editing: false
        };
    }

    componentDidMount(): void {
        this.inputs.forEach((el, i) => {
            if (el == null) return;
            const handler = (e: WheelEvent) => {
                if (this.props.disabled) return;
                e.preventDefault();
                const step = e.shiftKey ? 0x10 : 1;
                this.adjust(i, e.deltaY < 0 ? step : -step);
            };
            // Non-passive listener required so preventDefault stops page scroll.
            el.addEventListener("wheel", handler, { passive: false });
            this.wheelCleanups.push(() => el.removeEventListener("wheel", handler));
        });
    }

    componentDidUpdate(): void {
        if (this.state.editing) return;
        const remote = splitToBytes(this.props.value);
        if (remote.some((b, i) => b !== this.state.bytes[i])) {
            this.setState({ bytes: remote });
        }
    }

    componentWillUnmount(): void {
        this.wheelCleanups.forEach((fn) => fn());
    }

    private commitBytes = (next: string[]): void => {
        this.setState({ bytes: next });
        this.props.onChange(bytesToValue(next));
    };

    private onByteChange = (i: number, raw: string): void => {
        if (!HEX_BYTE.test(raw)) return;
        const next = [...this.state.bytes];
        next[i] = raw.toUpperCase();
        this.commitBytes(next);
    };

    private adjust = (i: number, delta: number): void => {
        const current = parseInt(this.state.bytes[i] || "0", 16) & 0xff;
        const updated = (current + delta + 0x100) & 0xff;
        const next = [...this.state.bytes];
        next[i] = updated.toString(16).toUpperCase().padStart(2, "0");
        this.commitBytes(next);
    };

    private setEditing = (editing: boolean): void => {
        this.setState({ editing });
    };

    render() {
        const { disabled } = this.props;
        const { bytes } = this.state;
        return (
            <Flex align="center" gap="1">
                {bytes.map((b, i) => (
                    <React.Fragment key={i}>
                        <TextField.Root
                            ref={(el) => {
                                this.inputs[i] = el;
                            }}
                            size="1"
                            value={b}
                            maxLength={2}
                            disabled={disabled}
                            onFocus={() => this.setEditing(true)}
                            onBlur={() => this.setEditing(false)}
                            onChange={(e) => this.onByteChange(i, e.target.value)}
                            style={{
                                width: 38,
                                fontFamily: "var(--code-font-family)",
                                textTransform: "uppercase"
                            }}
                        />
                        {i < 5 ? <Text color="gray">:</Text> : null}
                    </React.Fragment>
                ))}
            </Flex>
        );
    }
}

export default MACAddressEntry;
