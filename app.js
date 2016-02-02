/*
* Meccano IOT ServiceManager
*
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.

* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*/

'use strict';

var http = require('http');
var crontab = require('node-crontab');

// Set the environment, location of the config file and load configuration
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.CONFIG_FILE = process.env.CONFIG_FILE ||  './config/config.yml';
var config  = require('./config');

// Starting monitoring PORT
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end(config.TYPE);
});
server.listen(config.port);
console.log('Meccano IoT ServiceManager started monitoring at %d, in %s mode', config.port, config.environment);

// Load Service Plugins
var monitor = require('./services/monitor.js');
var devices = require('./services/devices.js');
var statistics = require('./services/statistics.js');
var data_export = require('./services/data_export.js');
var historyStatus = require('./services/historyStatus.js');

// Schedule service jobs
crontab.scheduleJob(config.scheduler.monitor, monitor.entrypoint);
crontab.scheduleJob(config.scheduler.devices, devices.entrypoint);
crontab.scheduleJob(config.scheduler.statistics, statistics.entrypoint);
crontab.scheduleJob(config.scheduler.export, data_export.entrypoint);
crontab.scheduleJob(config.scheduler.historyStatus, historyStatus.entrypoint);
