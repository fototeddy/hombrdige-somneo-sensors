const https = require('https');

class DataCache {
  constructor() {
    this.software_version = null;
    this.temperature = null;
    this.humidity = null;
    this.lux = null;
    this.noise = null;
  }

  updateFromLocalSensor(url, callback) {
    this._loadCurrentSensorData(url, (error, json) => {
      if (error) {
        callback(error);
        return;
      }
      const sensordata = json;
      this.humidity = parseFloat(sensordata.msrhu);
      this.temperature = parseFloat(sensordata.mstmp);
      this.lux = parseFloat(sensordata.mslux);
      this.noise = parseFloat(sensordata.mssnd);
      callback(null);
    })
  }

  _loadCurrentSensorData(jsonURL, callback) {
    const options = {
      rejectUnauthorized: false //somneo is using a SelfSigned Certificate for https communication and we want to ignore it
    }

    https.get(jsonURL, options, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        res.resume();
        callback(error, null);
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          callback(null, parsedData);
        } catch (error) {
          callback(error, null);
        }
      });
    }).on('error', (error) => {
      callback(error, null);
    });
  }
}

module.exports = DataCache;
