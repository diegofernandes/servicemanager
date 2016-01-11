#!/usr/bin/env Rscript
# Carregar bibliotecas
library('yaml')
library('RMySQL')

# Carregar arquivo yaml de configuração
config <- yaml.load_file('../servicemanager.yml')

USUARIO <- config$default$mysql$user
SENHA <-config$default$mysql$password
DATABASE <- config$default$mysql$database
SERVIDOR <- config$default$mysql$host
PORTA <- config$default$mysql$port

db <- dbConnect(MySQL(), user = USUARIO, password = SENHA, dbname=DATABASE, host=SERVIDOR, port=PORTA)
rsSensores <- dbSendQuery(db, 'select distinct idDevice, idSensor from IOTDB.Fatos where idSensor is not null')
listaSensores <- fetch(rsSensores)
numSensores <- nrow(listaSensores)
print(listaSensores)
# Limpar tabela
dbGetQuery(db, "DELETE FROM IOTDB.Estatisticas")
for (s in 1:numSensores) {
  querySensor <- paste("select dados from IOTDB.Fatos where idDevice =", listaSensores[s,]$idDevice, " and idSensor =", listaSensores[s,]$idSensor, sep = " ")
  print(querySensor)
  rsDadosSensor <- dbSendQuery(db, querySensor)
  dadosSensor <- fetch(rsDadosSensor)
  tamanhoAmostra <- nrow(dadosSensor)
  # print(dadosSensor)
  dbClearResult(rsDadosSensor)
  media <- mean(dadosSensor$dados)
  desvio_padrao <- sd(dadosSensor$dados)
  erro_padrao <- desvio_padrao / sqrt(tamanhoAmostra)
  print(paste("Tamanho Amostra: ", tamanhoAmostra))
  print(paste("Media: ", media))
  print(paste("Desvio: ", desvio_padrao))
  print(paste("Erro Padrao: ", erro_padrao))
  insert <- paste(
    "INSERT INTO IOTDB.Estatisticas (idDevice, idSensor, media, desvio, erro, creationDate) VALUES (",
    listaSensores[s,]$idDevice,
    ",",
    listaSensores[s,]$idSensor,
    ",",
    media,
    ",",
    desvio_padrao,
    ",",
    erro_padrao,
    ",",
    "now())")
  print(insert)
  dbGetQuery(db, insert);
}

dbDisconnect(db)
