import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from './server';

export const authHandlers = toNextJsHandler(auth);
