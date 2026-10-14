export interface AppEnv {
  API_URL: string;
  API_BASE_URL: string;
  WS_URL: string;
  APP_ENV: string;
  APP_NAME: string;
  IS_DEV: boolean;
  IS_PROD: boolean;
}

export declare const env: AppEnv;
export default env;
