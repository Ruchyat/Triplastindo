import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  /** Alamat backend Laravel, disajikan oleh Laravel Valet. */
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://be-triplastindo.test'

  /**
   * Host yang boleh mengakses dev server selain localhost.
   *
   * Vite menolak host asing sebagai perlindungan terhadap DNS rebinding, jadi
   * domain tunnel harus didaftarkan. Awalan titik mencakup seluruh subdomain,
   * sehingga `dev.tplastindo.com` dan `fe.rmw78.cfd` sama-sama diterima.
   */
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || '.tplastindo.com,.rmw78.cfd')
    .split(',')
    .map(host => host.trim())
    .filter(Boolean)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Mendengarkan di semua antarmuka agar dapat dibuka dari perangkat lain
      // pada jaringan yang sama, sekaligus dari cloudflared.
      host: true,
      // Port khusus proyek ini agar tidak berebut dengan proyek lain
      // yang memakai 5173, dan agar domain tunnel selalu menunjuk ke sini.
      port: 5178,
      // Gagal terang-terangan bila port terpakai, daripada diam-diam pindah port
      // dan membuat alamat tunnel tidak lagi menunjuk ke aplikasi ini.
      strictPort: true,
      allowedHosts,
      proxy: {
        /*
         * Permintaan API diteruskan oleh dev server ke Laravel.
         *
         * Dengan begitu frontend selalu memanggil `/api` pada origin yang sama,
         * sehingga alamat backend tidak perlu ikut berubah saat aplikasi dibuka
         * lewat localhost, IP jaringan, maupun domain tunnel — dan tidak ada
         * lagi persoalan CORS selama pengembangan.
         */
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
      allowedHosts,
    },
  }
})
