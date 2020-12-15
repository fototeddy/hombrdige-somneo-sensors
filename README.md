# homebridge-somneo-sensors

[HomeBridge](http://github.com/nfarina/homebridge) module for Philips Somneo sensordata

Temperature Humidity and Lux can be displayed in Homekit as SensorValues.
This Plugin uses FakeGato-History for temperature and humidity
At the Moment FakeGate-History is hard coded as true and storage:fs the config options for "history" don't do anything at this time. 
## ToDo

- add Somneo Noise Data

## Based on the following Work

This Plugin is based on the [hombridge-airrohr](https://github.com/toto/homebridge-airrohr) Plugin to work in Homebridge
The idea on fetching the Somneo Data is based on [home-assistant-somneosensor](https://github.com/pijiulaoshi/home-assistant-somneosensor)
