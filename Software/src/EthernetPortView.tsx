/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import { Badge, Box, Card, Flex, Heading, Select, Switch, Text } from "@radix-ui/themes";

import { WorkQueue } from "@opalkelly/frontpanel-platform-api";

import MACAddressView from "./MACAddressView";
import MACAddressEntry from "./MACAddressEntry";

import { EthernetPortDriver } from "./EthernetPortDriver";
import { Led, MomentaryButton, ResetPortButton } from "./controls";

import "./EthernetPortView.css";

const SPEED_OPTIONS: Array<{ value: number; label: string }> = [
    { value: 0, label: "10 Mb/s" },
    { value: 1, label: "100 Mb/s" },
    { value: 2, label: "1000 Mb/s" }
];

const speedLabel = (value: number): string =>
    SPEED_OPTIONS.find((o) => o.value === value)?.label ?? "—";

const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Flex direction="column" gap="1">
        <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
            {label}
        </Text>
        {children}
    </Flex>
);

const ToggleRow: React.FC<{
    label: string;
    value: boolean;
    onChange: (next: boolean) => void;
}> = ({ label, value, onChange }) => (
    <Flex align="center" justify="between" gap="3">
        <Text size="2">{label}</Text>
        <Switch size="1" checked={value} onCheckedChange={onChange} />
    </Flex>
);

export interface EthernetPortViewProps {
    label: string;
    driver: EthernetPortDriver;
    workQueue: WorkQueue;
    /** When false, the port is rendered in its disabled / no-module state. */
    moduleDetected?: boolean;
}

interface EthernetPortViewState {
    // Polled status
    link: boolean;
    duplex: boolean;
    rxActivity: boolean;
    error: boolean;
    negotiatedSpeed: number;
    packetsSent: bigint;
    packetsReceived: bigint;
    eepromMac: bigint;
    destGenCheckMac: bigint;
    srcGenCheckMac: bigint;
    // Mirrored device settings
    advertisedSpeed: number;
    generateTxData: boolean;
    checkRxData: boolean;
    phyLoopback: boolean;
    hdlLoopback: boolean;
    hdlLoopbackAddressSwap: boolean;
    destinationMac: bigint;
    sourceMac: bigint;
}

const POLL_INTERVAL_MS = 100;

/**
 * Two-row instrument-strip view of a single Ethernet port. Owns the polled
 * status/counter state and forwards control changes to the driver via the
 * shared WorkQueue.
 */
class EthernetPortView extends React.Component<EthernetPortViewProps, EthernetPortViewState> {
    private pollIntervalId?: ReturnType<typeof setInterval>;

    constructor(props: EthernetPortViewProps) {
        super(props);
        const { driver } = props;
        this.state = {
            link: false,
            duplex: false,
            rxActivity: false,
            error: false,
            negotiatedSpeed: 0,
            packetsSent: 0n,
            packetsReceived: 0n,
            eepromMac: 0n,
            destGenCheckMac: 0n,
            srcGenCheckMac: 0n,
            advertisedSpeed: driver.getAdvertisedSpeed(),
            generateTxData: driver.getGenerateTxData(),
            checkRxData: driver.getCheckRxData(),
            phyLoopback: driver.getPhyLoopback(),
            hdlLoopback: driver.getHdlLoopback(),
            hdlLoopbackAddressSwap: driver.getHdlLoopbackAddressSwap(),
            destinationMac: driver.getDestinationMac(),
            sourceMac: driver.getSourceMac()
        };
    }

    componentDidMount(): void {
        // A port with no module attached has nothing to read; skip the poll
        // entirely rather than issuing a hardware read on every interval.
        if (this.props.moduleDetected === false) {
            return;
        }

        this.pollIntervalId = setInterval(() => {
            this.props.workQueue.post(async () => {
                const { driver } = this.props;
                await driver.pollStatus();
                this.setState({
                    link: driver.getLink(),
                    duplex: driver.getDuplex(),
                    rxActivity: driver.getRxActivity(),
                    error: driver.getError(),
                    negotiatedSpeed: driver.getNegotiatedSpeed(),
                    packetsSent: driver.getPacketsSent(),
                    packetsReceived: driver.getPacketsReceived(),
                    eepromMac: driver.getEepromMac(),
                    destGenCheckMac: driver.getDestinationGenCheckMac(),
                    srcGenCheckMac: driver.getSourceGenCheckMac()
                });
            });
        }, POLL_INTERVAL_MS);
    }

    componentWillUnmount(): void {
        if (this.pollIntervalId !== undefined) {
            clearInterval(this.pollIntervalId);
        }
    }

    // Updates the local mirror immediately so the control reflects intent,
    // and posts the FPGA write to the work queue off the render path.
    private mirror = <K extends keyof EthernetPortViewState>(
        key: K,
        write: (value: EthernetPortViewState[K]) => Promise<void>
    ): ((next: EthernetPortViewState[K]) => void) => {
        return (next: EthernetPortViewState[K]): void => {
            this.setState({ [key]: next } as Pick<EthernetPortViewState, K>);
            this.props.workQueue.post(() => write(next));
        };
    };

    // Asserts/releases a setting bit through the work queue.
    private momentary =
        (action: (value: boolean) => Promise<void>) =>
        (pressed: boolean): void => {
            this.props.workQueue.post(() => action(pressed));
        };

    private onAdvertisedSpeedChange = this.mirror("advertisedSpeed", (v) =>
        this.props.driver.setAdvertisedSpeed(v)
    );
    private onGenerateTxDataChange = this.mirror("generateTxData", (v) =>
        this.props.driver.setGenerateTxData(v)
    );
    private onCheckRxDataChange = this.mirror("checkRxData", (v) =>
        this.props.driver.setCheckRxData(v)
    );
    private onPhyLoopbackChange = this.mirror("phyLoopback", (v) =>
        this.props.driver.setPhyLoopback(v)
    );
    private onHdlLoopbackChange = this.mirror("hdlLoopback", (v) =>
        this.props.driver.setHdlLoopback(v)
    );
    private onHdlLoopbackAddressSwapChange = this.mirror("hdlLoopbackAddressSwap", (v) =>
        this.props.driver.setHdlLoopbackAddressSwap(v)
    );
    private onDestinationMacChange = this.mirror("destinationMac", (v) =>
        this.props.driver.setDestinationMac(v)
    );
    private onSourceMacChange = this.mirror("sourceMac", (v) => this.props.driver.setSourceMac(v));

    // Port reset clears the FPGA's advertised-speed register; sync the host
    // mirror back to 0 so the dropdown matches the gateware.
    private onResetPortReleased = (): void => {
        this.onAdvertisedSpeedChange(0);
    };

    render() {
        const { label, driver, moduleDetected = true } = this.props;
        const {
            link,
            duplex,
            rxActivity,
            error,
            negotiatedSpeed,
            packetsSent,
            packetsReceived,
            eepromMac,
            destGenCheckMac,
            srcGenCheckMac,
            advertisedSpeed,
            generateTxData,
            checkRxData,
            phyLoopback,
            hdlLoopback,
            hdlLoopbackAddressSwap,
            destinationMac,
            sourceMac
        } = this.state;

        return (
            <Card className={moduleDetected ? undefined : "port-disabled"}>
                <Flex direction="column" gap="3">
                    {/* header strip */}
                    <Flex align="center" justify="between" gap="4" wrap="wrap">
                        <Flex align="center" gap="2">
                            <span className="led" data-state={moduleDetected ? "on" : "off"} />
                            <Heading size="3">{label}</Heading>
                        </Flex>
                        <Flex align="center" gap="4" className="port-disable-target">
                            <Led on={link} label="Link" />
                            <Led on={duplex} label="Duplex" />
                            <Led on={rxActivity} label="Rx activity" />
                            <Led on={error} label="Error" tone="error" />
                        </Flex>
                        <Badge color={moduleDetected ? "green" : "gray"} variant="soft">
                            {moduleDetected ? "Module detected" : "No module"}
                        </Badge>
                    </Flex>

                    {/* counters row */}
                    <Flex
                        align="center"
                        justify="between"
                        gap="4"
                        wrap="wrap"
                        className="port-disable-target">
                        <Flex gap="6" wrap="wrap">
                            <Stat label="Negotiated speed">
                                <Text size="2" weight="medium">
                                    {speedLabel(negotiatedSpeed)}
                                </Text>
                            </Stat>
                            <Stat label="Packets sent">
                                <Text
                                    size="2"
                                    weight="medium"
                                    style={{ fontFamily: "var(--code-font-family)" }}>
                                    {packetsSent.toLocaleString("en-US")}
                                </Text>
                            </Stat>
                            <Stat label="Packets received">
                                <Text
                                    size="2"
                                    weight="medium"
                                    style={{ fontFamily: "var(--code-font-family)" }}>
                                    {packetsReceived.toLocaleString("en-US")}
                                </Text>
                            </Stat>
                        </Flex>
                        <Flex gap="2">
                            <MomentaryButton
                                onPressChange={this.momentary(driver.setResetCounters)}
                                variant="secondary">
                                Reset counters
                            </MomentaryButton>
                            <MomentaryButton
                                onPressChange={this.momentary(driver.setResetError)}
                                variant="secondary">
                                Reset error
                            </MomentaryButton>
                            <MomentaryButton
                                onPressChange={this.momentary(driver.setInjectError)}
                                variant="danger">
                                Inject error
                            </MomentaryButton>
                        </Flex>
                    </Flex>

                    {/* body */}
                    <Flex gap="3" wrap="wrap" className="port-disable-target">
                        <Flex
                            direction="column"
                            gap="3"
                            style={{ flex: 1, minWidth: 260, maxWidth: 320 }}>
                            <Card variant="classic">
                                <Flex direction="column" gap="3">
                                    <Heading
                                        size="1"
                                        color="gray"
                                        style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                                        Speed
                                    </Heading>
                                    <Flex align="center" justify="between" gap="3">
                                        <Text size="2">Advertised</Text>
                                        <Select.Root
                                            size="1"
                                            value={advertisedSpeed.toString()}
                                            onValueChange={(v) =>
                                                this.onAdvertisedSpeedChange(Number(v))
                                            }>
                                            <Select.Trigger />
                                            <Select.Content>
                                                {SPEED_OPTIONS.map((opt) => (
                                                    <Select.Item
                                                        key={opt.value}
                                                        value={opt.value.toString()}>
                                                        {opt.label}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Root>
                                    </Flex>
                                    <MomentaryButton
                                        onPressChange={this.momentary(driver.setUpdateSpeed)}
                                        fullWidth>
                                        Update speed
                                    </MomentaryButton>
                                </Flex>
                            </Card>

                            <Card variant="classic">
                                <Flex direction="column" gap="3">
                                    <Heading
                                        size="1"
                                        color="gray"
                                        style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                                        Options
                                    </Heading>
                                    <ToggleRow
                                        label="Generate TX data"
                                        value={generateTxData}
                                        onChange={this.onGenerateTxDataChange}
                                    />
                                    <ToggleRow
                                        label="Check RX data"
                                        value={checkRxData}
                                        onChange={this.onCheckRxDataChange}
                                    />
                                    <ToggleRow
                                        label="PHY loopback"
                                        value={phyLoopback}
                                        onChange={this.onPhyLoopbackChange}
                                    />
                                    <ToggleRow
                                        label="HDL loopback"
                                        value={hdlLoopback}
                                        onChange={this.onHdlLoopbackChange}
                                    />
                                    <ToggleRow
                                        label="HDL loopback addr swap"
                                        value={hdlLoopbackAddressSwap}
                                        onChange={this.onHdlLoopbackAddressSwapChange}
                                    />
                                </Flex>
                            </Card>
                        </Flex>

                        <Flex direction="column" gap="3" style={{ flex: 1, minWidth: 320 }}>
                            <Card variant="classic">
                                <Flex direction="column" gap="3">
                                    <Heading
                                        size="1"
                                        color="gray"
                                        style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                                        Active MAC addresses
                                    </Heading>
                                    <Flex align="center" justify="between" gap="3">
                                        <Text size="2" color="gray">
                                            EEPROM (unique)
                                        </Text>
                                        <MACAddressView value={eepromMac} />
                                    </Flex>
                                    <Flex align="center" justify="between" gap="3">
                                        <Text size="2" color="gray">
                                            Destination · gen/check
                                        </Text>
                                        <MACAddressView value={destGenCheckMac} />
                                    </Flex>
                                    <Flex align="center" justify="between" gap="3">
                                        <Text size="2" color="gray">
                                            Source · gen/check
                                        </Text>
                                        <MACAddressView value={srcGenCheckMac} />
                                    </Flex>
                                </Flex>
                            </Card>

                            <Card variant="classic">
                                <Flex direction="column" gap="3">
                                    <Heading
                                        size="1"
                                        color="gray"
                                        style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                                        Set MAC addresses
                                    </Heading>
                                    <Flex gap="5" wrap="wrap">
                                        <Box>
                                            <Text
                                                size="1"
                                                color="gray"
                                                style={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.6
                                                }}>
                                                Destination MAC
                                            </Text>
                                            <Box mt="1">
                                                <MACAddressEntry
                                                    value={destinationMac}
                                                    onChange={this.onDestinationMacChange}
                                                />
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Text
                                                size="1"
                                                color="gray"
                                                style={{
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.6
                                                }}>
                                                Source MAC
                                            </Text>
                                            <Box mt="1">
                                                <MACAddressEntry
                                                    value={sourceMac}
                                                    onChange={this.onSourceMacChange}
                                                />
                                            </Box>
                                        </Box>
                                    </Flex>
                                    <Flex justify="end" gap="2" mt="1">
                                        <ResetPortButton
                                            onPressChange={this.momentary(driver.setResetPort)}
                                            onReleased={this.onResetPortReleased}
                                        />
                                        <MomentaryButton
                                            onPressChange={this.momentary(driver.setSetPort)}>
                                            Set port
                                        </MomentaryButton>
                                    </Flex>
                                </Flex>
                            </Card>
                        </Flex>
                    </Flex>
                </Flex>
            </Card>
        );
    }
}

export default EthernetPortView;
