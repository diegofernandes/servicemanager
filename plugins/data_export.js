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
var fs = require('fs');
var S3Client = require('s3client');
var mysql = require('../mysql');

/*
* Export Data entrypoint
*/
exports.entrypoint = function() {
  if(config.TYPE !== "MASTER") return;
  console.log("Exporting data to S3...");
  // Get lines to create the CSV File
  if(config.export.enabled) {
    console.log("Exporting data older than " + config.export.days + " days...");
    mysql.pool.query('select * from `IOTDB`.`Facts` where datediff(now(), `creationDate`) >' + (config.export.days - 1), createCSV);
  } else {
    console.log("Export feature disabled.");
  }
}

/*
* Create the CSV File
*/
function createCSV(err, rows, fields) {
    console.log("Creating CSV file...");
    if(err) {
      console.log("Error creating file.");
      console.log(err);
      return;
    }
    var d = new Date();
    if (rows.length === 0) {
      console.log("There's no data for exporting...");
      return;
    }
    var fileName = "MECCANO-" + d.getFullYear() + "-" +
                      (d.getMonth() + 1) + "-" + d.getDate() + "-" + (d.getHours() + 1) + "-" +
                      d.getMinutes() + "-" + d.getSeconds() + ".CSV";
    console.log("Creating file " + fileName + "...");
    for(var i = 0; i < rows.length; i++) {
      var line = rows[i].channel + ";" + rows[i].year + ";" + rows[i].month + ";" + rows[i].day + ";" + rows[i].week_day + ";" +
                  rows[i].hour + ";" + rows[i].minute + ";" + rows[i].second + ";" +
                  rows[i].device_group + ";" + rows[i].device + ";" + ( rows[i].sensor || 0) + ";"  +
                  rows[i].data + "\n";
      // console.log(linha);
      fs.appendFileSync("/tmp/" + fileName, line);
    }
    console.log("File creation successful...");
    // Uploading file to S3
    uploadS3(config.export.remoteDirectory + fileName, config.export.localDirectory + fileName);
}

/*
* Upload file to Amazon S3
*/
function uploadS3(remoteFilename, fileName) {
  console.log("Uploading file to s3://" + config.export.bucket + "/" + remoteFilename);
  var options = {
        'key' : config.aws.accessKeyId,
        'secret' : config.aws.secretAccessKey,
        "sslEnabled" : config.aws.sslEnabled,
        'bucket' : config.export.bucket
  };
  var client = new S3Client(options);
  var fileSize = getFilesize(fileName);
  client.put(fileName, remoteFilename, 'application/csv', fileSize, function(err,resp){
    console.log("Checking file status...");
    if(!err) {
      // Se estiver programado para expurgar dados, realiza limpeza na base
      if(resp.statusCode === 200) {
        console.log(config.export.purge);
        if(config.export.purge === "true") {
          console.log("Purging old data from database...");
          mysql.pool.query('delete from `IOTDB`.`Facts` where datediff(now(), `creationDate`) >' + (config.export.days - 1), function(err, result) {
            if(err) {
             console.log("Error on purging data...");
             console.log(err);
            } else {
              console.log(result.affectedRows + ' lines removed...');
            }
          });
        } else {
          console.log("Database purge disabled...");
        }
      }
      // Removendo o arquivo temporario gerado...
      console.log("Cleaning temp directory...");
      fs.unlinkSync(fileName);
    } else {
      console.log(err);
    }
  });
}

/*
* Get the filesize
*/
function getFilesize(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}
