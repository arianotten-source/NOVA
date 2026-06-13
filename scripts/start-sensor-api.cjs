const { startSensorServer } = require('../dist-electron/backend/api/sensorServer.js');
startSensorServer(3847);
console.log('Sensor API gestart op poort 3847');
