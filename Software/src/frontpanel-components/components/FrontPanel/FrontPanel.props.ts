/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import {
    IFPGADataPortClassic,
    WorkQueue
} from "@opalkelly/frontpanel-platform-api";

import { IFPGADataPortClassicEventSource } from "../../contexts/FrontPanelContext";

interface FrontPanelProps extends React.PropsWithChildren<NonNullable<unknown>> {
    /**
     * The FPGA data port to be used
     */
    fpgaDataPort?: IFPGADataPortClassic;
    /**
     * Optional work queue to be used
     */
    workQueue?: WorkQueue;
    /**
     * Optional event source to be used
     */
    eventSource?: IFPGADataPortClassicEventSource;
}

export { FrontPanelProps };
