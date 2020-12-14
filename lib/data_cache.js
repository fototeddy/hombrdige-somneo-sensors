const https = require('https');

class DataCache {
  constructor() {
    this.software_version = null;
    this.temperature = null;
    this.humidity = null;
    this.lux = null;
    this.noise = null;
  }

/*  updateFromLuftdatenAPI(airQualityUrl, temperatureSensorUrl, callback ) {
   let airQualityDataLoaded = !airQualityUrl;
    let temperatureDataLoaded = !temperatureSensorUrl;

    const loadAirQualityData = () => {
      this._loadCurrentSensorData(airQualityUrl, (error, airquality_json) => {
        if (error) {
          callback(error);
          return;
        }

        this._updateAirQuality(airquality_json);

        airQualityDataLoaded = true;
        next();
      });
    };

    const loadTemperatureData = () => {
      this._loadCurrentSensorData(temperatureSensorUrl, (error, temp_json) => {
        if (error) {
          callback(error);
          return;
        }

        this._updateHumidity(temp_json);
        this._updateTemperature(temp_json);
        this._updatePressure(temp_json);

        temperatureDataLoaded = true;
        next();
      });
    };

    const next = () => {
      if (!airQualityDataLoaded) {
        loadAirQualityData();
      } else if (!temperatureDataLoaded) {
        loadTemperatureData();
      } else {
        callback(null);
      }
    };

    next();
  }
*/
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
      //this._updateLux(json);
      //this._updateHumidity(json);
      //this._updateTemperature(json);
      //this._updateNoise(json);
      callback(null);
    })
  }
/*
  _updateHumidity(json) {

      const value = this._findValue(json, 'msrhu');
      //this.log('find value humi');
      if (value) {
      //  this.log('found value humi');
        //this.log(value);
        this.humidity = parseFloat(value);
        break;
      }
  }

  _updateTemperature(json) {

      const value = this._findValue(json, 'mstmp');
      if (value) {
        this.temperature = parseFloat(value);
        break;
      }

  }

  _updateLux(json) {
    const luxKeys = ['mslux'];
    for (let key of luxKeys) {
      const value = this._findValue(json, key);
      if (value) {
        this.lux = parseFloat(value);
        break;
      }
    }
  }

  _updateNoise(json) {
    const noiseKeys = ['mssnd'];
    for (let key of noiseKeys) {
      const value = this._findValue(json, key);
      if (value) {
        this.noise = parseFloat(value);
        break;
      }
    }
  }

  _findValue(json, key) {
    let basedata = json;
    // If loading data from API the result sometimes is
    // an array
    if (Array.isArray(basedata)) {
      basedata = basedata[0];
    }
    if (!basedata) {
      return null;
    }
    const sensorValues = basedata["sensordatavalues"];
    if (!sensorValues) {
      return null;
    }
    for (let valueSet of sensorValues) {
      if (key == valueSet["value_type"]) {
        return valueSet["value"];
      }
    }
    return null;
  }
*/
  _loadCurrentSensorData(jsonURL, callback) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    https.get(jsonURL, (res) => {
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
