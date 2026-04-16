/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import React from "react";

import { Button } from "../../primitives";

import FrontPanelPushButtonProps from "./FrontPanelPushButton.props";

import { FrontPanelContext } from "../../contexts";

type FrontPanelPushButtonElement = React.ElementRef<typeof Button>;

interface FrontPanelPushButtonCombinedProps
    extends Omit<
            React.ComponentPropsWithoutRef<typeof Button>,
            "asChild" | "onButtonClick" | "onButtonDown" | "onButtonUp"
        >,
        FrontPanelPushButtonProps {}

export type { FrontPanelPushButtonCombinedProps };

/**
 * `FrontPanelPushButton` is a React component that renders a push button that asserts a WireIn endpoint
 * when pressed and deasserts it when released.
 *
 * @component
 * @param {object} props - Properties passed to component
 * @param {React.Ref} forwardedRef - Forwarded ref for the button
 *
 * @returns {React.Node} The rendered FrontPanelPushButton component
 *
 * @example
 * ```jsx
 * <FrontPanelPushButton
 *     label="Pushbutton"
 *     fpEndpoint={{epAddress: 0x00, bitOffset: 1}} />
 * ```
 */
const FrontPanelPushButton = React.forwardRef<
    FrontPanelPushButtonElement,
    FrontPanelPushButtonCombinedProps
>((props, forwardedRef) => {
    const { fpgaDataPort, workQueue } = React.useContext(FrontPanelContext);

    const { fpEndpoint, disabled, ...buttonProps } = props;

    const targetWireBitMask = 1 << fpEndpoint.bitOffset;

    const onButtonUp = React.useCallback(async (): Promise<void> => {
        if ((fpgaDataPort != null) && (workQueue != null)) {
            await workQueue.post(async () => {
                fpgaDataPort.setWireInValue(fpEndpoint.epAddress, 0, targetWireBitMask);
                await fpgaDataPort.updateWireIns();
            });
        }
    }, [fpgaDataPort, workQueue, fpEndpoint, targetWireBitMask]);

    const onButtonDown = React.useCallback(async (): Promise<void> => {
        if ((fpgaDataPort != null) && (workQueue != null)) {
            await workQueue.post(async () => {
                fpgaDataPort.setWireInValue(fpEndpoint.epAddress, 0xffffffff, targetWireBitMask);
                await fpgaDataPort.updateWireIns();
            });
        }
    }, [fpgaDataPort, workQueue, fpEndpoint, targetWireBitMask, workQueue]);

    return (
        <Button
            {...buttonProps}
            ref={forwardedRef}
            disabled={disabled || (fpgaDataPort == null)}
            onButtonUp={onButtonUp}
            onButtonDown={onButtonDown}
        />
    );
});

FrontPanelPushButton.displayName = "FrontPanelPushButton";

export default FrontPanelPushButton;
