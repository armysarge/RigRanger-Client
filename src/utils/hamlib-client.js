/**
 * HamlibClient class
 *
 * A utility class for communicating with a remote Hamlib server via network.
 * This class provides an abstraction over the Hamlib network protocol and
 * allows easy interaction with a remote radio connected via rigctld.
 */

const { EventEmitter } = require('events');
const net = require('net');

class HamlibClient extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.connected = false;
    this.host = '';
    this.port = 4532;
    this.commandQueue = [];
    this.processing = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // ms
  }

  /**
   * Connect to the remote Hamlib rigctld server
   * @param {string} host - Hostname or IP address
   * @param {number} port - Port number (default: 4532)
   * @returns {Promise} - Resolves when connected, rejects on error
   */
  connect(host, port = 4532) {
    return new Promise((resolve, reject) => {
      this.host = host;
      this.port = port;
      this.reconnectAttempts = 0;

      // Create new socket connection
      this.socket = new net.Socket();

      // Setup event handlers
      this.socket.on('connect', () => {
        this.connected = true;
        this.emit('status', {
          status: 'connected',
          message: `Connected to ${this.host}:${this.port}`
        });

        // Process any queued commands
        this.processQueue();

        resolve();
      });

      this.socket.on('data', (data) => {
        const response = data.toString().trim();
        this.emit('data', response);
      });

      this.socket.on('error', (err) => {
        this.emit('status', {
          status: 'error',
          message: `Connection error: ${err.message}`
        });
        reject(err);
      });

      this.socket.on('close', () => {
        this.connected = false;
        this.emit('status', {
          status: 'disconnected',
          message: 'Disconnected from server'
        });

        // Attempt to reconnect if needed
        this.attemptReconnect();
      });

      // Connect to the server
      this.emit('status', {
        status: 'connecting',
        message: `Connecting to ${host}:${port}...`
      });

      this.socket.connect(port, host);
    });
  }

  /**
   * Attempt to reconnect to the server after disconnection
   * @private
   */
  attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      this.emit('status', {
        status: 'reconnecting',
        message: `Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      this.reconnectTimer = setTimeout(() => {
        this.connect(this.host, this.port)
          .catch(() => {
            // Connect failed, will try again through the close event
          });
      }, this.reconnectDelay);
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }

    this.connected = false;
    this.emit('status', {
      status: 'disconnected',
      message: 'Disconnected from server'
    });
  }

  /**
   * Send a raw command to the rigctld server
   * @param {string} command - The command to send
   * @returns {Promise} - Resolves with response, rejects on error
   */
  sendCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        this.commandQueue.push({ command, resolve, reject });
        return;
      }

      // Add newline if not present
      const fullCommand = command.endsWith('\n') ? command : command + '\n';

      // Create a response handler
      const responseHandler = (data) => {
        const response = data.toString().trim();

        // Remove the listener after getting a response
        this.socket.removeListener('data', responseHandler);

        if (response.startsWith('RPRT -')) {
          // Error response
          const errorCode = parseInt(response.split(' ')[1], 10);
          const error = new Error(`Command failed with code ${errorCode}`);
          error.code = errorCode;
          reject(error);
        } else {
          resolve(response);
        }

        // Process next command in queue
        this.processQueue();
      };

      // Add the response handler
      this.socket.once('data', responseHandler);

      // Send the command
      this.socket.write(fullCommand);
    });
  }

  /**
   * Process the command queue
   * @private
   */
  processQueue() {
    if (this.processing || this.commandQueue.length === 0 || !this.connected) {
      return;
    }

    this.processing = true;
    const { command, resolve, reject } = this.commandQueue.shift();

    this.sendCommand(command)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.processing = false;
        this.processQueue();
      });
  }

  /**
   * Get radio information
   * @returns {Promise} - Resolves with radio info object
   */
  async getInfo() {
    try {
      // Get radio model and version
      const dump = await this.sendCommand('\\dump_state');
      const lines = dump.split('\n');

      const info = {
        model: '',
        version: '',
        capabilities: []
      };

      for (const line of lines) {
        if (line.startsWith('Caps dump for model:')) {
          info.model = line.replace('Caps dump for model:', '').trim();
        } else if (line.startsWith('Rig version:')) {
          info.version = line.replace('Rig version:', '').trim();
        } else if (line.includes('Can ')) {
          // Extract capabilities
          info.capabilities.push(line.trim());
        }
      }

      return info;
    } catch (error) {
      throw new Error(`Failed to get radio info: ${error.message}`);
    }
  }

  /**
   * Get the current frequency
   * @returns {Promise<number>} - Resolves with frequency in Hz
   */
  async getFrequency() {
    try {
      const response = await this.sendCommand('f');
      return parseInt(response, 10);
    } catch (error) {
      throw new Error(`Failed to get frequency: ${error.message}`);
    }
  }

  /**
   * Set the frequency
   * @param {number} frequency - Frequency in Hz
   * @returns {Promise} - Resolves on success
   */
  async setFrequency(frequency) {
    try {
      await this.sendCommand(`F ${frequency}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to set frequency: ${error.message}`);
    }
  }

  /**
   * Get the current mode and passband
   * @returns {Promise<object>} - Resolves with { mode, passband }
   */
  async getMode() {
    try {
      const response = await this.sendCommand('m');
      const [mode, passband] = response.split('\n');
      return {
        mode: mode.trim(),
        passband: parseInt(passband, 10)
      };
    } catch (error) {
      throw new Error(`Failed to get mode: ${error.message}`);
    }
  }

  /**
   * Set the mode and passband
   * @param {string} mode - Mode (USB, LSB, AM, FM, etc.)
   * @param {number} passband - Passband in Hz (0 = default)
   * @returns {Promise} - Resolves on success
   */
  async setMode(mode, passband = 0) {
    try {
      await this.sendCommand(`M ${mode} ${passband}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to set mode: ${error.message}`);
    }
  }

  /**
   * Get PTT (transmit) status
   * @returns {Promise<boolean>} - Resolves with true if transmitting
   */
  async getPTT() {
    try {
      const response = await this.sendCommand('t');
      return parseInt(response, 10) === 1;
    } catch (error) {
      throw new Error(`Failed to get PTT status: ${error.message}`);
    }
  }

  /**
   * Set PTT (transmit) status
   * @param {boolean} ptt - True to transmit, false for receive
   * @returns {Promise} - Resolves on success
   */
  async setPTT(ptt) {
    try {
      await this.sendCommand(`T ${ptt ? 1 : 0}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to set PTT: ${error.message}`);
    }
  }

  /**
   * Get a level value (gain, meter, etc.)
   * @param {string} level - Level name (RFGAIN, SQL, STRENGTH, etc.)
   * @returns {Promise<number>} - Resolves with level value (usually 0-1)
   */
  async getLevel(level) {
    try {
      const response = await this.sendCommand(`l ${level}`);
      return parseFloat(response);
    } catch (error) {
      throw new Error(`Failed to get level ${level}: ${error.message}`);
    }
  }

  /**
   * Set a level value
   * @param {string} level - Level name (RFGAIN, SQL, etc.)
   * @param {number} value - Level value (usually 0-1)
   * @returns {Promise} - Resolves on success
   */
  async setLevel(level, value) {
    try {
      await this.sendCommand(`L ${level} ${value}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to set level ${level}: ${error.message}`);
    }
  }

  /**
   * Get a function status (VOX, NB, etc.)
   * @param {string} func - Function name
   * @returns {Promise<boolean>} - Resolves with function status
   */
  async getFunction(func) {
    try {
      const response = await this.sendCommand(`u ${func}`);
      return parseInt(response, 10) === 1;
    } catch (error) {
      throw new Error(`Failed to get function ${func}: ${error.message}`);
    }
  }

  /**
   * Set a function status
   * @param {string} func - Function name
   * @param {boolean} status - Function status (on/off)
   * @returns {Promise} - Resolves on success
   */
  async setFunction(func, status) {
    try {
      await this.sendCommand(`U ${func} ${status ? 1 : 0}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to set function ${func}: ${error.message}`);
    }
  }
}

module.exports = HamlibClient;
