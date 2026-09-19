import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { routePaths } from '@/app/router'
import { Card, Combobox, EmptyState, FilterBar, InfoNote, Input, TableWrap } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrencyOrDash, formatDate, formatNumber, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { inventoryService } from '@/services/inventoryService'
import { masterDataService } from '@/services/masterDataService'

type Props = { year: number; canWrite: boolean; onChanged: () => void }

/** Kartu stok: seluruh mutasi Kg dari pembelian, produksi, pemakaian, penjualan. */
export function StockMovementsTable({ year, canWrite, onChanged }: Props) {
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState(`${year}-01-01`)
  const [to, setTo] = useState(`${year}-12-31`)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    () => inventoryService.movements({ productId: productId ? Number(productId) : undefined, from, to }),
    [productId, from, to],
  )
  const { data, isLoading, reload } = useAsync(load)
  const loadProducts = useCallback(() => masterDataService.products({ includeInactive: true }), [])
  const products = useAsync(loadProducts).data ?? []

  async function remove(id: number) {
    setError(null)
    try {
      await inventoryService.remove(id)
      reload()
      onChanged()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Gagal menghapus.')
    }
  }

  const rows = data?.data ?? []

  return (
    <Card>
      <FilterBar search={false}>
        <Input type="date" aria-label="Dari" className="w-40" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" aria-label="Sampai" className="w-40" value={to} onChange={e => setTo(e.target.value)} />
        <Combobox
          className="w-64"
          aria-label="Produk"
          options={[{ value: '', label: 'Semua Produk' }, ...products.map(p => ({ value: String(p.id), label: p.name, description: p.code }))]}
          value={productId}
          onChange={setProductId}
        />
      </FilterBar>
      {error && <div className="p-4"><InfoNote tone="red" variant="inset">{error}</InfoNote></div>}
      {rows.length === 0 && !isLoading ? (
        <EmptyState title="Belum ada mutasi" description="Mutasi terisi dari pembelian, penjualan, dan input produksi." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Produk</th>
              <th>Jenis</th>
              <th>Keterangan</th>
              <th>Dokumen</th>
              <th className="text-right">Masuk (Kg)</th>
              <th className="text-right">Keluar (Kg)</th>
              <th className="text-right">Harga / Kg</th>
              <th className="text-right">Nilai</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.id}>
                <td>{formatDate(m.date)}</td>
                <td className="font-semibold">{m.product.name}</td>
                <td>{m.type_label}</td>
                <td className="text-slate-500">{m.description}</td>
                <td>
                  {m.source_number ?? (m.journal_number ? (
                    <Link to={`${routePaths.journals}?search=${encodeURIComponent(m.journal_number)}&month=${m.date.slice(0, 7)}`} className="font-semibold text-blue-700">{m.journal_number}</Link>
                  ) : '–')}
                </td>
                <td className="money !text-emerald-700">{m.direction === 'in' ? formatNumber(toAmount(m.quantity)) : '–'}</td>
                <td className="money !text-rose-700">{m.direction === 'out' ? formatNumber(toAmount(m.quantity)) : '–'}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(m.unit_cost))}</td>
                <td className="money">{formatCurrencyOrDash(toAmount(m.amount))}</td>
                <td>
                  {canWrite && !m.source_number && !m.journal_number && (
                    <button type="button" aria-label="Hapus" className="text-slate-400 hover:text-rose-600" onClick={() => void remove(m.id)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}
