# About Meccano IoT Project

Meccano project is a multi-purpose IoT (Internet of Things) board and software platform created by Luciano Kadoya, Rogério Biondi, Diego Osse and Talita Paschoini. Its development started in early 2014 as a closed R&D project in the Software Architecture Division, with the aim of creating a board which is robust, based on a modern microprocessor (ESP8266), cheap, easy to implement and deploy through the 750 retail stores to perform several functions, such as:

- Count the number of visitors in each store to calculate the sales/visits ratio;
- Get the vote/feedback of users regarding the services;
- Voice marketing;
- Energy saving initiatives;
- Beacons and interaction of the customer in the physical store;
- Several other undisclosed applications;

Different from other ESP8266 projects, Meccano board has been heavily tested in retail stores and adjusted to be safe against RF (radio frequency) interferences. The physical store is an inhospitable environment since there are several hundreds of electronic products, such as TVs, computers, sound and home theaters as well as electronic home appliances.

The project is still in its early stages and will evolve in the future. Magazine Luiza will plan the backlog and sponsor the project. It has been open-sourced because it´s the first initiative to create a board based on ESP8266 in Brazil and we are really excited with the possibilities. Magazine Luiza has a passion for innovations and contribution to the development of technology. So you are invited to join us because your support/collaboration is welcome!


# Meccano IoT ServiceManager

Meccano IoT ServiceManager performs several maintenance tasks, such as


## Features:

 - Control de health of the devices
 - Notifications through Amazon SNS (E-mail)
 - Schedule maintenance tasks, such as
  - Cleaning old messages
  - Purge data.
 - Data backup on Amazon S3 (for analytics and machine learning)
 - Generate sensor statistics


## Installation

 ```
 sudo su

 # Configure swap
 # Required only for EC2-Instance, or if no swap available
 dd if=/dev/zero of=/swapfile bs=1M count=1024
 mkswap /swapfile
 chmod 066 /swapfile
 swapon /swapfile

 # Install
 yum -y install git
 yum -y install nodejs npm --enablerepo=epel
 yum -y install mysql-devel
 mkdir /app
 cd /app
 git clone https://github.com/meccano-iot/servicemanager.git
 cd servicemanager
 npm install

 # Set the environment variables
 # AWS_ACCESSKEYDI, AWS_SECRETACCESSKEY, MYSQL_HOST, MYSQL_PORT ...
 # or configure the ./config/config.yml file.
 # See the documentation below for more details.

 # Install and Configure R application
 yum -y install R
 cd /app/servicemanager/R
 chmod a+x *.R


 # If Operating in Failover Mode, you should configure the environment variables.
 # More details bellow and in the architecture session.
 #
 # MIRROR: is the mirror ServiceManager host name or ip.
 # PORT  : is the mirror servicemanager TCP port.
 #
 # We'll include the variables in the bash_profile.
 #
 echo "export MIRROR=other_instance_host_name_or_ip" >> ~/.bash_profile
 echo "export PORT=8000" >> ~/.bash_profile

 # Execute Meccano IoT ServiceManager
 cd /app/servicemanager
 npm start
 ```

## Configuration


Configuration of Meccano IoT ServiceManager is simple. You should configure the ./config/config.yml file or set the environment variables.

### Yaml file configuration

```
default:
  warninglimit: 60
  scheduler:
    monitor: '*/1 * * * *'
  aws:
    region: 'sa-east-1'
    accessKeyId: '****************'
    secretAccessKey: '******************'
    topicArn: 'arn:aws:sns:sa-east-1:999999999:meccano-devicemanager'
    sslEnabled: false
  mysql:
    host: 'iotdb_hostname'
    port: 3306
    user: 'user'
    password: 'password'
    database: 'IOTDB'
  export:
    active: true
    bucket: ml-iot
    localDirectory: /tmp/
    remoteDirectory: passagem/
    purge: true
    days: 10
```

Each configuration parameter have the corresponding environment variable. They'll be better explained in the next session.


### Environment variables


#### General parameters

- **WARNINGLIMIT**: the number of minutes to create the device report. Every n minutes the report will be created and sent by e-mail for administrators. It depends on your monitoring needs.

- **SCHEDULER_MONITOR**: this is the CRON string for configuring the monitor, the time both instances should check who is the MASTER or SLAVE. This should be 1 minute or more, depending on your configuration. Since ServiceManager is not a critical component in  Meccano IoT Architecture, it may be offline for some minutes until the SLAVE takes over the task and promote itself to MASTER. The default value is executing this check every minute.


#### AWS Configuration

For AWS Configuration you should complete the requirements:

- Your Region (or example, sa-east-1) AWS Access and Secret Keys available.
- An SNS Topic created, redirecting the messages to E-mail and TopicArn available.

- **AWS_REGION**: is the name of your AWS Region. The default is sa-east-1.

- **AWS_ACCESSKEYID**: your AWS Access Key Id.

- **AWS_SECRETACCESSKEY**: your AWS Secret Access Key.

- **AWS_TOPICARN**: topic Arn created for sending SNS e-mail messages/notifications.

- **AWS_SSLENABLED**: if you need SSL, set this parameter for true, otherwise false (default).


#### Database configuration

The parameters bellow control the connection and behaviour of the RDBMS.

- **MYSQL_HOST**: database hostname or ip address.

- **MYSQL_PORT**: database port.

- **MYSQL_USER**: database user.

- **MYSQL_PASSWORD**: database password.

- **MYSQL_DATABASE**: database name or instance id.

- **MYSQL_CONNECTIONLIMIT**: maximum number of connections.



#### Export / Purge configuration

The parameters bellow control the connection and behaviour of the export and purge configuration.

- **EXPORT_ENABLED**: controls if export and purge are active. De default value for this variable is **true**. The data will be exported according the **SCHEDULER_EXPORT** variable.

- **EXPORT_BUCKET**: the name of the bucket in the AWS S3 Service. It should have the permissions configured correctly for writting.

- **EXPORT_LOCALDIRECTORY**: this is a local temp directory for generating data before the export process. You should direct data to TMP or TEMP directory or any other with the same purpose. The default is **/tmp/**

- **EXPORT_REMOTEDIRECTORY**: this is the remote directory in the S3 Bucket. Remember to check the permissions in order ServiceManager can export correctly. The final URL will be s3://[**EXPORT_BUCKET**][**EXPORT_REMOTEDIRECTORY**]

- **EXPORT_PURGE**: controls the behaviour of the data purge. The default is **true** and the data will be purged from the database after the export procedure.

- **EXPORT_DAYS**: this is the days the ServiceManager will keep before exporting. If you specify 10 days, each data older than that limit will be exported to S3 bucket and then purged from Database. The local database should be used just for BAM (Business Activity Monitoring) or daily data, while older be persisted in a cheaper place such as S3 or AWS Glacier Service. The default value is 1 day.


#### Plugin Architecture

The Service Manager plugin architecture executes R and node.js code. There are some out-of-the-box plugins and you may also create yours.

##### Out-of-the-box plugins

**Sensor Statistics**: this plugin creates the device report. It depends on your application but a good value should be 10 minutes or even a day, if you don't want to overload this component so much. The default value is every 10 minutes.

**Statistics**: this plugin generates the sensor statistics. The default value is every 0 hour of each day.

**Export and Purge**: this plugin exports and purges data out of the Meccano infrastructure. The purged data may be exported to S3 bucket in order for executing Map Reduce (Hadoop) or Spark reductions or other processing for realtime analytics, BI and reports. The default is 02:00 AM of each day.

**History Status**: this plugin produces the history status of the devices, for webconsole. The default value is 1 minute.


##### Configuration

In the config/plugins.json you may configure your plugin. Example: if your plugin script file is sensorStatistics.R, you should put your R code in the /plugins directory and configure according the example bellow.

```
[
  {
    "plugin": "sensorStatistics",
    "engine": "R",
    "enabled": true,
    "schedule": "* 0 * * *"
  },
  {
    "plugin": "forecast-day",
    "engine": "R",
    "enabled": false,
    "schedule": "*/1 * * *"
  },
  {
    "plugin": "devices",
    "engine": "node",
    "enabled": true,
    "schedule": "*/10 * * * *"
  },
  {
    "plugin": "data_export",
    "engine": "node",
    "enabled": true,
    "schedule": "* 2 * * *"
  },
  {
    "plugin": "historyStatus",
    "engine": "node",
    "enabled": true,
    "schedule": "*/1 * * *"
  }
]
```

##### Creating New Plugin

If you want to create a plugin, you should follow the step:

###### node.js plugin

The mininum plugin configuration for node.js is:

```
var config  = require('../config');
var mysql  = require('../mysql');
var amazon  = require('../aws');

*
* Export Data entrypoint
*/
exports.entrypoint = function() {
  if(config.TYPE !== "MASTER") return;
  // Your plugin code here
}
```

###### R plugin

The mininum R plugin configuration is bellow. You should change the permission of this file to 755 (chmod a+x yourfile.R)

```
#!/usr/bin/env Rscript
# Load Libraries
library('RMySQL')
USER <- Sys.getenv("MYSQL_USER")
PASSWORD <-Sys.getenv("MYSQL_PASSWORD")
DATABASE <- Sys.getenv("MYSQL_DATABASE")
HOST <- Sys.getenv("MYSQL_HOST")
PORT <- as.numeric(Sys.getenv("MYSQL_PORT"))
db <- dbConnect(MySQL(), user = USER, password = PASSWORD, dbname=DATABASE, host=HOST, port=PORT)
# Your R code here
dbDisconnect(db)
q()
```



## Single and Failover Architecture

  - Meccano IoT ServiceManager can operate in two modes: *Single Instance Mode* or *Failover Mode*.


  *Single Instance Mode*: it's the simpliest mode of operation. Just install the ServiceManager, start it and you are ready to go.

  ```
  cd /app/servicemanager
  npm start
  ```



  *Failover Mode*: if you need to ensure there will be aways an active instance of ServiceManager running, you should configure it for failover operation. You'll need two and just two different machines, each instance connected to other. In the following example we'll call the instance INSTANCE-A and INSTANCE-B. Here we are assuming both instance and host names are the same. Each will need to be configured in order to operate correctly.

  a) First you'll need to configure INSTANCE-A. Follow the regular steps of Installation. When configuring the environment variables, you should do the following

  ```
  export MIRROR=INSTANCE-B
  export PORT=8000
  ```

  b) Next, you'll do the same for INSTANCE-B. You'll do the regular configuration described in this document, plus the configuration of environment:

  ```
  export MIRROR=INSTANCE-A
  export PORT=8000
  ```

  c) Next, you'll need to start your master. It can be both INSTANCE-A or INSTANCE-B. There is no difference between them. We'll assume INSTANCE-A is the main/master, so we'll start it first:

  ```
  cd /app/servicemanager
  npm start
  ```

  We must wait some minutes until INSTANCE-A be promoted to MASTER. The console will show the status.

  d) Finally, you'll need to connect the slave node. As we've already promoted INSTANCE-A to MASTER, we'll start INSTANCE-B as slave.

  ```
  cd /app/servicemanager
  npm start
  ```

  Wait some minutes until INSTANCE-B will be promoted to SLAVE. The console will show the status.
  We recomend you set up the MIRROR and PORT variables in each instance in ./bash_profile of the user (Linux) or as  permanent/system environment variables in Windows Systems.


The MASTER and SLAVE status may alternate between both instances (INSTANCE-A, INSTANCE-B), depending on the availability of the MASTER, load or network connectivity. You may also create each instance in one different AWS Region, for example, INSTANCE-A in sa-east-1 and INSTANCE-B in sa-east-2 (just configure the *AWS_REGION* environment variable or yaml file). If you also need better availability, the database should also be configured for Multi-AZ.
