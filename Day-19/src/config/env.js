// ==============================================================================
// DAY 17: ENVIRONMENT-BASED CONFIGURATION MODULE
// Clean, centralized environment configuration with fallbacks for Vite & React
// ==============================================================================

export const env = {
  // REST API Endpoints
  API_URL: import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1",
  API_BASE_URL: (import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, ""),

  // WebSocket Endpoints
  WS_URL: import.meta.env?.VITE_WS_URL || "ws://127.0.0.1:8000/ws",

  // Environment Metas
  APP_ENV: import.meta.env?.VITE_APP_ENV || "development",
  APP_NAME: import.meta.env?.VITE_APP_NAME || "R-Mart Real-Time Omnichannel",
  IS_DEV: import.meta.env?.DEV ?? true,
  IS_PROD: import.meta.env?.PROD ?? false,
};

export default env;
