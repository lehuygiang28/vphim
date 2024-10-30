FROM nginx:1.27

USER root

# Install envsubst
RUN apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*

# Copy the Nginx configuration template into the container
COPY --chown=nginxuser:nginxuser ./containers/load-balancer/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy the start script
COPY --chown=nginxuser:nginxuser ./containers/load-balancer/start.sh /start.sh

# Set permissions
RUN chmod +x /start.sh

RUN adduser --system --uid 1000 --no-create-home --disabled-login --group nginxuser

RUN chown -R nginxuser:nginxuser /var/cache/nginx \
    && chown -R nginxuser:nginxuser /var/log/nginx \
    && chown -R nginxuser:nginxuser /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginxuser:nginxuser /var/run/nginx.pid

USER nginxuser

# Expose port 7000 for HTTP traffic
EXPOSE 7000

# Start Nginx with the start script
CMD ["/start.sh"]