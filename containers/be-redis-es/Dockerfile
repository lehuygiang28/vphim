# Base image with Node.js, Redis, and Supervisor
FROM lehuygiang28/vphim_api_redis:latest

USER root
WORKDIR /usr/src/app

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

# Install Elasticsearch
RUN apk update && \
	apk add --no-cache openjdk11 && \
	wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.15.1-linux-x86_64.tar.gz && \
	tar -xzf elasticsearch-8.15.1-linux-x86_64.tar.gz && \
	mv elasticsearch-8.15.1 /usr/local/elasticsearch && \
	rm -f elasticsearch-8.15.1-linux-x86_64.tar.gz

# Configure Elasticsearch
RUN echo "xpack.security.enabled: false" >> /usr/local/elasticsearch/config/elasticsearch.yml && \
	echo "network.host: 0.0.0.0" >> /usr/local/elasticsearch/config/elasticsearch.yml && \
	echo "http.port: 9200" >> /usr/local/elasticsearch/config/elasticsearch.yml

# Set proper permissions for Elasticsearch and all directories
RUN chown -R node:node /usr/local/elasticsearch && \
	chown -R node:node /usr/src/app && \
	chmod -R u+rwX /usr/src/app /usr/local/elasticsearch

# Expose necessary ports
EXPOSE 9200 6379 8080

USER node

COPY --chown=node:node ./containers/be-redis-es/start-server.sh ./start-server.sh
RUN chmod +x ./start-server.sh

# Entry point script to start all services
COPY --chown=node:node ./containers/be-redis-es/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
