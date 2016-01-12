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
var pool  = require('../mysql');
var AWS  = require('../aws');

/**
* Create Device Report entrypoint
**/
exports.entrypoint = function() {
  if(config.TYPE !== "MASTER") return;
  pool.query(config.mysql.query, createDeviceReport);
}

/**
* Create Text of Report
**/
function createDeviceReport(err, rows, fields) {
  if(err) {
    console.log("Report not created.");
    return;
  }
  if (rows.length === 0) {
    return;
  }
  var text = "Report of devices in warning or fail status: \n";
  for(var i = 0; i < rows.length; i++) {
    if(rows[i].tempo_anuncio > config.limite_warning ) {
      text += rows[i].idDevice + " (" + rows[i].idLocal + ") \n";
    }
  }
  console.log(text);
  publishMessage(text);
}

/*
* Publish message to Amazon SNS
*/
function publishMessage(report) {
  var params = {
    Message: report,
    Subject: "Operational Report of Devices",
    TopicArn: config.aws.topicArn
  };
  var sns = new AWS.SNS();
  console.log(params);
  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}
