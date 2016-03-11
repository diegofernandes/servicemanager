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

library(RMySQL)
library(lubridate)

config.database.dbname <- Sys.getenv("MYSQL_DBNAMNE")
config.database.host <- Sys.getenv("MYSQL_HOST")
config.database.port <- as.numeric(Sys.getenv("MYSQL_PORT"))
config.database.user <- Sys.getenv("MYSQL_USER")
config.database.password <- Sys.getenv("MYSQL_PASSWORD")
config.forecast.days <- as.numeric(Sys.getenv("FORECAST_DAYS"))

print("Connecting to database...")
conn <- dbConnect(MySQL(),
                  dbname = config.database.dbname,
                  port = config.database.port,
                  host = config.database.host,
                  user = config.database.user,
                  password = config.database.password
)
summary(conn)

# Load sensor data from DB for training
print("Reading training data...")
rs <- dbSendQuery(conn, "SELECT * FROM Facts order by creationDate desc LIMIT 10000")
v <- fetch(rs, n=10000)

# Select distinct groups
groups <- unique(v$device_group)
numGroups <- length(groups)

# Cleaning the Forecast_Day table
dbSendQuery(conn, "delete from Forecast_Day")
dbCommit(conn)

# Creates the model and forecast for each device_group
for(f in 1:numGroups) {
  group <- groups[f]
  print(group)
  vf <- v[v[1] == groups[f],]
  print("Creating model...")
  data <- vf$data
  year <- vf$year
  month <- vf$month
  day <- vf$day
  model <- lm(formula = visits~year+month+day )
  # Generate the forecast...
  print("Generating the forecast...")
  today <- Sys.Date()
  p_group = c()
  p_year = c()
  p_month = c()
  p_day = c()
  for(d in 1:config.forecast.days) {
    next <- today + d
    p_group[d] <- groups[f]
    p_year[d] <- year(next)
    p_month[d] <- month(next)
    p_day[d] <- day(next)
    predict(model)
  }
  data.preview <- data.frame(year=p_year, month=p_month, day=p_day)
  # Creates the forecast
  print("Creating the forecast...")
  preview <- round(predict(model, data.preview), 0)
  data.preview.final <- data.frame(branch=p_branch, year=p_year, month=p_month, day=p_day, data=preview)
  # Creates the table
  print("Writing Forecast_Day table...")
  print(data.preview.final)
  # Insere linhas no redshift
  for(r in 1:config.forecast.days) {
    line <- data.preview.final[r,]
    insert <- paste("insert into Forecast_Day (branch, year, month, day, data) values (",
                  line$device_group, ",", line$year, ", ", line$month, ",", line$day, ",", line$data, ")")
    rs <- dbSendQuery(conn, insert)
    dbCommit(conn)
  }
}
dbDisconnect(conn)
q()
