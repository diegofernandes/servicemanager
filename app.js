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
var express = require('express');
var app = express();

// Set the environment, location of the config file and load configuration
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.CONFIG_FILE = process.env.CONFIG_FILE ||  './config/config.yml';
var config  = require('./config');

app.get('/', function (req, res) {
  res.set('Content-Type', 'text/plain');
  res.status(200).send(config.TYPE);
});

app.use('/plugins/assets', express.static('./plugins/assets'));

app.listen(config.port, function () {
  console.log('Meccano IoT ServiceManager started monitoring at %d, in %s mode', config.port, config.environment);
});

// Load/Schedule Service Plugins
var monitor = require('./services/monitor.js');
console.log("Scheduling the monitor...");
crontab.scheduleJob(config.scheduler.monitor, monitor.entrypoint);

module.exports = app;


// Scan Plugins
var scanPlugins = require('./services/scanPlugins.js');


/*
var engine_R = require('./services/engine_R.js');
var engine_node = require('./services/engine_node.js');
var engine_python = require('./services/engine_python.js');

// Schedule user plugins and reports
console.log("Loading plugins...");
var pluginConfiguration = require('./config/plugins.json');
for(var p = 0; p < pluginConfiguration.length ; p++) {
  var plugin = pluginConfiguration[p];
  if(!plugin.enabled) continue;
  // R Engine
  if(plugin.engine == "R") {
    engine_R.schedule(plugin.schedule, plugin.plugin);
  }
  // Python Engine
  if(plugin.engine == "python") {
    engine_python.schedule(plugin.schedule, plugin.plugin);
  }
  // Node Engine
  if(plugin.engine == "node") {
    engine_node.schedule(plugin.schedule, plugin.plugin);
  }
}
*/
