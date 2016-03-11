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

config.database.dbname <- Sys.getenv("MYSQL_DATABASE")
config.database.host <- Sys.getenv("MYSQL_HOST")
config.database.port <- as.numeric(Sys.getenv("MYSQL_PORT"))
config.database.user <- Sys.getenv("MYSQL_USER")
config.database.password <- Sys.getenv("MYSQL_PASSWORD")

print("Connecting to database...")
conn <- dbConnect(MySQL(),
                  dbname = config.database.dbname,
                  port = config.database.port,
                  host = config.database.host,
                  user = config.database.user,
                  password = config.database.password
)
summary(conn)

# Carregar dados de visitacao diaria do Redshift
print("Reading training data...")
rs <- dbSendQuery(conn, "SELECT device, count(*) as numupdates FROM Facts group by device order by numupdates")
v <- fetch(rs, n=10000)
dbDisconnect(conn)
setwd("./assets/")
png('output.png')
mp <- barplot(v$numupdates, 
        names.arg = v$device, 
        xlab = "devices", 
        ylab="number of updates (un.)")
text(mp, v$numupdates, labels = v$numupdates, pos = 1)
dev.off()
q()
