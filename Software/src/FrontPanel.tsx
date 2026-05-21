/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import { Flex } from "@radix-ui/themes";

import { IFPGADataPortClassic, WorkQueue } from "@opalkelly/frontpanel-platform-api";

import EthernetPortView from "./EthernetPortView";
import { EthernetPortDriver } from "./EthernetPortDriver";
import { EthernetPortA, EthernetPortC } from "./EthernetPorts";

import "./controls.css";
import "./FrontPanel.css";

export interface FrontPanelProps {
    fpgaDataPort: IFPGADataPortClassic;
    workQueue: WorkQueue;
    portCDetected?: boolean;
}

class FrontPanel extends React.Component<FrontPanelProps> {
    private readonly portADriver: EthernetPortDriver;
    private readonly portCDriver: EthernetPortDriver;

    constructor(props: FrontPanelProps) {
        super(props);
        this.portADriver = new EthernetPortDriver(props.fpgaDataPort, EthernetPortA);
        this.portCDriver = new EthernetPortDriver(props.fpgaDataPort, EthernetPortC);
    }

    render() {
        const { workQueue, portCDetected = false } = this.props;
        return (
            <Flex direction="column" gap="3" p="4" width="100%" style={{ minHeight: "100vh" }}>
                <div className="console">
                    <EthernetPortView
                        label="MAC EX Port A"
                        driver={this.portADriver}
                        workQueue={workQueue}
                    />
                    <EthernetPortView
                        label="MAC EX Port C"
                        driver={this.portCDriver}
                        workQueue={workQueue}
                        moduleDetected={portCDetected}
                    />
                </div>
            </Flex>
        );
    }
}

export default FrontPanel;
