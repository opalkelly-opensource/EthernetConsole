EthernetConsole Example Design
=======================
This is the EthernetConsole Example Design targeting the XEM8320 Opal Kelly development board. At least one SZG-ENET1G is required to run this example design. Product pages for these are at the following:
* [XEM8320 Opal Kelly Development Board](https://opalkelly.com/products/xem8320/)
* [SZG-ENET1G](https://opalkelly.com/products/szg-enet1g/)

This example design's overview, requirements, tutorials, and how-to's are located at:
* [EthernetConsole Example Design](https://docs.opalkelly.com/fpsdk/samples-and-tools/ethernet-reference-design/)

The pre-built bitfile is located in the repository's [Releases](https://github.com/opalkelly-opensource/EthernetConsole/releases). Note that this was built with an evaluation license and operation of the IP will halt after 2-8 hours from loading the bitfile.

## Overview
Our modified AMD Tri-Mode EthernetConsole MAC example design sources have been provided. We have annotated changes to the AMD sources with comments `// Opal Kelly`.
These comments will either be `// Opal Kelly additions` or `// Opal Kelly edits`.
You can search for these comments within these sources to determine what was changed from the example design provided by AMD.

Important changes to these sources are highlighted below.
* PHY configuration state machine now specifically targets the DP83867 PHY onboard the SZG-ENET1G.
* Added controllability and observability of the example design facilitated by the FrontPanel interface.
* Added functionality to set destination and source MAC addresses, inject errors, and count the number of packets sent and received.