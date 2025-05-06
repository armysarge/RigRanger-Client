// A simple virtual serialport implementation that emulates SerialPort API
const EventEmitter = require('events');

class VirtualSerialPort extends EventEmitter {
  constructor(path, options = {}) {
    super();

    this.path = path;
    this.options = {
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      ...options
    };

    this.isOpen = false;

    // Open the port automatically when created (like SerialPort API)
    process.nextTick(() => {
      this.open();
    });
  }

  open() {
    this.isOpen = true;
    this.emit('open');
    return this;
  }

  close() {
    this.isOpen = false;
    this.emit('close');
    return this;
  }

  write(data, callback) {
    if (!this.isOpen) {
      const err = new Error('Port is not open');
      if (callback) callback(err);
      return Promise.reject(err);
    }

    // The data is just emitted and not actually sent anywhere
    this.emit('datawritten', data);

    if (callback) {
      callback(null);
    }

    return Promise.resolve();
  }

  // Mock method to simulate receiving data
  receive(data) {
    if (this.isOpen) {
      // Convert to Buffer if string
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }

      // Emit a 'data' event with the received data
      this.emit('data', data);
    }
  }

  // Add support for piping
  pipe(destination) {
    this.on('data', (data) => {
      destination.write(data);
    });

    return destination;
  }

  // Static method to list mock serial ports
  static list() {
    return Promise.resolve([
      {
        path: 'COM1',
        manufacturer: 'Virtual Device',
        serialNumber: 'VIRTUAL001',
        pnpId: undefined,
        locationId: undefined,
        vendorId: '0000',
        productId: '0000'
      },
      {
        path: 'COM99',
        manufacturer: 'RigRanger Virtual Radio',
        serialNumber: 'RIGRANGER001',
        pnpId: undefined,
        locationId: undefined,
        vendorId: '0000',
        productId: '0000'
      }
    ]);
  }
}

// Export the constructor
module.exports = {
  virtualSerialPort: VirtualSerialPort
};
