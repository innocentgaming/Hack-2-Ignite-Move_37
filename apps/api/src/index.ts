import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 InternOS API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📡 Health endpoint available at http://localhost:${env.PORT}/api/health`);
  console.log(`🔒 API v1 available at http://localhost:${env.PORT}/api/v1`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
