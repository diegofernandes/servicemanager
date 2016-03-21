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
exports.entrypoint = function(metadata) {
  console.log("engine_R: executing entrypoint(" + metadata.plugin + ")");
  if(config.TYPE !== "MASTER" && metadata.executionContext === "master" ) return;
  exec("./" + metadata.plugin + ".R", {cwd: './plugins/' + metadata.plugin + "/"}, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
  });
}

/*
* Schedule plugin
*/
exports.schedule = function(metadata) {
  var jobId = crontab.scheduleJob(metadata.schedule, exports.entrypoint, [metadata]);
  console.log("engine_R: \t" + jobId + "\t" + metadata.schedule + "\t" + metadata.plugin + ".js");
}
