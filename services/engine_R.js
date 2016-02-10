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
exports.entrypoint = function(script) {
  console.log("engine_R: executing entrypoint(" + script + ")");
  if(config.TYPE !== "MASTER") return;
  exec("./" + script + ".R", {cwd: './plugins/'}, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
  });
}

/*
* Schedule plugin
*/
exports.schedule = function(schedule, scriptname) {
  var jobId = crontab.scheduleJob(schedule, exports.entrypoint, [scriptname]);
  console.log("engine_R: \t" + jobId + "\t" + schedule + "\t" + scriptname + ".js");

}
