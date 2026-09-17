/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Alamat lengkap REST API, mis. `https://api.triplastindo.com/api`.
   * Kosongkan agar aplikasi memakai `/api` pada origin yang sama.
   */
  readonly VITE_API_BASE_URL?: string

  /** Alamat backend Laravel yang dituju proxy dev server. Default `http://127.0.0.1:8001`. */
  readonly VITE_API_PROXY_TARGET?: string

  /** Host tambahan yang boleh membuka dev server, dipisahkan koma. */
  readonly VITE_ALLOWED_HOSTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
