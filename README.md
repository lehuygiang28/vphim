# VePhim: Watch Movies Online, Free and Fast

## What is VePhim?

VePhim is a website where you can watch movies online for free. It's like a giant library of movies that you can access anytime, anywhere with an internet connection.

## How does it work?

VePhim doesn't store movies on its own servers. Instead, it finds movies from other places on the internet and streams them to you. This way, you get to watch a huge variety of movies without buffering or waiting. It's like having a library of movies in your own home.

VePhim is built with a combination of React, Next.js, and Nest.js. It uses GraphQL for its API and MongoDB for its database. The website is designed to be user-friendly and easy to navigate, with a clean and modern interface. You can search for movies by title, genre, or actor, and save your favorites for later. VePhim also has an AI-powered search feature that helps you find the perfect movie based on your preferences.

## What's special about VePhim?

- **AI-Powered Search:** Let our AI help you find the perfect movie effortlessly.
- **Free Access:** Enjoy unlimited movie streaming without any cost.
- **Fast Streaming:** Experience smooth playback with our advanced HLS technology.
- **User-Friendly:** Easily browse and search for movies across various categories.
- **Favorites:** Create a free account to save and revisit your favorite movies.

## Project Structure with Nx

VePhim is built as a monorepo using Nx, a powerful build system and set of extensible dev tools. Nx helps us maintain a modular and scalable architecture for our project.

### Project Structure

```md
vephim/
├── apps/
│   ├── api/         # NestJS backend
│   │    └── .env    # Environment variables for the backend
│   ├── fe/          # Next.js frontend
│   │    └── .env    # Environment variables for the frontend
│   ├── mnt/         # Admin interface
│   │    └── .env    # Environment variables for the admin interface
│   └── mobile/      # React Native mobile app
├── tools/           # Build and development tools
├── .env             # Root environment variables (using when run mongodb, redis, elasticsearch with docker compose)
└── nx.json          # Nx configuration
```

## Technologies Used

VePhim is built using a combination of powerful technologies:

### Backend (behind-the-scenes)

- **NestJS:** Manages user accounts, movie CRUD operations, and ensures smooth operation.
- **MongoDB:** Stores all information about movies, users, and related data.
- **Redis:** Speeds up load times by storing frequently accessed information.
- **Gemini:** AI-driven search engine to find the perfect movie based on preferences.
- **Elasticsearch:** Powers the search engine with efficient vector-based searches.
- **GraphQL:** Simplifies user interactions with the backend through a flexible API.

### Frontend (user interface)

- **Next.js:** Makes the website look good and work smoothly in your browser.
- **Ant Design:** Provides all the buttons, menus, and other interactive elements you see on the website.

### Mobile App

- **Expo:** Allows VePhim to create apps for both Android and iOS devices.
- **UI Kitten:** Makes the mobile app beautiful and easy to use.

## How to Run VePhim Locally

- **First, run `yarn install` to install all dependencies.**
- **Then, copy `.env.example` to `.env` in root project, fill your environment variables in `.env`**
- **Last, run `docker compose -f docker-compose.infra.yml up -d` to start the mongodb, redis, and elasticsearch. If you already have other instances of mongodb, redis, and elasticsearch running, you can skip this and fill in each project `.env` with your environment variables**

1. Backend:
   - Copy `.env.example` to `apps/api/.env`
   - Fill in your environment variables in `apps/api/.env`
   - Start the server with `yarn api`
   - Your app will be running on `http://localhost:8000` by default

2. Frontend (User Interface):
   - Copy `.env.example` to `apps/fe/.env`
   - Fill in your environment variables in `apps/fe/.env`
   - Start the server with `yarn fe`
   - Your app will be running on `http://localhost:3000` by default

3. Admin Interface:
   - Copy `.env.example` to `apps/mnt/.env`
   - Fill in your environment variables in `apps/mnt/.env`
   - Start the server with `yarn mnt`
   - Your app will be running on `http://localhost:4000` by default

4. Mobile (Android):
   - Ensure your Android emulator is configured correctly
   - Run `yarn adr`

## How to Run VePhim on Hosts

1. Backend:
   - Requires `.env` file in `apps/api/.env`
   - Two options available:
     a. Run only `backend` with Docker image `lehuygiang28/vphim_api`:
        - Run `docker compose up -d`
        - Read [Docker Compose File](/docker-compose.yml) for more details
     b. Run bundled `backend` with `redis` using Docker image `lehuygiang28/vphim_api_redis`:
        - Run `docker compose -f docker-compose.bundle.yml up -d`
        - Read [Docker Compose File](/docker-compose.bundle.yml) for more details
        - Note: This bundle is a temporary solution for deployment on platforms like Hugging Face (free container). If you have a better solution, please let us know!

2. Frontend and Admin:
   - Docker image not yet configured. You can build your own or deploy for free with [Vercel](https://vercel.com/)
   - For [Vercel](https://vercel.com/) deployment:
     - Ensure your Vercel environment variables are configured correctly
     - Build command: `yarn nx build fe --skip-nx-cache`
     - Output Directory: `apps/fe/.next`
     - Install Command: `yarn install --immutable`
     - Change `fe` to `mnt` if you want to deploy the admin interface

## Want to Learn More?

This is just a basic overview of VePhim. If you're interested in learning more about the technical details, check out the full codebase on [GitHub](https://github.com/lehuygiang28/vphim).

## Disclaimer

This project is solely for educational purposes and is intended to demonstrate web/app development skills. It does not host or store any movie content or data. All media and data accessed by this project are sourced from publicly available, third-party sources on the internet.

Important Notes:

- This project is non-commercial and is not intended to distribute copyrighted material.
- The author does not claim ownership or rights to any third-party data accessed by this project.
- Users are responsible for ensuring their own compliance with copyright and licensing regulations when accessing third-party content.

Use at Your Own Risk: The author assumes no responsibility for any legal or other issues that may arise from using this project.
