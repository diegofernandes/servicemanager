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
var http = require('http');

/**
* Monitorar instancias do servicemanager
*/
exports.entrypoint = function() {
  console.log("Checking the status of MIRROR instance...");
  var options = {
    host: process.env.MIRROR,
    port: (process.env.PORT || 8000),
    path: '/'
  };
  console.log(options);
  var callback = function(response) {
    var resposta = '';
    response.on('data', function (chunk) {
      resposta += chunk;
    });
    response.on('end', function () {
      if(resposta === 'SLAVE') {
        if(config.TYPE === 'SLAVE') {
            config.TYPE = 'MASTER';
            console.log('Changing to ' + config.TYPE);
        }
      }
      if(resposta === 'MASTER') {
        config.TYPE = 'SLAVE';
        console.log('Changing to ' + config.TYPE);
      }
    });
  }
  var req = http.request(options, callback);
  req.on('error', function() {
    console.log('MIRROR OFFLINE. Changing to MASTER');
    config.TYPE = 'MASTER';
  });
  req.end();
}
