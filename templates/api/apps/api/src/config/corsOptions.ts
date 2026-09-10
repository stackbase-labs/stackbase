import { CorsOptions } from 'cors';
import allowedOrigins from './allowedOrigins';

const allowMissingOrigin = process.env.CORS_ALLOW_MISSING_ORIGIN === 'true';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, allowMissingOrigin);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;
