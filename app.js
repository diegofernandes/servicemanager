var http = require('http');
var mysql  = require('mysql');
var AWS = require('aws-sdk');
var crontab = require('node-crontab');
var yaml_config = require('node-yaml-config');
var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var S3Client = require('s3client');

// Carregar configuração
var ambiente = process.env.ENVIRONMENT;
console.log("AMBIENTE: " + ambiente);
var arqConfig = "./servicemanager.yml";
if(ambiente == "DEV") var arqConfig = "./servicemanager-dev.yml";
var config = yaml_config.load(arqConfig);
console.log(config);

// Configuração mysql
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : config.mysql.host,
  port     		    : config.mysql.port,
  user            : config.mysql.user,
  password        : config.mysql.password,
  database 		    : config.mysql.database
});

// configuração SDK AWS
AWS.config.update({
  "region" : config.aws.region,
  "sslEnabled" : config.aws.sslEnabled,
  "accessKeyId" : config.aws.accessKeyId,
  "secretAccessKey" : config.aws.secretAccessKey
});


var TYPE = "SLAVE";

// Agendar execução dos Jobs
crontab.scheduleJob(config.scheduler.monitor, monitorar);               // Monitor Service Manager
crontab.scheduleJob(config.scheduler.devices, gerarRelatorioDevices);   // Relatório devices
crontab.scheduleJob(config.scheduler.estatistica, gerarEstatistica);    // Executar Relatório Estatística Sensores
crontab.scheduleJob(config.scheduler.export, exportarDados);            // Exportar dados

// Configurar porta de monitoração
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end(TYPE);
});

// Inicia o listener HTTP
var portaListener = process.env.PORT || 80;
server.listen(portaListener);

// Mensagem de inicialização
console.log("Server running on port " + portaListener);


/**
* Monitorar instancias do servicemanager
*/
function monitorar() {
  console.log("Verificando status da instância MIRROR...");
  var options = {
    host: process.env.MIRROR,
    port: (process.env.PORT || 80),
    path: '/'
  };
  console.log(options);
  callback = function(response) {
    var resposta = '';
    response.on('data', function (chunk) {
      resposta += chunk;
    });
    response.on('end', function () {
      // console.log(resposta);
      if(resposta == 'SLAVE') {
        if(TYPE == 'SLAVE') {
            TYPE = 'MASTER';
            console.log('Changing to ' + TYPE);
        }
      }
      if(resposta == 'MASTER') {
        TYPE = 'SLAVE';
        console.log('Changing to ' + TYPE);
      }      
    });
  }
  var req = http.request(options, callback);
  req.on('error', function() {
    console.log('MIRROR OFFLINE. Changing to MASTER');
    TYPE = 'MASTER';
  });
  req.end();
}

/**
* Gerar relatorio de devices
**/
function gerarRelatorioDevices() {
  if(TYPE != "MASTER") return;
  pool.query(config.mysql.query, gerarRelatorio);
}

/**
* Gerar texto do relatorio
**/
function gerarRelatorio(err, rows, fields) {
  if(err) {
    console.log("Relatorio nao gerado.");
    return;
  }
  if (rows.length == 0) {
    return;
  }
  var textoEmail = "Relatorio de devices em estagio de warning/falha: \n";
  for(i = 0; i < rows.length; i++) {
    if(rows[i].tempo_anuncio > config.limite_warning ) {
      textoEmail += rows[i].idDevice + " (" + rows[i].idLocal + ") \n";
    }
  }
  console.log(textoEmail);
  publicarMensagem(textoEmail);
}

/*
* Publicar mensagem no servico SNS
*/
function publicarMensagem(relatorio) {
  var params = {
    Message: relatorio,
    Subject: "Relatorio Operacional",
    TopicArn: config.aws.topicArn
  };
  var sns = new AWS.SNS();
  console.log(params);
  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

/*
* Gerar Estatistica Sensores
*/
function gerarEstatistica() {
  if(TYPE != "MASTER") return;
  exec("./estatisticaSensores.R", {cwd: './R/'}, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
  });
}


/*
* Exportar dados
*/
function exportarDados() {
  if(TYPE != "MASTER") return;
  // Obtem as linhas para gerar CSV
  if(config.export.ativo) {
    pool.query('select * from IOTDB.Fatos where datediff(now(), creationDate) >' + config.export.dias, gerarCSV);
  }
}

function gerarCSV(err, rows, fields) {
    var d = new Date();
    if (rows.length == 0) {
      console.log("Nao existem dados para exportar...");
      return;
    }
    var nomeArquivo = "PASSAGEM-" + d.getFullYear() + "-" +
                      (d.getMonth() + 1) + "-" + d.getDate() + "-" + (d.getHours() + 1) + "-" +
                      d.getMinutes() + "-" + d.getSeconds() + ".CSV";
    console.log("Gerando arquivo " + nomeArquivo + "...");
    for(i = 0; i < rows.length; i++) {
      var linha = rows[i].fato + ";" + rows[i].ano + ";" + rows[i].mes + ";" + rows[i].dia + ";" + rows[i].diaSemana + ";" +
                  rows[i].hora + ";" + rows[i].minuto + ";" + rows[i].segundo + ";" +
                  rows[i].idLocal + ";" + rows[i].idDevice + ";" + ( rows[i].idSensor || 0) + ";"  +
                  rows[i].dados + "\n";
      // console.log(linha);
      fs.appendFileSync("/tmp/" + nomeArquivo, linha);
    }
    console.log("Geracao do arquivo terminada!");
    uploadS3(config.export.diretorioRemoto + nomeArquivo, config.export.diretorioLocal + nomeArquivo);
}

/*
* Enviar arquivo para o S3
*/
function uploadS3(remoteFilename, fileName) {
  console.log("Enviando arquivo para s3://" + config.export.bucket + "/" + remoteFilename);
  var options = {
        'key' : config.aws.accessKeyId,
        'secret' : config.aws.secretAccessKey,
        "sslEnabled" : config.aws.sslEnabled,
        'bucket' : config.export.bucket
  };
  var client = new S3Client(options);
  var tamanho = getFilesize(fileName);
  client.put(fileName, remoteFilename, 'application/csv', tamanho, function(err,resp){
    console.log("Verificando status do envio do arquivo...");
    if(!err) {
      // Se estiver programado para expurgar dados, realiza limpeza na base
      if(resp.statusCode == 200) {
        if(config.export.expurgo) {
          console.log("Realizando expurgo da base de dados...");
          pool.query('delete from IOTDB.Fatos where datediff(now(), creationDate) >' + config.export.dias, function(err, result) {
            if(err) {
             console.log("Erro ao realizar expurgo...");
             console.log(err);
            } else {
              console.log('Removidas ' + result.affectedRows + ' linhas...');
            }
          });
        } else {
          console.log("Expurgo de dados desativado...");
        }
      }
      // Removendo o arquivo temporario gerado...
      console.log("Limpando arquivo temporário local...");
      fs.unlinkSync(fileName);
    } else {
      console.log(err);
    }
  });
}

/*
*
*/

/*
* Obtem o tamanho do arquivo
*/
function getFilesize(filename) {
  var stats = fs.statSync(filename)
  var fileSizeInBytes = stats["size"]
  return fileSizeInBytes
}
