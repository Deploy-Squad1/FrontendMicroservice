# FrontendMicroservice

Client-side application for the Secret Society platform.
Features:
* Gatekeeper passcode verification
* User login and registration
Built with Vue 3 and Bootstrap 5.

## Setup project

Install dependencies and run the development server:

npm install
npm run dev

App UI: http://localhost:5173

## Local development (Docker)

Build and run the container:

docker build -t frontend .
docker run -d -p 5173:5173 --name frontend-app frontend

Stop container:
docker rm -f frontend-app

## API Connection

The frontend communicates with the CoreMicroservice. 
Base API URL is set in `src/api.js`:
http://localhost:8000/api
