/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL REST API Laravel, misalnya `https://api.triplastindo.test/api`. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
