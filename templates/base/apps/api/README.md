# Express API Server

This is the API server managed in a Turborepo monorepo setup. It is built with Express and provides a simple RESTful API.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then, update the variables in your `.env.local` file

### 3. Run the Server

#### Development

```bash
pnpm dev
```

#### Production

```bash
pnpm build
pnpm start
```

The server runs at `http://localhost:4000` by default. Set `PORT` in `.env.local` to use a different port.

### 4. API Endpoints

- `GET /health`: Basic health check with uptime and timestamp.
- `GET /healthz`: Kubernetes liveness probe.
- `GET /readyz`: Kubernetes readiness probe.
- `GET /metrics`: Prometheus metrics scraping endpoint.

## Middleware & Monitoring

- **Prometheus Metrics**: High-resolution HTTP RED metrics (`http_requests_total`, `http_request_duration_seconds`, `http_requests_in_flight`) and Node.js process metrics via `prom-client`.
- **Pino & Pino-HTTP**: Fast, structured JSON logging with sensitive data redaction.
- **Helmet**: Security HTTP headers.
- **Body Parsers**: Express JSON and URL-encoded request body parsing.
- **Credentials & CORS**: Whitelists origins and handles credentials safely.
- **Rate Limiting**: Distributed Upstash Redis rate limiting on `/api` routes.
- **Error Handling**: Centralized error handling and correlated logging.
