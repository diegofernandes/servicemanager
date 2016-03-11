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

var config  = require('../config');
var sys = require('sys');
var exec = require('child_process').exec;
var crontab = require('node-crontab');

/*
* Generate Sensor Data Statistics
*/
function entrypoint(metadata) {
  console.log("engine_node: executing entrypoint(" + metadata.plugin + ")");
  if(config.TYPE !== "MASTER" && metadata.executionContext == "master" ) return;
  var service = require("../plugins/" + metadata.plugin + "/" + metadata.plugin + ".js" );
  service.entrypoint(metadata);
}

/*
* Schedule plugin
*/
exports.schedule = function(metadata) {
  var jobId = crontab.scheduleJob(metadata.schedule, entrypoint, [metadata]);
  console.log("engine_node: \t" + jobId + "\t" + metadata.schedule + "\t" + metadata.plugin + ".js");
}
