FROM node

ENV NODE_ENV=production
ENV PORT=8000
ENV ADDRESS=0.0.0.0

ENV MYSQL_USER=iot
ENV MYSQL_PASSWORD='secret$1'
ENV MYSQL_DATABASE=IOTDB
ENV MYSQL_HOST=mysql
ENV MYSQL_PORT=3306
ENV MYSQL_OPTIONS_POOL_MINCONNECTIONS=1
ENV MYSQL_OPTIONS_POOL_MAXCONNECTIONS=10

ENV TESTS_AUTH=true
ENV TESTS_STATISTIC=false
ENV TESTS_ZERO=false
ENV STATISTICS_SIGMA=6

# Install packages
RUN apt-get update
RUN apt-get install -y mysql-client libmysqlclient-dev
RUN apt-get install -y r-base r-base-dev

# Define working directory.
WORKDIR /app/

ADD . /app

# Change the attribute of the plugins
RUN chmod a+x $(find -name *.R)

# Install RMySQL package
RUN /app/plugins/packages.R

# Install the application
RUN /usr/local/bin/npm install --prod

# Define default command.
CMD ["npm", "start"]

# Expose ports.
EXPOSE 8000
