# High-Performance Stream Proxy Server

A Bun-powered HTTP proxy server optimized for streaming content with advanced features including rate limiting, circuit breaking, referrer tracking, and configurable CORS.

## Features

- **High Performance**: Optimized for streaming video and large files
- **Advanced Monitoring**: Detailed logging and statistics tracking
- **Protection Mechanisms**:
  - Rate limiting per IP
  - Circuit breaker to prevent overload
  - Request timeout handling
- **Referrer Tracking**: Track and analyze which websites are using your proxy
- **Configurable CORS**: Full CORS support with environment-based configuration
- **Customizable Logging**: Console and file logging with multiple levels

## Quick Start

1. Install dependencies:
   ```
   bun install
   ```

2. Set up configuration:
   ```
   cp .env.example .env
   # Edit .env with your desired settings
   ```

3. Start the server:
   ```
   bun run proxy.ts
   ```

## Usage

The proxy server accepts requests with a URL parameter:

```
http://localhost:3001/?url=https://example.com/path/to/file.mp4
```

## Configuration

All server settings can be configured using environment variables. Copy the `.env.example` file to `.env` and customize as needed:

### Server Configuration
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (production/development)
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent requests before circuit breaker trips (default: 500)
- `TIMEOUT_MS`: Request timeout in milliseconds (default: 30000)

### Rate Limiting
- `RATE_LIMIT_PER_MINUTE`: Maximum requests per IP per minute (default: 700)

### Logging Configuration
- `LOG_LEVEL`: Log verbosity - debug, info, warn, error (default: info)
- `LOG_FORMAT`: Log format - json or text (default: json)
- `LOG_TO_FILE`: Enable file logging (default: false)
- `LOG_FILE_PATH`: Log file location (default: ./logs/proxy-server.log)

### Referrer Tracking
- `REFERRER_TRACKING`: Enable referrer tracking (default: true)
- `REFERRER_LOG_INTERVAL`: Interval for logging referrer stats in ms (default: 3600000, 1 hour)

### CORS Configuration
- `CORS_ENABLED`: Enable CORS headers (default: true)
- `CORS_ALLOW_ORIGIN`: Allowed origins (default: *)
- `CORS_ALLOW_METHODS`: Allowed HTTP methods
- `CORS_ALLOW_HEADERS`: Allowed request headers
- `CORS_EXPOSE_HEADERS`: Headers accessible to browsers
- `CORS_ALLOW_CREDENTIALS`: Allow credentials (default: false)
- `CORS_MAX_AGE`: Preflight cache duration in seconds (default: 86400, 24h)

## API Endpoints

- `GET /?url=<target_url>`: Main proxy endpoint
- `GET /health`: Health check endpoint (returns 200 OK)
- `GET /proxy-stats`: Server statistics
- `GET /referrer-stats`: Referrer tracking statistics

## License

MIT

## Docker Container

### Build the Container

```bash
# Build from the project root
docker build -t stream-proxy -f containers/stream-proxy/Dockerfile containers/stream-proxy

# Or navigate to the container directory first
cd containers/stream-proxy
docker build -t stream-proxy .
```

### Run the Container

```bash
# Run and expose on port 3001
docker run -p 3001:3001 stream-proxy

# Run in detached mode
docker run -d -p 3001:3001 stream-proxy

# Run with custom port mapping (host:container)
docker run -p 8080:3001 stream-proxy
```

### Push to Container Registry

```bash
# Tag the image for your registry
docker tag stream-proxy your-registry.com/your-username/stream-proxy:latest

# Push to Docker Hub
docker tag stream-proxy lehuygiang28/stream-proxy:latest
docker push lehuygiang28/stream-proxy:latest

# Push to GitHub Container Registry
docker tag stream-proxy ghcr.io/your-username/stream-proxy:latest
docker push ghcr.io/your-username/stream-proxy:latest

# Push to Google Container Registry
docker tag stream-proxy gcr.io/your-project-id/stream-proxy:latest
docker push gcr.io/your-project-id/stream-proxy:latest

# Push to AWS ECR
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
docker tag stream-proxy your-account-id.dkr.ecr.your-region.amazonaws.com/stream-proxy:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/stream-proxy:latest
```

## Usage

Once running, the proxy can be accessed at:

```
http://localhost:3001/?url=https://example.com/path/to/video.mp4
```

## Configuration

The proxy configuration is defined in the `CONFIG` object in `proxy.ts`:

```typescript
const CONFIG = {
    port: 3001,
    maxConcurrentRequests: 500,
    timeoutMs: 30000,
    rateLimitPerMinute: 700, // Per IP
};
```

To change these values when running in Docker, you can modify the configuration in the source file and rebuild the image.
