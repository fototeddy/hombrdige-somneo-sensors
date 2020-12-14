//seems to do  not be used in this projekt
const inherits = require('util').inherits;

function CustomCharacteristics(Characteristic) {
  this.AirPressure = function() {
    Characteristic.call(this, 'Noise', 'E863F10F-079E-48FF-8F27-9C2605A29F52');
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'hectopascals',
      minValue: 0,
      maxValue: 200,
      minStep: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(this.AirPressure, Characteristic);

  return this;
}


module.exports = CustomCharacteristics;
