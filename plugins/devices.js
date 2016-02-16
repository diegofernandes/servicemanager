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
  console.log("Creating device report...");
  var query = "select device, timestampdiff(MINUTE, `lastAnnouncementDate`, now()) as announcement_time from `IOTDB`.`Announcement` where timestampdiff(MINUTE, `lastAnnouncementDate`, now()) > 0";
  console.log(query);
  mysql.pool.query(query, createDeviceReport);
}

/**
* Create Text of Report
**/
function createDeviceReport(err, rows, fields) {
  console.log("Creating device report...");
  if(err) {
    console.log("Report not created.");
    console.log(err);
    return;
  }
  if (!rows || rows.length === 0) {
    console.log("No devices on warning/fail status.");
    return;
  }
  var text = "Report of devices in warning or fail status: \n";
  var failedDevices = 0;
  for(var i = 0; i < rows.length; i++) {
    if(rows[i].announcement_time > config.warninglimit ) {
      text += rows[i].device + ": " + rows[i].announcement_time + " minutes. \n";
      failedDevices++;
    }
  }

  if(failedDevices > 0) {
    console.log("Operational device report created!");
    publishMessage(text);
  } else {
    console.log("Operational device report skipped! - No devices in FAIL status.");
  }
}

/*
* Publish message to Amazon SNS
*/
function publishMessage(report) {
  console.log("Sending report to SNS topic...");
  var params = {
    Message: report,
    Subject: "Operational Report of Devices",
    TopicArn: config.aws.topicArn
  };
  console.log(params);
  var sns = new amazon.AWS.SNS();
  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}
