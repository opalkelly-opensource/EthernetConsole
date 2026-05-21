/**
 * Copyright (c) 2026 Opal Kelly Incorporated
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

import * as ReactDOM from "react-dom/client";

import "./index.css";

import "@radix-ui/themes/styles.css";

import { Theme } from "@radix-ui/themes";

import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
    <Theme appearance="dark" accentColor="green" grayColor="slate">
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </Theme>
);
