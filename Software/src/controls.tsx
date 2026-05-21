/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import { Button, Flex, Text } from "@radix-ui/themes";

export const Led: React.FC<{ on: boolean; label: string; tone?: "default" | "error" }> = ({
    on,
    label,
    tone = "default"
}) => (
    <Flex align="center" gap="2">
        <span className="led" data-state={on ? "on" : "off"} data-tone={tone} />
        <Text size="1">{label}</Text>
    </Flex>
);

type MomentaryVariant = "primary" | "secondary" | "danger";

const buttonProps = (variant: MomentaryVariant) => {
    if (variant === "secondary") return { variant: "soft" as const, color: "gray" as const };
    if (variant === "danger") return { variant: "solid" as const, color: "red" as const };
    return { variant: "solid" as const };
};

export const MomentaryButton: React.FC<{
    onPressChange: (pressed: boolean) => void;
    children: React.ReactNode;
    variant?: MomentaryVariant;
    fullWidth?: boolean;
}> = ({ onPressChange, children, variant = "primary", fullWidth }) => {
    const press = () => onPressChange(true);
    const release = () => onPressChange(false);
    return (
        <Button
            size="1"
            {...buttonProps(variant)}
            style={fullWidth ? { width: "100%" } : undefined}
            onMouseDown={press}
            onMouseUp={release}
            onMouseLeave={release}
            onTouchStart={press}
            onTouchEnd={release}>
            {children}
        </Button>
    );
};

export interface ResetPortButtonProps {
    onPressChange: (pressed: boolean) => void;
    onReleased: () => void;
}

export class ResetPortButton extends React.Component<ResetPortButtonProps> {
    private pressed = false;

    private handlePress = (): void => {
        this.pressed = true;
        this.props.onPressChange(true);
    };

    private handleRelease = (): void => {
        if (!this.pressed) return;
        this.pressed = false;
        this.props.onPressChange(false);
        this.props.onReleased();
    };

    render() {
        return (
            <Button
                size="1"
                variant="soft"
                color="gray"
                onMouseDown={this.handlePress}
                onMouseUp={this.handleRelease}
                onMouseLeave={this.handleRelease}
                onTouchStart={this.handlePress}
                onTouchEnd={this.handleRelease}>
                Reset port
            </Button>
        );
    }
}
