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
 exit

 # Install
 sudo yum -y install git
 sudo yum -y install nodejs npm --enablerepo=epel
 sudo yum -y install mysql-devel
 git clone https://github.com/meccano-iot/servicemanager.git
 cd servicemanager
 npm install

 # Set the environment variables
 # AWS_ACCESSKEYDI, AWS_SECRETACCESSKEY, MYSQL_HOST, MYSQL_PORT ...
 # add to the .bash_profile (recommended) or configure the ./config/config.yml file.
 # See the documentation below for more details.

 # Install R and configure plugins
 yum -y install R
 cd plugins
 chmod -R a+x *.R

 # Install Python and configure plugins
 yum install -y python
 chmod -R a+x *.py

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

**S3 Export (and Purge)**: this plugin exports and purges data out of the Meccano infrastructure. The purged data may be exported to S3 bucket in order for executing Map Reduce (Hadoop) or Spark reductions or other processing for realtime analytics, BI and reports. This plugin is enabled and the default is 02:00 AM of each day.

**History Status**: this plugin produces the history status of the devices, for webconsole. This plugin is enabled and The default value is 1 minute.

**Forecast Day (Polynomial Regression Algorithm)**: this plugin runs a polynomial regression algorithm to estimate the data for the next days. It should be useful depending on your application. This plugin is disabled by default. The number of days for estimation is defined by environment variable FORECAST_DAYS. For a 7 day forecast, you should set FORECAST_DAYS=7. The data will be created in MySQL Database, table Forecast_Day. Note: if you are planning to forecast a week you should configure the Export and Purge Plugin accordingly, defining the data retention for weeks or more, depending on your needs.

**Device Alert**: this plugin sends e-mail using the Amazon SNS service to alert of devices in Fail status.

**Device Average Time**: this is a plugin which generates a report of device average time. It will show a bar chart with all devices and the average time they contact the gateway in seconds.

**Updates By Device**: this plugin creates a report with the number of updates of each device.


##### The Anatomy of a Plugin

You may create your own plugins to expand servicemanager and webconsole functionality. The anatomy of plugin follows, using the example of deviceAvgTime plugin. If you take a look at plugin directory, will realize that each folder is a plugin. The format is <name of plugin>:<version>:

+ deviceAvgTime:1.0
  + assets
    + index.html
  + deviceAvgTime:1.0.R
  + plugin.json

- **assets** directory contains the **index.html** file which is the documentation of the plugin. It's a good practice to include the documentation of operation and Installation of the plugin. This directory also contains an output.png file of reports or any other assets produced by plugin after execution.

- **deviceAvgTime:1.0.R** is the main code of the plugin. More about plugins will be explained bellow.

- **plugin.json** is a file in json format which describes the plugin meta data. The example of deviceAvgTime plugin:

```
{
  "plugin" : "deviceAvgTime:1.0",
  "engine" : "R",
  "enabled" : true,
  "schedule" : "*/1 * * * *",
  "description" : "Device Average Response Time",
  "type" : "report",
  "executionContext" : "both"
}
```

- The plugin has a name (deviceAvgTime:1.0) which must be the same name of the directory (deviceAvgTime:1.0) and the source code (deviceAvgTime:1.0.R).

- It specifies the engine the plugin will run on. The options are **R**, **nodejs** and **python**. When creating your own plugin, you must choose the language of your preference.

- Plugin may be **enabled** or **disabled** depending on your decision.

- Plugin has a schedule of execution. You should define the schedule in CRON style.

- It must have a description, for clarification. When plugin is of report type, this name will be presented to the user in the Reports menu.

- It must have a type. There are three kinds of plugins:
  - **report**: will produce an PNG image as output, in the assets/output.png and will be automatically added to the webconsole Reports menu. Thus, you may create and plug your own reports written in NodeJs, R or Python.
  - **worker**: this is a generic worker plugin, which reads information from Facts table and produces output in other tables. They are generally used for maintenance tasks. The historyStatus plugin is a perfect example of a worker plugin.
  - **stream**: stream plugins are used for integration with other solutions. They export and send data to services such as Amazon S3 (take a look at s3_export plugin), Oracle Stream Explorer, Hadoop, Spark and other CEP (Complex Event Processing) tools.

- It must define an execution context. It must be **master** or **both**. When defined to master, it will run only on the MASTER instance of service manager. When both, will run in MASTER and SLAVE. Since you need to load balance the service manager instances in order to access the **reports**, they will need to execute with the executionContext set to **both**


##### Coding the New Plugin

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
  // ...
}
```

###### R plugin

The mininum R plugin configuration is bellow. You should change the permission of this file to 755 (chmod a+x yourfile.R)

```
#!/usr/bin/env Rscript
# Load Libraries
library('RMySQL')

# Get the environment variables
USER <- Sys.getenv("MYSQL_USER")
PASSWORD <-Sys.getenv("MYSQL_PASSWORD")
DATABASE <- Sys.getenv("MYSQL_DATABASE")
HOST <- Sys.getenv("MYSQL_HOST")
PORT <- as.numeric(Sys.getenv("MYSQL_PORT"))

# Connect to the database
db <- dbConnect(MySQL(), user = USER, password = PASSWORD, dbname=DATABASE, host=HOST, port=PORT)

# Your R code here
#...

# Disconnect from DB
dbDisconnect(db)
q()
```

###### Python plugin

The python engine is still implemented but not yet tested. When available, there will be a sample how to code it.



## Single and HA (High Availability) Architecture

  - Meccano IoT ServiceManager can operate in two modes: *Single Instance Mode* or *HA Mode*.


  *Single Instance Mode*: it's the simpliest mode of operation. Just install the ServiceManager, start it and you are ready to go.

  ```
  cd /app/servicemanager
  npm start
  ```



  *HA Mode*: if you need to ensure there will be aways an active instance of ServiceManager running, you should configure it for HA operation. You'll need two and **only** two different machines, each instance connected to other. In the following example we'll call the instance INSTANCE-A and INSTANCE-B. Here we are assuming both instance and host names are the same. Each will need to be configured in order to operate correctly.

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
  cd servicemanager
  npm start
  ```

  We must wait some minutes until INSTANCE-A be promoted to MASTER. The console will show the status.

  d) Finally, you'll need to connect the slave node. As we've already promoted INSTANCE-A to MASTER, we'll start INSTANCE-B as slave.

  ```
  cd servicemanager
  npm start
  ```

  Wait some minutes until INSTANCE-B will be promoted to SLAVE. The console will show the status.
  We recomend you set up the MIRROR and PORT variables in each instance in ./bash_profile of the user (Linux) or as  permanent/system environment variables in Windows Systems.


The MASTER and SLAVE status may alternate between both instances (INSTANCE-A, INSTANCE-B), depending on the availability of the MASTER, load or network connectivity. You may also create each instance in one different AWS Region, for example, INSTANCE-A in sa-east-1 and INSTANCE-B in sa-east-2 (just configure the *AWS_REGION* environment variable or yaml file). If you also need better availability, the database should also be configured for Multi-AZ.


## Load Balancing the Service Manager

For correctly showing the reports in webconsole, you must balance the service manager, configuring a load balancer in front of the two instances. After that you may test it with the following URL:

http://load_balancer_address:lbport/plugins

It will show the list of loaded plugins.
