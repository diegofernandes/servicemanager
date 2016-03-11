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

var express = require('express');
var app = require('../app.js');
var engine_R = require('../services/engine_R.js');
var engine_node = require('../services/engine_node.js');
var engine_python = require('../services/engine_python.js');

'use strict';

var pluginMetaData = [];

var fs = require('fs'),
    path = require('path');

function scanPlugins(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

console.log("Reading plugins...");
var pluginList = scanPlugins("./plugins");
var numberOfPlugins = pluginList.length;
console.log(pluginList);
console.log();
console.log(numberOfPlugins + " plugins detected. Loading...");
console.log();
for(var p = 0; p < numberOfPlugins; p++) {
  console.log("Loading " + pluginList[p] + "...");
  var metaData  = require('../plugins/' + pluginList[p] + "/plugin.json" );
  pluginMetaData.push(metaData);
  if(!metaData.enabled) {
    console.log ("Disabled.");
    console.log();
    continue;
  }
  // R Engine
  if(metaData.engine == "R") {
    engine_R.schedule(metaData);
  }
  // Python Engine
  if(metaData.engine == "python") {
    engine_python.schedule(metaData);
  }
  // Node Engine
  if(metaData.engine == "node") {
    engine_node.schedule(metaData);
  }
  // Create static route for the assets of the plugin...
  var route = "/plugins/" + metaData.plugin.replace(':', '/') + "/assets/";
  console.log("Creating static routes...");
  app.use("/plugins/"+ metaData.plugin.replace(':', '/'), express.static(__dirname + "/../plugins/" + metaData.plugin));
  app.use(route, express.static(__dirname + "/../plugins/" + metaData.plugin + "/assets"));
  console.log("");
}

// Serve the plugin metaData
app.get('/plugins/', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.status(200).send(pluginMetaData);
});

module.exports = {
  pluginMetaData : function() {
    return pluginMetaData;
  }
};
