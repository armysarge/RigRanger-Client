// A mock implementation of virtual audio devices
const EventEmitter = require('events');

class VirtualAudioDevice extends EventEmitter {
  constructor(options = {}) {
    super();

    this.name = options.name || 'RigRanger Virtual Audio';
    this.type = options.type || 'input'; // 'input' or 'output'
    this.sampleRate = options.sampleRate || 48000;
    this.channels = options.channels || 2;
    this.isRunning = false;

    this._bufferSize = options.bufferSize || 4096;
    this._audioChunks = [];
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.emit('start');

      // In a real implementation, this would set up actual audio routing
      console.log(`Virtual audio device "${this.name}" (${this.type}) started`);
    }

    return this;
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      this.emit('stop');

      console.log(`Virtual audio device "${this.name}" (${this.type}) stopped`);
    }

    return this;
  }

  write(chunk) {
    if (!this.isRunning) {
      return false;
    }

    // In a real implementation, this would route audio data to the virtual device
    this._audioChunks.push(chunk);
    this.emit('data-written', chunk);

    // If we have enough data, emit a buffer-full event
    if (this._audioChunks.length * chunk.length >= this._bufferSize) {
      const buffer = Buffer.concat(this._audioChunks);
      this.emit('buffer-full', buffer);
      this._audioChunks = [];
    }

    return true;
  }

  // Simulate receiving audio data (for input devices)
  receive(chunk) {
    if (this.isRunning && this.type === 'input') {
      this.emit('data', chunk);
      return true;
    }

    return false;
  }

  // Get information about this virtual device
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      sampleRate: this.sampleRate,
      channels: this.channels,
      isRunning: this.isRunning
    };
  }

  // Static method to list available audio devices (mock implementation)
  static listDevices() {
    return {
      inputs: [
        { id: 'virtual-input-1', name: 'RigRanger Virtual Microphone' }
      ],
      outputs: [
        { id: 'virtual-output-1', name: 'RigRanger Virtual Speaker' }
      ]
    };
  }
}

// Export the constructor
module.exports = {
  VirtualAudioDevice
};
