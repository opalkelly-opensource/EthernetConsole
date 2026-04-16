/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import React from "react";

import { Indicator } from "../../primitives";

import FrontPanelIndicatorProps from "./FrontPanelIndicator.props";

import { FrontPanelContext } from "../../contexts";

import { IFPGADataPortClassic } from "@opalkelly/frontpanel-platform-api";

type FrontPanelIndicatorElement = React.ElementRef<typeof Indicator>;

interface FrontPanelIndicatorCombinedProps
    extends Omit<React.ComponentPropsWithoutRef<typeof Indicator>, "state">,
        FrontPanelIndicatorProps {}

export type { FrontPanelIndicatorCombinedProps };

/**
 * `FrontPanelIndicator` is a React component that renders an indicator that represents the state of a WireOut endpoint.
 *
 * @component
 * @param {object} props - Properties passed to component
 * @param {React.Ref} forwardedRef - Forwarded ref for the indicator
 *
 * @returns {React.Node} The rendered FrontPanelIndicator component
 *
 * @example
 * ```jsx
 * <FrontPanelIndicator
 *     label="Indicator"
 *     fpEndpoint={{epAddress: 0x20, bitOffset: 1}} />
 * ```
 */
const FrontPanelIndicator = React.forwardRef<
    FrontPanelIndicatorElement,
    FrontPanelIndicatorCombinedProps
>((props, forwardedRef) => {
    const [bitValue, setBitValue] = React.useState<boolean>(false);

    const { fpgaDataPort, workQueue, eventSource } = React.useContext(FrontPanelContext);

    const { fpEndpoint, ...rootProps } = props;

    const targetWireBitMask = 1 << fpEndpoint.bitOffset;

    const onUpdateWireValue = React.useCallback(
        (sender?: IFPGADataPortClassic): void => {
            if ((sender != null) && (workQueue != null)) {
                const sourceWireValue = sender.getWireOutValue(fpEndpoint.epAddress);
                const sourceBitValue = (sourceWireValue & targetWireBitMask) === targetWireBitMask;
                setBitValue(sourceBitValue);
            } else {
                setBitValue(false);
            }
        },
        [workQueue, fpEndpoint, targetWireBitMask]
    );

    React.useEffect(() => {
        onUpdateWireValue(fpgaDataPort);

        const subscription = eventSource?.wireOutValuesChangedEvent.subscribe(onUpdateWireValue);

        return () => {
            subscription?.cancel();
        };
    }, [fpgaDataPort, eventSource, onUpdateWireValue]);

    return <Indicator {...rootProps} ref={forwardedRef} state={bitValue} />;
});

FrontPanelIndicator.displayName = "FrontPanelIndicator";

export default FrontPanelIndicator;
