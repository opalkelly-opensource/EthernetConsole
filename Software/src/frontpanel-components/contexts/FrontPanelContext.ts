/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import React from "react";

import {
    IFPGADataPortClassic,
    WorkQueue
} from "@opalkelly/frontpanel-platform-api";

/**
 * Minimal event source interface compatible with the removed
 * IFPGADataPortClassicEventSource from frontpanel-platform-api v0.5.
 */
export interface IFPGADataPortClassicEventSource {
    wireOutValuesChangedEvent: {
        subscribe(handler: (sender: IFPGADataPortClassic) => void): { cancel(): void };
    };
}

export type FrontPanelContextValue = {
    fpgaDataPort?: IFPGADataPortClassic;
    workQueue?: WorkQueue;
    eventSource?: IFPGADataPortClassicEventSource;
};

const FrontPanelContext = React.createContext<FrontPanelContextValue>({});

export default FrontPanelContext;
