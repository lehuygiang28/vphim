# Stream Proxy Server

High-performance Bun proxy server with advanced streaming and load protection capabilities.

## Features

- Fast media streaming with proper content types
- Rate limiting and circuit breaker protection
- Support for video streaming with range requests
- Auto-detection of media files
- Built with Bun for maximum performance

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
