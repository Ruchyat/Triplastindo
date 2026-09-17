/** Pengguna yang sedang masuk. Diganti hasil endpoint autentikasi Laravel nantinya. */
export const currentUser = {
  name: 'Andi Setiawan',
  role: 'Finance',
  initials: 'AS',
}

/** Periode buku yang sedang aktif dan dipakai sebagai filter default. */
export const activePeriod = {
  label: 'September 2026',
  month: 9,
  year: 2026,
  /** Tanggal posisi data untuk teks "Per ..." pada Dashboard. */
  asOf: '2026-09-17',
}
