FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package.json first to leverage Docker cache
COPY package.json ./
RUN bun install

# Copy source code
COPY proxy.ts ./

# Set environment variables
ENV NODE_ENV=production

# Expose the port used by the proxy
EXPOSE 3001

# Run the proxy server
CMD ["bun", "proxy.ts"]
