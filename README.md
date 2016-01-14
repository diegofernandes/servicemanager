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
 echo "export PORT=80" >> ~/.bash_profile

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
    devices: '*/10 * * * *'
    statistics: '* 0 * * *'
    export: '* 2 * * *'
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

- **SCHEDULER_DEVICES**: this is the CRON string for creating the device report. It depends on your application but a good value should be 10 minutes or even a day, if you don't want to overload this component so much. The default value is every 10 minutes.

- **SCHEDULER_STATISTICS**: this is the CRON string for generating the sensor statistics. The default value is every 0 hour of each day.

- **SCHEDULER_EXPORT**: this is the CRON schedule for exporting and purging data out of the Meccano infrastructure. The purged data may be exported to S3 bucket in order for executing Map Reduce (Hadoop) or Spark reductions or other processing for realtime analytics, BI and reports. The default is 02:00 AM of each day.



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




## Architecture

  - Meccano IoT ServiceManager can operate in two modes: *Single Instance Mode* or *Failover Mode*.


  *Single Instance Mode*: it's the simpliest mode of operation. Just install the ServiceManager, start it and you are ready to go.

  ```
  cd /app/
  npm start
  ```



  *Failover Mode*: if you need to ensure there will be aways an active instance of ServiceManager running, you should configure it for failover operation. You'll need two and just two different machines, each instance connected to other. In the following example we'll call the instance INSTANCE-A and INSTANCE-B. Here we are assuming both instance and host names are the same. Each will need to be configured in order to operate correctly.

  a) First you'll need to configure INSTANCE-A. Follow the regular steps of Installation. When configuring the environment variables, you should do the following

  ```
  export MIRROR=INSTANCE-B
  export PORT=80
  ```

  b) Next, you'll do the same for INSTANCE-B. You'll do the regular configuration described in this document, plus the configuration of environment:

  ```
  export MIRROR=INSTANCE-A
  export PORT=80
  ```

  c) Next, you'll need to start your master. It can be both INSTANCE-A or INSTANCE-B. There is no difference between them. We'll assume INSTANCE-A is the main/master, so we'll start it first:

  ```
  cd /app/
  npm start
  ```

  We must wait some minutes until INSTANCE-A be promoted to MASTER. The console will show the status.

  d) Finally, you'll need to connect the slave node. As we've already promoted INSTANCE-A to MASTER, we'll start INSTANCE-B as slave.

  ```
  cd /app/
  npm start
  ```

  Wait some minutes until INSTANCE-B will be promoted to SLAVE. The console will show the status.


The MASTER and SLAVE status may alternate between both instances (INSTANCE-A, INSTANCE-B), depending on the availability of the MASTER, load or network connectivity. You may also create each instance in one different AWS Region, for example, INSTANCE-A in sa-east-1 and INSTANCE-B in sa-east-2 (just configure the *AWS_REGION* environment variable or yaml file). If you also need better availability, the database should also be configured for Multi-AZ.
