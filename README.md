# 🎬 VePhim: Watch Movies Online, Free and Fast

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL">
  <img src="https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" alt="Elasticsearch">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native">
</div>

<div align="center">
  <h3>🌟 Your Personal Movie Library, Anytime, Anywhere 🌟</h3>
</div>

## 📖 What is VePhim?

VePhim is a feature-rich platform where you can watch movies online for free. Think of it as your personal movie library accessible anytime, anywhere with an internet connection. With a clean, modern interface and powerful features, VePhim delivers a premium streaming experience without the premium price tag.

## 🔄 How does it work?

VePhim acts as an aggregator rather than a host. Instead of storing movies on its own servers, it intelligently indexes and streams content from publicly available sources across the internet. Our specialized crawlers collect comprehensive movie data including:

- **Movie metadata**: Titles, descriptions, genres, release dates, directors, actors
- **Media sources**: Both m3u8 streaming URLs and embed URLs from various providers
- **Episode information**: For TV shows with multiple episodes and seasons
- **Server options**: Multiple streaming sources for each piece of content
- **Media details**: Quality options, language information, and subtitles when available

This complete data collection approach enables:

- **Massive content library** with minimal infrastructure costs
- **Buffer-free streaming** with optimized content delivery
- **Always-fresh content** that updates automatically through scheduled crawling
- **Reliable playback options** with fallbacks between m3u8 and embed sources

## ✨ What makes VePhim special?

<table>
  <tr>
    <td align="center" width="33%">
      <h3>🤖 AI-Powered Search</h3>
      <p>Our Gemini-powered AI understands your preferences and helps you find the perfect movie based on your mood, interests, or specific criteria.</p>
    </td>
    <td align="center" width="33%">
      <h3>⚡ Lightning-Fast Streaming</h3>
      <p>Experience smooth, high-quality playback with our advanced streaming technology and optimized content delivery.</p>
    </td>
    <td align="center" width="33%">
      <h3>📱 Multi-Platform</h3>
      <p>Enjoy VePhim on your browser or mobile device with our responsive web app and native mobile applications.</p>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <h3>🔍 Smart Discovery</h3>
      <p>Discover new content through intelligent recommendations based on your viewing history and preferences.</p>
    </td>
    <td align="center" width="33%">
      <h3>💾 Personal Collections</h3>
      <p>Create a free account to save favorites, track viewing history, and receive personalized recommendations.</p>
    </td>
    <td align="center" width="33%">
      <h3>🛡️ Clean Experience</h3>
      <p>Enjoy a clean, ad-light experience focused on content enjoyment rather than disruptions.</p>
    </td>
  </tr>
</table>

## 🏗️ Architecture & Project Structure

VePhim is built as a monorepo using Nx, a powerful build system and development toolkit that enables efficient code sharing and maintenance across multiple applications.

```
vephim/
├── apps/
│   ├── api/         # NestJS backend service
│   │    └── .env    # Backend environment configuration
│   ├── fe/          # Main user interface (Next.js)
│   │    └── .env    # Frontend environment configuration
│   ├── mnt/         # Admin dashboard interface
│   │    └── .env    # Admin environment configuration
│   └── mobile/      # React Native mobile application
├── containers/      # Docker configurations for infrastructure
│   ├── be-with-redis/      # Backend with Redis configuration
│   ├── be-redis-pm2/       # Backend with Redis and PM2
│   ├── be-redis-es/        # Backend with Redis and Elasticsearch
│   ├── elasticsearch/      # Elasticsearch configuration
│   ├── kibana/             # Kibana visualization tool
│   ├── load-balancer/      # Load balancing configuration
│   ├── swag/               # Secure Web Application Gateway
│   └── weserv-images/      # Image optimization service
├── documents/       # Project documentation and diagrams
├── tools/           # Build and development utilities
├── .env             # Root environment variables
└── nx.json          # Nx workspace configuration
```

## 🛠️ Technology Stack

VePhim leverages modern technologies to deliver a seamless user experience:

### 🔒 Backend Infrastructure

- **NestJS**: Enterprise-grade Node.js framework for building scalable server applications
- **MongoDB**: NoSQL database for flexible and scalable data storage
- **Redis**: In-memory data store for caching and performance optimization
- **Gemini AI**: Google's advanced LLM for intelligent search and recommendations
- **Elasticsearch**: Distributed search engine for powerful content discovery
- **GraphQL**: Modern API technology for efficient data querying and manipulation
- **Data Crawlers**: Sophisticated crawlers that index and collect complete movie data from multiple public sources, including metadata, streaming URLs, and embed options

### 🎨 Frontend Applications

VePhim provides two separate frontend applications for different user roles:

#### Main User Interface (fe)
- **Next.js**: React framework optimized for the end-user streaming experience
- **Ant Design**: Premium UI components for a visually appealing user interface
- **Vidstack**: Modern, accessible media player for streaming video content
- **Swiper**: Touch-enabled slider for browsing movie collections
- **React Hook Form**: Performance-focused form validation and handling

#### Admin Dashboard (mnt)
- **Next.js**: Same framework as the main UI but configured for administrative tasks
- **RefineJS**: React-based framework for building admin panels
- **Ant Design**: Consistent design system across both frontends
- **React Hook Form**: Form handling for content management operations

### 📱 Mobile Experience

- **Expo**: Cross-platform mobile app development framework
- **UI Kitten**: React Native UI library with customizable components
- **React Native Reanimated**: Advanced animations for a fluid mobile experience
- **Expo Video**: Native video playback for mobile devices

## 🚀 Getting Started

### Local Development Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

3. **Start infrastructure services:**
   ```bash
   docker compose -f docker-compose.infra.yml up -d
   ```

4. **Start applications in development mode:**

   **Backend:**
   ```bash
   # Configure backend environment
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env as needed

   # Start the API server in development mode
   yarn api
   # Server will run at http://localhost:8000
   ```

   **Main User Interface:**
   ```bash
   # Configure frontend environment
   cp apps/fe/.env.example apps/fe/.env
   # Edit apps/fe/.env as needed

   # Start the web application in development mode
   yarn fe
   # Main UI will run at http://localhost:3000
   ```

   **Admin Dashboard:**
   ```bash
   # Configure admin environment
   cp apps/mnt/.env.example apps/mnt/.env
   # Edit apps/mnt/.env as needed

   # Start the admin interface in development mode
   yarn mnt
   # Admin dashboard will run at http://localhost:4000
   ```

   **Mobile Application:**
   ```bash
   # Ensure Android emulator is running
   yarn adr
   ```

### Production Build and Deployment

#### Building for Production

1. **Build Backend:**
   ```bash
   yarn nx build api --configuration=production
   # Output will be in dist/apps/api
   ```

2. **Build Main UI:**
   ```bash
   yarn nx build fe --skip-nx-cache
   # Output will be in apps/fe/.next with standalone folder for production
   ```

3. **Build Admin Dashboard:**
   ```bash
   yarn nx build mnt --skip-nx-cache
   # Output will be in apps/mnt/.next with standalone folder for production
   ```

#### Running in Production Mode

1. **Run Backend:**
   ```bash
   # After building
   NODE_ENV=production node dist/apps/api/main
   ```

2. **Run Main UI:**
   ```bash
   # After building
   cd apps/fe/.next/standalone
   NODE_ENV=production node server.js
   ```

3. **Run Admin Dashboard:**
   ```bash
   # After building
   cd apps/mnt/.next/standalone
   NODE_ENV=production node server.js
   ```

### Docker Deployment Options

#### Backend Deployment

- **Option 1: Standalone Backend**
  ```bash
  docker compose up -d
  ```

- **Option 2: Backend with Redis Bundle**
  ```bash
  docker compose -f docker-compose.bundle.yml up -d
  ```

#### Frontend Deployments

For quick deployment with Vercel:

1. **Main User Interface:**
   - Connect your repository to Vercel
   - Configure environment variables
   - Use these build settings:
     - Build Command: `yarn nx build fe --skip-nx-cache`
     - Output Directory: `apps/fe/.next`
     - Install Command: `yarn install --immutable`

2. **Admin Dashboard:**
   - Create a separate Vercel project for the admin interface
   - Configure environment variables (including authentication)
   - Use these build settings:
     - Build Command: `yarn nx build mnt --skip-nx-cache`
     - Output Directory: `apps/mnt/.next`
     - Install Command: `yarn install --immutable`

#### Custom Docker Builds

You can also build and run your own Docker images using the provided Dockerfiles:

```bash
# Build and run backend
docker build -f apps/api/Dockerfile -t vephim-api .
docker run -p 8000:8000 vephim-api

# Build and run main UI
docker build -f apps/fe/Dockerfile -t vephim-fe .
docker run -p 3000:3000 vephim-fe

# Build and run admin dashboard
docker build -f apps/mnt/Dockerfile -t vephim-mnt .
docker run -p 4000:4000 vephim-mnt
```

## 🔍 Want to Contribute or Learn More?

This README provides an overview of VePhim. For detailed documentation, architecture diagrams, and contribution guidelines, check the `documents` directory or visit our [GitHub repository](https://github.com/lehuygiang28/vphim).

## ⚠️ Disclaimer

**IMPORTANT LEGAL NOTICE**

This project is provided **STRICTLY FOR EDUCATIONAL AND DEMONSTRATION PURPOSES ONLY**. VePhim is designed to showcase advanced web and mobile application development techniques, including:

- Monorepo architecture with Nx
- Full-stack JavaScript/TypeScript development
- Integration of AI services with web applications
- Streaming media delivery techniques
- Cross-platform mobile development

**VePhim does not:**
- Host, store, or distribute any movie content or media files
- Upload, copy, or transfer copyrighted material
- Circumvent any digital rights management technologies
- Encourage or promote copyright infringement

**All content accessed through VePhim:**
- Is sourced exclusively from publicly available third-party sources
- Remains on and is streamed directly from those third-party sources
- Is not modified, copied, or stored on VePhim servers at any time

**Legal Responsibilities:**
- Users are solely responsible for ensuring their use of VePhim complies with local copyright laws and regulations
- Users must have legal rights to access any content they view through VePhim
- The authors and contributors of VePhim assume no liability for any misuse of this software

By using VePhim, you acknowledge that you understand and accept these terms. If you intend to use any techniques demonstrated in this project, you agree to do so in a legal and ethical manner, respecting all applicable laws and intellectual property rights.

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.**
