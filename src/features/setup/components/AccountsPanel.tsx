import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, Input, Status, Textarea } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import type { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import type { AccountPayload, ApiAccount, ApiAccountCategory } from '@/types'
import { useMasterList } from '../useMasterList'
import { matches } from '../matches'
import { ActiveToggle, MasterDrawer, MasterPanel, ShowInactive } from './MasterShell'

const normalBalanceOptions = [
  { value: 'debit', label: 'Debit' },
  { value: 'kredit', label: 'Kredit' },
]

/**
 * Chart of Accounts.
 *
 * Akun tidak pernah dihapus — jurnal lama merujuk ke sana — melainkan
 * dinonaktifkan. Kode, kategori, dan saldo normal akun yang sudah dipakai
 * jurnal dikunci backend.
 */
export function AccountsPanel() {
  const load = useCallback(() => masterDataService.accounts({ includeInactive: true }), [])
  const list = useMasterList<ApiAccount>(load)
  const [showInactive, setShowInactive] = useState(false)

  const loadCategories = useCallback(() => masterDataService.accountCategories(), [])
  const categories = useAsync(loadCategories).data ?? []

  const rows = list.items.filter(
    account =>
      (showInactive || account.is_active) &&
      matches(list.search, account.code, account.name, account.category?.name),
  )

  return (
    <>
      <MasterPanel
        title="Chart of Accounts"
        description="Daftar akun yang dipakai seluruh jurnal dan laporan"
        addLabel="Tambah Akun"
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari kode, nama, atau kategori..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText="Tidak ada akun yang cocok."
        extra={<ShowInactive value={showInactive} onChange={setShowInactive} />}
      >
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Akun</th>
            <th>Kategori</th>
            <th>Kelompok</th>
            <th>Saldo Normal</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(account => (
            <tr key={account.id}>
              <td className="font-semibold text-blue-700">{account.code}</td>
              <td className="font-semibold">{account.name}</td>
              <td>{account.category?.name}</td>
              <td className="text-slate-500">{account.category?.group_label}</td>
              <td>{account.normal_balance_label}</td>
              <td>
                <Status tone={account.is_active ? 'green' : 'slate'}>
                  {account.is_active ? 'Aktif' : 'Nonaktif'}
                </Status>
              </td>
              <td>
                <button
                  type="button"
                  className="font-semibold text-blue-700"
                  onClick={() => list.setEditing(account)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <AccountDrawer
          account={list.editing === 'new' ? null : list.editing}
          categories={categories}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() =>
              list.editing === 'new' || list.editing === null
                ? masterDataService.createAccount(payload)
                : masterDataService.updateAccount(list.editing.id, payload),
            )
          }
        />
      )}
    </>
  )
}

type DrawerProps = {
  account: ApiAccount | null
  categories: ApiAccountCategory[]
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: AccountPayload) => void
}

function AccountDrawer({ account, categories, isSaving, error, onClose, onSave }: DrawerProps) {
  const [code, setCode] = useState(account?.code ?? '')
  const [name, setName] = useState(account?.name ?? '')
  const [categoryId, setCategoryId] = useState(account ? String(account.account_category_id) : '')
  const [normalBalance, setNormalBalance] = useState<'debit' | 'kredit'>(account?.normal_balance ?? 'debit')
  const [description, setDescription] = useState(account?.description ?? '')
  const [isActive, setIsActive] = useState(account?.is_active ?? true)

  /**
   * Saldo normal mengikuti kelompok kategori saat kategorinya dipilih pada akun
   * baru; pengguna tetap bisa menggantinya untuk akun kontra.
   */
  function selectCategory(value: string) {
    setCategoryId(value)
    const picked = categories.find(candidate => String(candidate.id) === value)
    if (account || !picked) return
    const creditGroups = ['liabilitas', 'ekuitas', 'pendapatan', 'pendapatan_lain', 'kontra_aset']
    setNormalBalance(creditGroups.includes(picked.group) ? 'kredit' : 'debit')
  }

  const isValid = /^[0-9]-[0-9]{5}$/.test(code) && name.trim() !== '' && categoryId !== ''

  return (
    <MasterDrawer
      title={account ? `Edit ${account.code}` : 'Akun Baru'}
      description={account ? 'Akun yang sudah dipakai jurnal hanya dapat diganti nama dan statusnya.' : undefined}
      onClose={onClose}
      isSaving={isSaving}
      isValid={isValid}
      error={error}
      onSave={() =>
        onSave({
          code,
          name: name.trim(),
          account_category_id: Number(categoryId),
          normal_balance: normalBalance,
          description: description || null,
          is_active: isActive,
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Kode" required>
          <Input placeholder="1-10009" value={code} onChange={e => setCode(e.target.value)} />
          <FieldError message={error?.fieldError('code')} />
        </Field>
        <Field label="Nama Akun" required>
          <Input autoFocus={!account} value={name} onChange={e => setName(e.target.value)} />
          <FieldError message={error?.fieldError('name')} />
        </Field>
      </div>

      <Field label="Kategori" required>
        <Combobox
          placeholder="Pilih kategori..."
          options={categories.map(item => ({
            value: String(item.id),
            label: item.name,
            description: `${item.group_label} · ${item.statement_label}`,
          }))}
          value={categoryId}
          onChange={selectCategory}
        />
        <FieldError message={error?.fieldError('account_category_id')} />
      </Field>

      <Field label="Saldo Normal" required>
        <Combobox
          clearable={false}
          options={normalBalanceOptions}
          value={normalBalance}
          onChange={value => setNormalBalance(value as 'debit' | 'kredit')}
        />
        <FieldError message={error?.fieldError('normal_balance')} />
      </Field>

      <Field label="Keterangan">
        <Textarea className="min-h-16" value={description} onChange={e => setDescription(e.target.value)} />
      </Field>

      <ActiveToggle value={isActive} onChange={setIsActive} />
    </MasterDrawer>
  )
}
