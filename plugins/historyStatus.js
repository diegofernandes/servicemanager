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
var mysql  = require('../mysql');
var amazon  = require('../aws');

/**
* Create Device Report entrypoint
**/
exports.entrypoint = function() {
  if(config.TYPE !== "MASTER") return;
  console.log("Generating device history status...");
  var sql = "insert into `DeviceHistoryStatus` (status, numberOfDevices) ";
  sql += "select 'NORMAL' as `status`, count(*) as `numberOfDevices` from `Announcement` where timestampdiff(minute, `lastAnnouncementDate`, now()) <= ? ";
  sql += "union select 'WARNING' as `status`, count(*) as `numberOfDevices` from `Announcement` where timestampdiff(minute, `lastAnnouncementDate`, now()) between ? and ? ";
  sql += "union select 'FAIL' as `status`, count(*) as `numberOfDevices` from `Announcement` where timestampdiff(minute, `lastAnnouncementDate`, now()) > ? ";
  sql += "union select 'WAITING_APPROVE' as `status`, count(*) as `numberOfDevices` from `Registration` where `device_group` is null ";
  mysql.pool.query(sql, [5, 6, 15, 15], function(error, result, fields) {
    var purge = "delete from `DeviceHistoryStatus` where timestampdiff(hour, `creationDate`, now()) > 4 ";
    mysql.pool.query(purge)  ;
  });
}
