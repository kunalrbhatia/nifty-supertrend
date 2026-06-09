import { Config } from './src/config/env';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Config {}
  }
}
