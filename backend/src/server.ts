import app from './app.js';
import { env } from './config/env.js';
import { initDatabaseSchema } from './utils/initDatabaseSchema.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Express Backend API running on port ${PORT}`);
  console.log(`📡 Allowed CORS origin: ${env.FRONTEND_URL}`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/api/health`);
  await initDatabaseSchema();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
