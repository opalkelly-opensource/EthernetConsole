The Ethernet Console example app provides a real-time GUI for testing and controlling dual Ethernet MAC ports on the [XEM8320](https://opalkelly.com/products/xem8320/) with the [SZG-ENET1G](https://docs.opalkelly.com/syzygy-peripherals/szg-enet1g/). Built on AMD's Tri-Mode Ethernet MAC example design, functionality includes:

* Independent configuration and monitoring of Port A and Port C Ethernet interfaces.
* Speed negotiation (10/100/1000 Mb/s) with PHY and HDL loopback modes.
* TX data generation and RX data checking with real-time packet counters.
* MAC address management including reading unique addresses from device EEPROM.
* Error injection and detection.

## Compatibility

The Ethernet Console app is compatible with the following FPGA module and peripheral combinations:

* XEM8320
  * 1x [SZG-ENET1G](https://docs.opalkelly.com/syzygy-peripherals/szg-enet1g/) (Loopback mode)
  * 2x [SZG-ENET1G](https://docs.opalkelly.com/syzygy-peripherals/szg-enet1g/)

## Usage

The GUI presents two port panels (Port A and Port C), each with controls for Ethernet configuration and real-time status monitoring.

### Port Configuration

* Select the advertised speed (10/100/1000 Mb/s) and update using the corresponding button.
* Enable or disable TX data generation and RX data checking with the corresponding toggles.
* Enable PHY loopback or HDL loopback (with optional address swap) for testing.
* Set destination and source MAC addresses for packet generation and checking.

### Status Monitoring

* Link status, duplex mode, and RX activity indicators update in real time.
* PHY negotiated speed and packet sent/received counters are displayed per port.
* Reset counters or inject/reset errors as needed for testing.

## Version History

* 1.0.0 (released 2026-04-14)
  * Initial release
