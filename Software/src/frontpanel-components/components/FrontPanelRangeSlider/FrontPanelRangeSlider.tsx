/**
 * Copyright (c) 2024 Opal Kelly Incorporated
 *
 * This source code is licensed under the FrontPanel license.
 * See the LICENSE file found in the root directory of this project.
 */

import React from "react";

import { RangeSlider } from "../../primitives";

import FrontPanelRangeSliderProps from "./FrontPanelRangeSlider.props";

import { FrontPanelContext } from "../../contexts";

import { CalculateBitLength } from "../../core";

import { IFPGADataPortClassic } from "@opalkelly/frontpanel-platform-api";

type FrontPanelRangeSliderElement = React.ElementRef<typeof RangeSlider>;

interface FrontPanelRangeSliderCombinedProps
    extends Omit<
            React.ComponentPropsWithoutRef<typeof RangeSlider>,
            "defaultValue" | "value" | "maximumValue" | "onValueChange" | "onValueCommit"
        >,
        FrontPanelRangeSliderProps {}

export type { FrontPanelRangeSliderCombinedProps };

/**
 * `FrontPanelRangeSlider` is a React component that renders a range slider to allow setting the value of a WireIn endpoint
 * within a specified range of values by clicking and dragging the slider thumb or by using the arrow keys.
 *
 * @component
 * @param {object} props - Properties passed to component
 * @param {React.Ref} forwardedRef - Forwarded ref for the range slider
 *
 * @returns {React.Node} The rendered FrontPanelRangeSlider component
 *
 * @example
 * ```jsx
 * <FrontPanelRangeSlider
 *     fpEndpoint={{epAddress: 0x00, bitOffset: 1}}
 *     maximumValue=0xff />
 * ```
 */
const FrontPanelRangeSlider = React.forwardRef<
    FrontPanelRangeSliderElement,
    FrontPanelRangeSliderCombinedProps
>((props, forwardedRef) => {
    const [value, setValue] = React.useState<bigint>(0n);

    const { fpgaDataPort, workQueue } = React.useContext(FrontPanelContext);

    const { fpEndpoint, maximumValue, disabled, ...rootProps } = props;

    const targetBitLength: number = React.useMemo(() => {
        return CalculateBitLength(BigInt(maximumValue));
    }, [maximumValue]);

    const targetWireBitMask =
        ((1n << BigInt(targetBitLength)) - 1n) << BigInt(fpEndpoint.bitOffset);

    const onUpdateWireValue = React.useCallback(
        (sender?: IFPGADataPortClassic): void => {
            if ((sender != null) && (workQueue != null)) {
                const sourceWireValue = sender.getWireInValue(fpEndpoint.epAddress);
                const sourceValue =
                    (BigInt(sourceWireValue) & targetWireBitMask) >> BigInt(fpEndpoint.bitOffset);
                setValue(sourceValue);
            } else {
                setValue(0n);
            }
        },
        [workQueue, fpEndpoint, targetWireBitMask]
    );

    const onSelectedValueChangeHandler = React.useCallback(
        (value: number) => {
            if ((fpgaDataPort != null) && (workQueue != null)) {
                workQueue.post(async () => {
                    fpgaDataPort.setWireInValue(
                        fpEndpoint.epAddress,
                        value << fpEndpoint.bitOffset,
                        Number(targetWireBitMask)
                    );
                    await fpgaDataPort.updateWireIns();
                });
            }
        },
        [fpgaDataPort, workQueue, fpEndpoint, targetWireBitMask]
    );

    React.useEffect(() => {
        onUpdateWireValue(fpgaDataPort);
    }, [fpgaDataPort, onUpdateWireValue]);

    return (
        <RangeSlider
            {...rootProps}
            ref={forwardedRef}
            disabled={disabled || (fpgaDataPort == null)}
            defaultValue={Number(value)}
            maximumValue={maximumValue}
            onValueChange={onSelectedValueChangeHandler}
        />
    );
});

FrontPanelRangeSlider.displayName = "FrontPanelRangeSlider";

export default FrontPanelRangeSlider;
