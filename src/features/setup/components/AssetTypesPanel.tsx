import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, Input, NumberInput } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import type { ApiError } from '@/services/httpClient'
import { http } from '@/services/httpClient'
import { assetService } from '@/services/assetService'
import { masterDataService } from '@/services/masterDataService'
import type { ApiAccount, ApiAssetType } from '@/types'
import { matches } from '../matches'
import { useMasterList } from '../useMasterList'
import { MasterDrawer, MasterPanel } from './MasterShell'

type Payload = {
  name: string
  default_useful_life_years: number
  is_depreciable: boolean
  asset_account_id: number
  accumulated_account_id: number | null
  expense_account_id: number | null
}

/**
 * Jenis aset beserta tiga akunnya. Pengguna cukup memilih jenis saat mencatat
 * aset, dan jurnal penyusutannya tersusun dari pemetaan ini.
 */
export function AssetTypesPanel() {
  const load = useCallback(() => assetService.types(), [])
  const list = useMasterList<ApiAssetType>(load)

  const loadAccounts = useCallback(
    () =>
      Promise.all([
        masterDataService.accounts({ groups: ['aset_tidak_lancar'] }),
        masterDataService.accounts({ groups: ['kontra_aset'] }),
        masterDataService.accounts({ groups: ['hpp', 'beban'] }),
      ]),
    [],
  )
  const [assetAccounts = [], accumulatedAccounts = [], expenseAccounts = []] = useAsync(loadAccounts).data ?? []

  const rows = list.items.filter(t => matches(list.search, t.name))

  return (
    <>
      <MasterPanel
        title="Master Jenis Aset"
        description="Pemetaan akun aset, akumulasi penyusutan, dan beban penyusutan"
        addLabel="Tambah Jenis"
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari jenis aset..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText="Belum ada jenis aset."
      >
        <thead>
          <tr>
            <th>Jenis</th>
            <th>Umur Default</th>
            <th>Akun Aset</th>
            <th>Akun Akumulasi</th>
            <th>Akun Beban</th>
            <th className="text-right">Aset</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id}>
              <td className="font-semibold">{t.name}</td>
              <td>{t.is_depreciable ? `${t.default_useful_life_years} tahun` : 'Tidak disusutkan'}</td>
              <td className="text-slate-500">{t.asset_account}</td>
              <td className="text-slate-500">{t.accumulated_account ?? '–'}</td>
              <td className="text-slate-500">{t.expense_account ?? '–'}</td>
              <td className="money">{t.assets_count}</td>
              <td>
                <button type="button" className="font-semibold text-blue-700" onClick={() => list.setEditing(t)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <AssetTypeDrawer
          type={list.editing === 'new' ? null : list.editing}
          assetAccounts={assetAccounts}
          accumulatedAccounts={accumulatedAccounts}
          expenseAccounts={expenseAccounts}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() =>
              list.editing === 'new' || list.editing === null
                ? http.post('/asset-types', payload)
                : http.put(`/asset-types/${list.editing.id}`, payload),
            )
          }
        />
      )}
    </>
  )
}

type DrawerProps = {
  type: ApiAssetType | null
  assetAccounts: ApiAccount[]
  accumulatedAccounts: ApiAccount[]
  expenseAccounts: ApiAccount[]
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: Payload) => void
}

function AssetTypeDrawer({ type, assetAccounts, accumulatedAccounts, expenseAccounts, isSaving, error, onClose, onSave }: DrawerProps) {
  const [name, setName] = useState(type?.name ?? '')
  const [years, setYears] = useState(type ? String(type.default_useful_life_years) : '5')
  const [depreciable, setDepreciable] = useState(type?.is_depreciable ?? true)
  const [assetId, setAssetId] = useState(type ? String(type.asset_account_id) : '')
  const [accumulatedId, setAccumulatedId] = useState(type?.accumulated_account_id ? String(type.accumulated_account_id) : '')
  const [expenseId, setExpenseId] = useState(type?.expense_account_id ? String(type.expense_account_id) : '')

  const toOptions = (accounts: ApiAccount[]) => accounts.map(a => ({ value: String(a.id), label: a.label }))
  const isValid = name.trim() !== '' && assetId !== '' && (!depreciable || (accumulatedId !== '' && expenseId !== ''))

  return (
    <MasterDrawer
      title={type ? `Edit ${type.name}` : 'Jenis Aset Baru'}
      onClose={onClose}
      isSaving={isSaving}
      isValid={isValid}
      error={error}
      onSave={() =>
        onSave({
          name: name.trim(),
          default_useful_life_years: Number(years) || 0,
          is_depreciable: depreciable,
          asset_account_id: Number(assetId),
          accumulated_account_id: depreciable && accumulatedId ? Number(accumulatedId) : null,
          expense_account_id: depreciable && expenseId ? Number(expenseId) : null,
        })
      }
    >
      <Field label="Nama Jenis" required>
        <Input autoFocus={!type} value={name} onChange={e => setName(e.target.value)} />
        <FieldError message={error?.fieldError('name')} />
      </Field>
      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
        <input type="checkbox" className="size-4 accent-blue-700" checked={depreciable} onChange={e => setDepreciable(e.target.checked)} />
        Disusutkan (tanah tidak)
      </label>
      {depreciable && (
        <Field label="Umur Manfaat Bawaan" required>
          <NumberInput suffix="tahun" value={years} onChange={setYears} />
        </Field>
      )}
      <Field label="Akun Aset Tetap" required>
        <Combobox placeholder="Pilih akun..." options={toOptions(assetAccounts)} value={assetId} onChange={setAssetId} />
      </Field>
      {depreciable && (
        <>
          <Field label="Akun Akumulasi Penyusutan" required>
            <Combobox placeholder="Pilih akun..." options={toOptions(accumulatedAccounts)} value={accumulatedId} onChange={setAccumulatedId} />
          </Field>
          <Field label="Akun Beban Penyusutan" required>
            <Combobox placeholder="Pilih akun..." options={toOptions(expenseAccounts)} value={expenseId} onChange={setExpenseId} />
          </Field>
        </>
      )}
    </MasterDrawer>
  )
}
