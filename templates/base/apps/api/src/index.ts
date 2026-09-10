import './env';

import { logger } from '@workspace/logger';
import { createServer } from './server';

const PORT = process.env.PORT || 4000;

// Create Express app
const server = createServer();

server.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`);
});
