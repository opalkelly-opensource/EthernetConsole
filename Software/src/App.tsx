/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import { AlertDialog, Text, Button, Flex, Separator } from "@radix-ui/themes";

import {
    IDevice,
    IDeviceInfo,
    IDeviceManager,
    IFPGADataPortClassic,
    IEventSubscription,
    WorkQueue,
    DataProgressCallback,
    ByteCount
} from "@opalkelly/frontpanel-platform-api";

import FrontPanel from "./FrontPanel";

// Webpack discovers and bundles all .bit files under assets/bitfiles/ at build time.
// The set of supported devices is derived from the directory names present there.
// Each subdirectory must match the product name returned by IDeviceInfo.productName
// (e.g., "XEM8320-AU25P"). To add or remove board support, add or remove the
// board's directory under assets/bitfiles/.
//
// To target a single board, replace this block with:
//   import "../assets/bitfiles/XEM8320-AU25P/EthernetConsole-ExampleDesign.bit";
//   const supportedDevices = new Set<string>(["XEM8320-AU25P"]);
const bitfilesContext = require.context("../assets/bitfiles", true, /\.bit$/);
bitfilesContext.keys().forEach(bitfilesContext);
const supportedDevices = new Set<string>(bitfilesContext.keys().map((k) => k.split("/")[1]));

import FrontPanelLogo from "../assets/logo512.png";

interface ErrorProperties {
    title: string;
    description: string;
    details: string;
    solution: string;
}

/**
 * Loads the specified configuration file into the FPGA on the specified device.
 * @param filename The name of the configuration file to load.
 * @param productName The product name used to locate the bitfile.
 * @param device The device to load the configuration file into.
 */
const loadConfiguration = async (
    filename: string,
    productName: string,
    device: IDevice
): Promise<void> => {
    console.log("Loading Configuration File:", filename);

    const response = await fetch(
        `frontpanel://localhost/assets/bitfiles/${productName}/${filename}`
    );

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const arrayBuffer = await response.arrayBuffer();

    const reportProgress: DataProgressCallback = (total: ByteCount, completed: ByteCount) => {
        console.log("Configuration Progress: ", completed, " of ", total);
    };

    await device.getFPGAConfiguration().loadConfigurationFromMemory(arrayBuffer, reportProgress);

    console.log("Load Configuration Complete");
};

const isENET1G = (model: unknown): boolean =>
    typeof model === "string" && model.startsWith("SZG-ENET1G");

class ConnectError extends Error {
    constructor(public readonly properties: ErrorProperties) {
        super(properties.title);
    }
}

const openTargetDevice = async (
    deviceManager: IDeviceManager,
    targetSerial: string
): Promise<{ device: IDevice; deviceInfo: IDeviceInfo }> => {
    try {
        console.log("Opening Device...");
        const device = await deviceManager.openDevice(targetSerial);
        const deviceInfo = await device.getDeviceInfo();
        console.log(
            "Opened Device:",
            deviceInfo.productName,
            " SerialNumber:",
            deviceInfo.serialNumber
        );
        return { device, deviceInfo };
    } catch (err) {
        console.error(`Failed to open Device ${targetSerial}:\n${err}`);
        throw new ConnectError({
            title: "Failed to Open Target Device",
            description: `Unable to open device with serial number ${targetSerial}`,
            details: `${err}`,
            solution: "Verify that the device is properly connected and restart the application."
        });
    }
};

const verifyDeviceSupported = (deviceInfo: IDeviceInfo): void => {
    if (supportedDevices.has(deviceInfo.productName)) return;
    console.error(`Device ${deviceInfo.productName} is not supported by this application.`);
    throw new ConnectError({
        title: "Device Not Supported",
        description: `${deviceInfo.productName} with serial number ${deviceInfo.serialNumber} is not supported by this application.`,
        details: `Supported devices:\n${[...supportedDevices].join("\n")}`,
        solution: "Connect a supported device and restart the application."
    });
};

const detectPeripherals = async (
    device: IDevice,
    deviceInfo: IDeviceInfo
): Promise<{ portCDetected: boolean }> => {
    try {
        const deviceSettings = await device.getDeviceSettings();
        const portAModel = await deviceSettings?.getValue("SYZYGY0_PRODUCT_MODEL");
        const portCModel = await deviceSettings?.getValue("SYZYGY2_PRODUCT_MODEL");

        console.log(`Detected on SYZYGY Port A: ${portAModel || "<empty>"}`);
        console.log(`Detected on SYZYGY Port C: ${portCModel || "<empty>"}`);

        if (!isENET1G(portAModel)) {
            throw new ConnectError({
                title: "Failed to find SZG-ENET1G peripheral",
                description: `Unable to find SZG-ENET1G module on SYZYGY Port A of ${deviceInfo.productName} with serial number ${deviceInfo.serialNumber}`,
                details: "",
                solution:
                    "Verify that the SZG-ENET1G is connected on SYZYGY Port A of the device and restart the application."
            });
        }

        return { portCDetected: isENET1G(portCModel) };
    } catch (err) {
        if (err instanceof ConnectError) throw err;
        console.error(`Failed to query peripherals on Device ${deviceInfo.serialNumber}:\n${err}`);
        throw new ConnectError({
            title: "Failed to Query Peripherals on Device",
            description: `Unable to query peripherals on ${deviceInfo.productName} with serial number ${deviceInfo.serialNumber}`,
            details: `${err}`,
            solution: "Verify that the device is properly connected and restart the application."
        });
    }
};

const initializeFPGA = async (
    device: IDevice,
    deviceInfo: IDeviceInfo
): Promise<IFPGADataPortClassic> => {
    try {
        await loadConfiguration(
            "EthernetConsole-ExampleDesign.bit",
            deviceInfo.productName,
            device
        );
        return await device.getFPGADataPortClassic();
    } catch (err) {
        console.error(`Failed to initialize Device ${deviceInfo.serialNumber}:\n${err}`);
        throw new ConnectError({
            title: "Failed to Initialize Device",
            description: `Unable to initialize ${deviceInfo.productName} with serial number ${deviceInfo.serialNumber}`,
            details: `${err}`,
            solution: "Verify that the device is properly connected and restart the application."
        });
    }
};

interface AppState {
    fpgaDataPort?: IFPGADataPortClassic;
    portCDetected: boolean;
    error?: ErrorProperties;
}

class App extends React.Component<Record<string, never>, AppState> {
    private readonly workQueue = new WorkQueue();
    private device?: IDevice;
    private deviceInfo?: IDeviceInfo;
    private deviceDisconnectedSubscription?: IEventSubscription;

    state: AppState = {
        portCDetected: false
    };

    componentDidMount(): void {
        const targetDeviceSerialNumber =
            window.FrontPanelEnv.targetDeviceSerialNumbers.length > 0
                ? window.FrontPanelEnv.targetDeviceSerialNumbers[0]
                : "";
        const deviceManager = window.FrontPanelAPI.deviceManager;

        deviceManager.startMonitoring();

        this.workQueue.post(async () => {
            try {
                const opened = await openTargetDevice(deviceManager, targetDeviceSerialNumber);
                this.device = opened.device;
                this.deviceInfo = opened.deviceInfo;
                verifyDeviceSupported(this.deviceInfo);
                const { portCDetected } = await detectPeripherals(this.device, this.deviceInfo);
                const dataPort = await initializeFPGA(this.device, this.deviceInfo);

                this.setState({ portCDetected, fpgaDataPort: dataPort });

                const capturedSerial = this.deviceInfo.serialNumber;
                const capturedProduct = this.deviceInfo.productName;
                this.deviceDisconnectedSubscription =
                    deviceManager.deviceDisconnectedEvent.subscribeAsync(
                        async (_sender, serialNumber) => {
                            console.info("Device Disconnected: " + serialNumber);
                            if (serialNumber === capturedSerial) {
                                this.setState({
                                    fpgaDataPort: undefined,
                                    error: {
                                        title: "Target Device Disconnected",
                                        description: `${capturedProduct} with serial number ${capturedSerial} was disconnected`,
                                        details: "",
                                        solution:
                                            "Connect the target device and restart the application."
                                    }
                                });
                            }
                        }
                    );
            } catch (err) {
                if (err instanceof ConnectError) {
                    this.device?.close();
                    this.setState({ error: err.properties });
                } else {
                    throw err;
                }
            }
        });
    }

    componentWillUnmount(): void {
        this.deviceDisconnectedSubscription?.cancel();

        const deviceManager = window.FrontPanelAPI.deviceManager;
        const device = this.device;
        this.workQueue.post(async () => {
            await deviceManager.stopMonitoring();
            console.log("Closing Device...");
            device?.close();
        });
    }

    private onExitButtonClick = (): void => {
        window.close();
    };

    render() {
        const { fpgaDataPort, portCDetected, error } = this.state;

        const errorDialog = (
            <AlertDialog.Root open={error !== undefined}>
                <AlertDialog.Content maxWidth="450px">
                    <AlertDialog.Title>{error?.title}</AlertDialog.Title>
                    <Separator my="3" size="4" />
                    <AlertDialog.Description size="2">{error?.description}</AlertDialog.Description>
                    <Flex direction="column" gap="4" p="2">
                        {error?.details && (
                            <Text size="2" weight="regular" style={{ whiteSpace: "pre-line" }}>
                                {error.details}
                            </Text>
                        )}
                        <Text size="2" weight="regular">
                            Solution: {error?.solution}
                        </Text>
                    </Flex>
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Action>
                            <Button onClick={this.onExitButtonClick} variant="solid" color="red">
                                Exit
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        );

        return (
            <Flex
                align="center"
                justify="center"
                style={{ minHeight: "100vh", backgroundColor: "#282c34" }}>
                {fpgaDataPort !== undefined ? (
                    <FrontPanel
                        fpgaDataPort={fpgaDataPort}
                        workQueue={this.workQueue}
                        portCDetected={portCDetected}
                    />
                ) : (
                    <img src={FrontPanelLogo} />
                )}
                {errorDialog}
            </Flex>
        );
    }
}

export default App;
