/*
* Meccano IOT Gateway
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

// When starting, the instance will be SLAVE by default
var TYPE = "SLAVE";
exports.TYPE = TYPE;

var yamlConfig = require('node-yaml-config');

// Try loading the configuration file, if exists
var conf = yamlConfig.load(process.env.CONFIG_FILE, process.env.NODE_ENV);

// Load other configuration from environment or config file
process.env.PORT = process.env.PORT || conf.port || 8000;
process.env.ADDRESS = process.env.ADDRESS || conf.address;

process.env.WARNINGLIMIT = process.env.WARNINGLIMIT || conf.warninglimit || 60;
process.env.TZ = process.env.TZ ||  conf.timezone || 'Brazil/East';

process.env.SCHEDULER_MONITOR = process.env.SCHEDULER_MONITOR || conf.scheduler.monitor || '*/1 * * * *';
process.env.SCHEDULER_DEVICES = process.env.SCHEDULER_DEVICES || conf.scheduler.devices || '*/10 * * * *';
process.env.SCHEDULER_STATISTICS = process.env.SCHEDULER_STATISTICS || conf.scheduler.statistics || '* 0 * * *';
process.env.SCHEDULER_EXPORT = process.env.SCHEDULER_EXPORT || conf.scheduler.export || '* 2 * * *';
process.env.SCHEDULER_HISTORYSTATUS = process.env.SCHEDULER_HISTORYSTATUS || conf.scheduler.historyStatus || '*/1 * * * *';

process.env.AWS_REGION = process.env.AWS_REGION || conf.aws.region || 'sa-east-1';
process.env.AWS_ACCESSKEYID = process.env.AWS_ACCESSKEYID || conf.aws.accessKeyId;
process.env.AWS_SECRETACCESSKEY = process.env.AWS_SECRETACCESSKEY || conf.aws.secretAccessKey;
process.env.AWS_TOPICARN = process.env.AWS_TOPICARN || conf.aws.topicArn;
process.env.AWS_SSLENABLED = process.env.AWS_SSLENABLED || conf.aws.sslEnabled;

process.env.MYSQL_HOST = process.env.MYSQL_HOST || conf.mysql.host;
process.env.MYSQL_PORT = process.env.MYSQL_PORT || conf.mysql.port;
process.env.MYSQL_USER = process.env.MYSQL_USER || conf.mysql.user;
process.env.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || conf.mysql.password;
process.env.MYSQL_DATABASE = process.env.MYSQL_DATABASE || conf.mysql.database;
process.env.MYSQL_CONNECTIONLIMIT = process.env.MYSQL_CONNECTIONLIMIT || conf.mysql.connectionLimit;

process.env.EXPORT_ENABLED = process.env.EXPORT_ENABLED || conf.export.enabled || true;
process.env.EXPORT_BUCKET = process.env.EXPORT_BUCKET || conf.export.bucket;
process.env.EXPORT_LOCALDIRECTORY = process.env.EXPORT_LOCALDIRECTORY || conf.export.localDirectory || '/tmp/';
process.env.EXPORT_REMOTEDIRECTORY = process.env.EXPORT_REMOTEDIRECTORY || conf.export.remoteDirectory;
process.env.EXPORT_PURGE = process.env.EXPORT_PURGE || conf.export.purge || true;
process.env.EXPORT_DAYS = process.env.EXPORT_DAYS || conf.export.days || 1;


console.log();
console.log("===================================================================");
console.log("*** Meccano IoT ServiceManager Configuration ")
console.log("NODE_ENV: " + process.env.NODE_ENV);
console.log("CONFIG_FILE: " + process.env.CONFIG_FILE);
console.log("PORT: " + process.env.PORT);
console.log("ADDRESS: " + process.env.ADDRESS);
console.log("===");
console.log("WARNINGLIMIT: " + process.env.WARNINGLIMIT);
console.log("TZ: " + process.env.TZ);
console.log("===");
console.log("SCHEDULER_MONITOR: " + process.env.SCHEDULER_MONITOR);
console.log("SCHEDULER_DEVICES: " + process.env.SCHEDULER_DEVICES);
console.log("SCHEDULER_STATISTICS: " + process.env.SCHEDULER_STATISTICS);
console.log("SCHEDULER_EXPORT: " + process.env.SCHEDULER_EXPORT);
console.log("SCHEDULER_HISTORYSTATUS: " + process.env.SCHEDULER_HISTORYSTATUS);
console.log("===");
console.log("AWS_REGION: " + process.env.AWS_REGION);
console.log("AWS_ACCESSKEYID: " + process.env.AWS_ACCESSKEYID);
console.log("AWS_SECRETACCESSKEY: " + process.env.AWS_SECRETACCESSKEY);
console.log("AWS_TOPICARN: " + process.env.AWS_TOPICARN);
console.log("AWS_SSLENABLED: " + process.env.AWS_SSLENABLED);
console.log("===");
console.log("MYSQL_HOST: " + process.env.MYSQL_HOST);
console.log("MYSQL_PORT: " + process.env.MYSQL_PORT);
console.log("MYSQL_USER: " + process.env.MYSQL_USER);
console.log("MYSQL_PASSWORD: *****");
console.log("MYSQL_DATABASE: " + process.env.MYSQL_DATABASE);
console.log("MYSQL_CONNECTIONLIMIT: " + process.env.MYSQL_CONNECTIONLIMIT);
console.log("===");
console.log("EXPORT_ENABLED: " + process.env.EXPORT_ENABLED);
console.log("EXPORT_BUCKET: " + process.env.EXPORT_BUCKET);
console.log("EXPORT_LOCALDIRECTORY: " + process.env.EXPORT_LOCALDIRECTORY);
console.log("EXPORT_REMOTEDIRECTORY: " + process.env.EXPORT_REMOTEDIRECTORY);
console.log("EXPORT_PURGE: " + process.env.EXPORT_PURGE);
console.log("EXPORT_DAYS: " + process.env.EXPORT_DAYS);
console.log("===================================================================");
console.log();

// Merge of configuration (environment + yaml)
conf.environment = process.env.NODE_ENV;
conf.port = process.env.PORT;
conf.address = process.env.ADDRESS;
conf.timezone = process.env.TZ;
conf.warninglimit = process.env.WARNINGLIMIT;
conf.scheduler.monitor = process.env.SCHEDULER_MONITOR;
conf.scheduler.devices = process.env.SCHEDULER_DEVICES;
conf.scheduler.statistics = process.env.SCHEDULER_STATISTICS;
conf.scheduler.export = process.env.SCHEDULER_EXPORT;
conf.scheduler.historyStatus = process.env.SCHEDULER_HISTORYSTATUS;
conf.aws.region = process.env.AWS_REGION;
conf.aws.accessKeyId = process.env.AWS_ACCESSKEYID;
conf.aws.secretAccessKey = process.env.AWS_SECRETACCESSKEY;
conf.aws.topicArn = process.env.AWS_TOPICARN;
conf.aws.sslEnabled = process.env.AWS_SSLENABLED;
conf.mysql.host = process.env.MYSQL_HOST;
conf.mysql.port = process.env.MYSQL_PORT;
conf.mysql.user = process.env.MYSQL_USER;
conf.mysql.password = process.env.MYSQL_PASSWORD;
conf.mysql.database = process.env.MYSQL_DATABASE;
conf.mysql.connectionLimit = process.env.MYSQL_CONNECTIONLIMIT;

conf.export.enabled = process.env.EXPORT_ENABLED;
conf.export.bucket = process.env.EXPORT_BUCKET;
conf.export.localDirectory = process.env.EXPORT_LOCALDIRECTORY;
conf.export.remoteDirectory = process.env.EXPORT_REMOTEDIRECTORY;
conf.export.purge = process.env.EXPORT_PURGE;
conf.export.days = process.env.EXPORT_DAYS;

module.exports = conf;
