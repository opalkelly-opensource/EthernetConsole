/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import React from "react";

import { FrontPanelProps } from "./FrontPanel.props";

import { FrontPanelContext } from "../../contexts";

const FrontPanel: React.FC<FrontPanelProps> = (props) => {
    const { fpgaDataPort, workQueue, eventSource } = props;

    return (
        <FrontPanelContext.Provider
            value={{ fpgaDataPort: fpgaDataPort, workQueue: workQueue, eventSource: eventSource }}>
            {props.children}
        </FrontPanelContext.Provider>
    );
};

FrontPanel.displayName = "FrontPanel";

export default FrontPanel;
