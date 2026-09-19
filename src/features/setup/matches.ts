/** Pencocokan sederhana untuk kotak cari: setiap kata harus ada di salah satu kolom. */
export function matches(search: string, ...fields: (string | null | undefined)[]): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = fields.filter(Boolean).join(' ').toLowerCase()
  return words.every(word => haystack.includes(word))
}
