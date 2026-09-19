import { useState } from 'react'
import { Card, Combobox, EmptyState, FilterBar, Status, TableWrap } from '@/components/common'
import { formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiAssetType, ApiFixedAsset } from '@/types'
import { DisposeDialog } from './DisposeDialog'

type Props = {
  assets: ApiFixedAsset[]
  types: ApiAssetType[]
  isLoading: boolean
  canWrite: boolean
  onEdit: (asset: ApiFixedAsset) => void
  onChanged: () => void
}

const statusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'disposed', label: 'Dilepas' },
  { value: '', label: 'Semua' },
]

/** Daftar aset dengan kolom-kolom tab ASET & DEPRESIASI. */
export function AssetListTab({ assets, types, isLoading, canWrite, onEdit, onChanged }: Props) {
  const [typeId, setTypeId] = useState('')
  const [status, setStatus] = useState('active')
  const [search, setSearch] = useState('')
  const [disposing, setDisposing] = useState<ApiFixedAsset | null>(null)

  const rows = assets.filter(
    a =>
      (!typeId || String(a.asset_type_id) === typeId) &&
      (!status || a.status === status) &&
      (!search || `${a.code} ${a.name}`.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <Card>
      <FilterBar searchPlaceholder="Cari kode atau nama aset..." onSearchChange={setSearch}>
        <Combobox
          className="w-56"
          aria-label="Jenis aset"
          options={[{ value: '', label: 'Semua Jenis' }, ...types.map(t => ({ value: String(t.id), label: t.name }))]}
          value={typeId}
          onChange={setTypeId}
        />
        <Combobox className="w-36" aria-label="Status" clearable={false} options={statusOptions} value={status} onChange={setStatus} />
      </FilterBar>

      {rows.length === 0 && !isLoading ? (
        <EmptyState title="Belum ada aset" description="Tambahkan aset lewat tombol di kanan atas." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Aset</th>
              <th>Jenis</th>
              <th>Tgl Pakai</th>
              <th className="text-right">Nominal</th>
              <th>Umur</th>
              <th className="text-right">Residu</th>
              <th className="text-right">Depresiasi / Bln</th>
              <th className="text-right">Bulan Berjalan</th>
              <th className="text-right">Akumulasi</th>
              <th className="text-right">Nilai Buku</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id} className={toAmount(a.cost) === 0 ? 'bg-amber-50/60' : undefined}>
                <td className="font-semibold text-blue-700">{a.code}</td>
                <td className="font-semibold">{a.name}</td>
                <td>{a.type?.name}</td>
                <td>{formatDate(a.in_use_date)}</td>
                <td className="money">{formatCurrency(toAmount(a.cost))}</td>
                <td>{a.type?.is_depreciable ? `${a.useful_life_years} thn` : '–'}</td>
                <td className="money">{formatCurrency(toAmount(a.residual_value))}</td>
                <td className="money">{formatCurrency(toAmount(a.monthly_depreciation))}</td>
                <td className="money">{a.months_in_use}</td>
                <td className="money">{formatCurrency(toAmount(a.accumulated_depreciation))}</td>
                <td className="money !text-blue-700">{formatCurrency(toAmount(a.book_value))}</td>
                <td>
                  <Status tone={a.status === 'active' ? 'green' : 'slate'}>{a.status === 'active' ? 'Aktif' : 'Dilepas'}</Status>
                </td>
                <td className="whitespace-nowrap">
                  {canWrite && a.status === 'active' && (
                    <>
                      <button type="button" className="font-semibold text-blue-700" onClick={() => onEdit(a)}>
                        Edit
                      </button>
                      <button type="button" className="ml-3 font-semibold text-rose-600" onClick={() => setDisposing(a)}>
                        Lepas
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {disposing && (
        <DisposeDialog
          asset={disposing}
          onClose={() => setDisposing(null)}
          onDone={() => {
            setDisposing(null)
            onChanged()
          }}
        />
      )}
    </Card>
  )
}
