#!/usr/bin/env Rscript

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
rsSensors <- dbSendQuery(db, 'select distinct device, sensor from IOTDB.Facts where sensor is not null')
sensorList <- fetch(rsSensors)
sensorCount <- nrow(sensorList)
print(sensorList)
# Clean Table
dbGetQuery(db, "DELETE FROM IOTDB.DeviceStatistics")
for (s in 1:sensorCount) {
  querySensor <- paste("select data from IOTDB.Facts where device = '", sensorList[s,]$device, "' and sensor =", sensorList[s,]$sensor, sep = "")
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
  insert <- paste(
    "INSERT INTO IOTDB.DeviceStatistics (device, sensor, average, deviation, error, creationDate) VALUES (",
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
