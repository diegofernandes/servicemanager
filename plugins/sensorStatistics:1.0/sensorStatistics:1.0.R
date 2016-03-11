#!/usr/bin/env Rscript

#
# Meccano IOT ServiceManager
#
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
#

# Test if packages are installed, otherwise install it
list.of.packages <- c("RMySQL")
new.packages <- list.of.packages[!(list.of.packages %in% installed.packages()[,"Package"])]
if(length(new.packages)) install.packages(new.packages, repos='http://cran.us.r-project.org')

# Load Libraries
library('RMySQL')

USER <- Sys.getenv("MYSQL_USER")
PASSWORD <-Sys.getenv("MYSQL_PASSWORD")
DATABASE <- Sys.getenv("MYSQL_DATABASE")
HOST <- Sys.getenv("MYSQL_HOST")
PORT <- as.numeric(Sys.getenv("MYSQL_PORT"))

db <- dbConnect(MySQL(), user = USER, password = PASSWORD, dbname=DATABASE, host=HOST, port=PORT)
rsSensors <- dbSendQuery(db, 'select distinct device, sensor from `Facts` where sensor is not null')
sensorList <- fetch(rsSensors)
sensorCount <- nrow(sensorList)
print(sensorList)
# Clean Table
dbGetQuery(db, "TRUNCATE `DeviceStatistics`")
for (s in 1:sensorCount) {
  querySensor <- paste("select data from `Facts` where `device` = '", sensorList[s,]$device, "' and `sensor` =", sensorList[s,]$sensor, sep = "")
  print(querySensor)
  rsSensorData <- dbSendQuery(db, querySensor)
  sensorData <- fetch(rsSensorData)
  sampleSize <- nrow(sensorData)
  dbClearResult(rsSensorData)
  avg <- mean(sensorData$data)
  stdev <- sd(sensorData$data)
  stderr <- stdev / sqrt(sampleSize)
  print(paste("Sample size : ", sampleSize))
  print(paste("Mean / Avg  : ", avg))
  print(paste("Std. Dev    : ", stdev))
  print(paste("Std. Error  : ", stderr))
  if (is.na(avg)) avg <- 0
  if (is.na(stdev)) stdev <- 0
  if (is.na(stderr)) stderr <- 0
  insert <- paste(
    "INSERT INTO `DeviceStatistics` (device, sensor, average, deviation, error, creationDate) VALUES (",
    "'", sensorList[s,]$device, "'",
    ",",
    sensorList[s,]$sensor,
    ",",
    avg,
    ",",
    stdev,
    ",",
    stderr,
    ",",
    "now())", sep="")
  print(insert)
  dbGetQuery(db, insert);
}

dbDisconnect(db)
q()
