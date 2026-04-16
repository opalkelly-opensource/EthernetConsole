/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import React from "react";

import "./FrontPanelTriggerButton.css";

import FrontPanelTriggerButtonProps from "./FrontPanelTriggerButton.props";

import Button from "../../primitives/Button";

import { FrontPanelContext } from "../../contexts";

type FrontPanelTriggerButtonElement = React.ElementRef<typeof Button>;

interface FrontPanelTriggerButtonCombinedProps
    extends Omit<
            React.ComponentPropsWithoutRef<typeof Button>,
            "asChild" | "onButtonClick" | "onButtonDown" | "onButtonUp"
        >,
        FrontPanelTriggerButtonProps {}

export type { FrontPanelTriggerButtonCombinedProps };

/**
 * `FrontPanelTriggerButton` is a React component that renders a trigger button that asserts a TriggerIn endpoint when
 * it is pressed.
 *
 * @component
 * @param {Object} props - Properties passed to component
 * @param {React.Ref<FrontPanelTriggerButtonElement>} forwardedRef - Forwarded ref for the button
 *
 * @returns {React.ReactElement} The rendered FrontPanelTriggerButton component
 *
 * @example
 * ```jsx
 * <FrontPanelTriggerButton
 *     label="Trigger"
 *     fpEndpoint={{epAddress: 0x00, bitOffset: 1}} />
 * ```
 */
const FrontPanelTriggerButton = React.forwardRef<
    FrontPanelTriggerButtonElement,
    FrontPanelTriggerButtonCombinedProps
>((props, forwardedRef) => {
    const { fpgaDataPort, workQueue } = React.useContext(FrontPanelContext);

    const { fpEndpoint, disabled, ...buttonProps } = props;

    const onButtonDown = React.useCallback(async (): Promise<void> => {
        if ((fpgaDataPort != null) && (workQueue != null)) {
            await workQueue.post(async () => {
                await fpgaDataPort.activateTriggerIn(fpEndpoint.epAddress, fpEndpoint.bitOffset);
            });
        }
    }, [fpgaDataPort, workQueue, fpEndpoint]);

    return (
        <Button
            {...buttonProps}
            ref={forwardedRef}
            disabled={disabled || (fpgaDataPort == null)}
            onButtonDown={onButtonDown}
        />
    );
});

FrontPanelTriggerButton.displayName = "FrontPanelTriggerButton";

export default FrontPanelTriggerButton;
