FROM ghcr.io/weserv/images:5.x

# Create user and give permissions
ARG USER_NAME=weserv
ARG USER_UID=1000
ARG USER_GID=1000

RUN groupadd -g $USER_GID $USER_NAME \
	&& useradd -u $USER_UID -g $USER_GID -m -s /bin/bash $USER_NAME \
	&& echo "$USER_NAME ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers \
	&& chown -R $USER_NAME:$USER_NAME /var/www/imagesweserv \
	&& chown -R $USER_NAME:$USER_NAME /var/lib/nginx \
	&& chown -R $USER_NAME:$USER_NAME /usr/share/nginx \
	&& chown -R $USER_NAME:$USER_NAME /var/log/nginx \
	&& chown -R $USER_NAME:$USER_NAME /etc/nginx

RUN mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx /run/nginx \
	&& chown -R $USER_NAME:$USER_NAME /var/cache/nginx /var/log/nginx /var/lib/nginx /var/www/imagesweserv /etc/nginx /run/nginx

# Add nginx user to the same group as our custom user
RUN usermod -a -G $USER_NAME nginx

# Remove 'user nginx;' directive from nginx.conf
RUN sed -i '/^user/d' /etc/nginx/nginx.conf

# Update nginx.conf to use a writable pid file location
RUN sed -i '1ipid /tmp/nginx.pid;' /etc/nginx/nginx.conf

# Change nginx port from 80 to 8000 for both server blocks
RUN sed -i 's/listen 80;/listen 8000;/g' /etc/nginx/imagesweserv.conf && \
	sed -i 's/listen 80 default_server;/listen 8000 default_server;/g' /etc/nginx/imagesweserv.conf && \
	sed -i 's/listen \[::\]:80 default_server/listen [::]:8000 default_server/g' /etc/nginx/imagesweserv.conf && \
	sed -i 's/server 127.0.0.1:80;/server 127.0.0.1:8000;/g' /etc/nginx/imagesweserv.conf

# Expose the new port
EXPOSE 8000

# Switch to the new user
USER $USER_NAME

CMD ["nginx", "-g", "daemon off;"]
