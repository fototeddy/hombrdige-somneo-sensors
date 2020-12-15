'use strict';
var Service, Characteristic, CustomCharacteristic, Accessory, FakeGatoHistoryService;

const DataCache = require('./lib/data_cache');
const moment = require('moment');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  //CustomCharacteristic = require('./lib/custom_characteristics')(Characteristic);
  Accessory = homebridge.hap.Accessory;
  FakeGatoHistoryService = require('fakegato-history')(homebridge);

  homebridge.registerAccessory(
    "homebridge-somneo",
    "somneo",
    SomneoAccessory
  );
};

class SomneoAccessory {
  constructor(log, config) {
    this.category = Accessory.Categories.SENSOR;
    this.log = log;
    this.displayName = config["name"];
    this.dataCache = null;
    this.jsonURL = config["json_data"];
    this.SomneoModel = config["Somneo-Model"];
    if (!this.jsonURL && !this.temperatureDataURL) {
      throw new Error("Invalid configuration");
    }
    this.updateIntervalSeconds = config["update_interval_seconds"];
    if (!this.updateIntervalSeconds) {
      this.updateIntervalSeconds = 120;
    }
    this.log("Somneo: Update interval", this.updateIntervalSeconds, "s");
    this.historyOptions = config["history"] || {}; //actually this does not effect anything at the moment
    const haveTemperatureData = !!this.jsonURL;
    // Information
    this.informationService = new Service.AccessoryInformation();
    this.informationService.setCharacteristic(Characteristic.Manufacturer, "Philips");
    this.informationService.setCharacteristic(Characteristic.Model, this.SomneoModel);
    this.informationService.setCharacteristic(Characteristic.SerialNumber, "001");
    if (haveTemperatureData) {
      // Temperature Sensor
      this.temperatureService = new Service.TemperatureSensor(`Temperature ${this.displayName}`);
      this.lightService = new Service.LightSensor(`Light ${this.displayName}`);
      //this.noiseService = new CustomCharacteristic.Noise(`Noise ${this.displayName}`);
      //  this.temperatureService.addOptionalCharacteristic(CustomCharacteristic.AirPressure);
      // Humidity sensor
      this.humidityService = new Service.HumiditySensor(`Humidity ${this.displayName}`);
      // comment out this line if you do not want to use FakeGatoHistoryService
      this.loggingService = new FakeGatoHistoryService('weather', this, { storage: 'fs' });
    }
    this.updateServices = (dataCache) => {
      this.dataCache = dataCache;
      const {
        lux,
        noise,
        temperature,
        humidity,
      } = dataCache;

      this.informationService.setCharacteristic(Characteristic.FirmwareRevision, dataCache.software_version);
      if (haveTemperatureData && temperature) {
        this.log("Measured temperature", temperature, "°C");
        this.temperature = parseFloat(temperature);
        this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, this.temperature);
      }
      if (haveTemperatureData && humidity) {
        this.log("Measured humidity", humidity, "%");
        this.humidity = humidity;
        this.humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.humidity);
      }
      if (haveTemperatureData && lux) {
        this.log("Measured light level", lux, "LUX");
        this.lux = lux;
        this.lightService.setCharacteristic(Characteristic.CurrentAmbientLightLevel, this.lux);
      }
    /*  if (haveTemperatureData && noise) {
        this.log("Measured noise level", noise, "dB");
        this.noise = noise;
this.temperatureService.setCharacteristic(CustomCharacteristic.AirPressure, this.noise);
        //this.noiseService.setCharacteristic(CustomCharacteristic.Noise, this.noise);
      }*/


      if (haveTemperatureData) {
        this.loggingService.addEntry({
          time: moment().unix(),
          temp: temperature,
          //lux: lux, //do not log lux cause EVE don't know what to do with it
          humidity: humidity,
          //noise: noise //do not log noise cause EVE don't know what to do with it
        });
      }
    };
    this.dataCache = new DataCache();
    this.isUpdating = false;
    this.updateCache = (callback) => {
      if (this.isUpdating) {
        if (callback) {
          callback(null);
        }
        return;
      }
      this.isUpdating = true;
      const updateCallback = (error) => {
        this.isUpdating = false;
        if (error) {
          this.log(`Could not get sensor data: ${error}`);
        }
        else {
          this.updateServices(this.dataCache);
        }
        if (callback) {
          callback(error);
        }
      };
      if (this.jsonURL) {
        this.dataCache.updateFromLocalSensor(this.jsonURL, updateCallback);
      }
    };
    let time = this.updateIntervalSeconds * 1000; // 1 minute
    setInterval(() => {
      this.updateCache();
    }, time);
    this.updateCache();

    if (haveTemperatureData) {
      this.humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on("get", callback => callback(null, this.humidity));
      this.temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
          format: Characteristic.Formats.FLOAT,
          unit: Characteristic.Units.CELSIUS,
          maxValue: 100,
          minValue: -100,
          minStep: 0.1,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        .on("get", callback => callback(null, this.temperature));
      this.lightService
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .setProps({
            minValue: this.minSensorValue,
            maxValue: this.maxSensorValue
                })
        .on('get', callback => callback(null, this.lux));
      //this.noiseService
    //    .getCharacteristic(CustomCharacteristic.Noise)
    //    .on("get", callback => callback(null, this.noise));
    }
  }

  getServices() {
    return [
      this.temperatureService,
      this.informationService,
      this.humidityService,
      this.lightService,
      //this.noiseService,
      this.loggingService
    ].filter(function (s) {
      return s !== undefined;
    });
  }
}
