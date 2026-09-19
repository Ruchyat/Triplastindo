import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, Input, Status } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import type { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import type { ApiAccount, ApiProduct, ApiProductCategory, ProductPayload } from '@/types'
import { useMasterList } from '../useMasterList'
import { matches } from '../matches'
import { ActiveToggle, MasterDrawer, MasterPanel, ShowInactive } from './MasterShell'

/**
 * Master produk dan item.
 *
 * Pemetaan akunlah intinya: akun pendapatan menentukan ke mana penjualan
 * produk ini masuk di Laba Rugi, dan produk tanpa pemetaan tidak muncul di
 * form penjualan.
 */
export function ProductsPanel() {
  const load = useCallback(() => masterDataService.products({ includeInactive: true }), [])
  const list = useMasterList<ApiProduct>(load)
  const [showInactive, setShowInactive] = useState(false)

  const loadRefs = useCallback(
    () =>
      Promise.all([
        masterDataService.productCategories(),
        masterDataService.accounts({ groups: ['pendapatan', 'pendapatan_lain'] }),
        masterDataService.accounts({ groups: ['aset_lancar'] }),
      ]),
    [],
  )
  const [categories = [], revenueAccounts = [], assetAccounts = []] = useAsync(loadRefs).data ?? []

  const rows = list.items.filter(
    product =>
      (showInactive || product.is_active) &&
      matches(list.search, product.code, product.name, product.category_label),
  )

  return (
    <>
      <MasterPanel
        title="Master Produk & Item"
        description="Dipakai baris invoice penjualan dan tagihan pembelian persediaan"
        addLabel="Tambah Produk"
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari kode, nama, atau kategori..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText="Tidak ada produk yang cocok."
        extra={<ShowInactive value={showInactive} onChange={setShowInactive} />}
      >
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Satuan</th>
            <th>Akun Pendapatan</th>
            <th>Akun Persediaan</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(product => (
            <tr key={product.id}>
              <td className="font-semibold text-blue-700">{product.code}</td>
              <td className="font-semibold">{product.name}</td>
              <td>{product.category_label}</td>
              <td>{product.unit}</td>
              <td className="text-slate-500">{product.revenue_account?.label ?? '–'}</td>
              <td className="text-slate-500">{product.inventory_account?.label ?? '–'}</td>
              <td>
                <Status tone={product.is_active ? 'green' : 'slate'}>
                  {product.is_active ? 'Aktif' : 'Nonaktif'}
                </Status>
              </td>
              <td>
                <button
                  type="button"
                  className="font-semibold text-blue-700"
                  onClick={() => list.setEditing(product)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <ProductDrawer
          product={list.editing === 'new' ? null : list.editing}
          categories={categories}
          revenueAccounts={revenueAccounts}
          assetAccounts={assetAccounts}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() =>
              list.editing === 'new' || list.editing === null
                ? masterDataService.createProduct(payload)
                : masterDataService.updateProduct(list.editing.id, payload),
            )
          }
        />
      )}
    </>
  )
}

type DrawerProps = {
  product: ApiProduct | null
  categories: ApiProductCategory[]
  revenueAccounts: ApiAccount[]
  assetAccounts: ApiAccount[]
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: ProductPayload) => void
}

function ProductDrawer({
  product,
  categories,
  revenueAccounts,
  assetAccounts,
  isSaving,
  error,
  onClose,
  onSave,
}: DrawerProps) {
  const [code, setCode] = useState(product?.code ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'Kg')
  const [revenueId, setRevenueId] = useState(product?.revenue_account_id ? String(product.revenue_account_id) : '')
  const [inventoryId, setInventoryId] = useState(
    product?.inventory_account_id ? String(product.inventory_account_id) : '',
  )
  const [isActive, setIsActive] = useState(product?.is_active ?? true)

  const isValid = name.trim() !== '' && category !== '' && unit.trim() !== ''
  const toOptions = (accounts: ApiAccount[]) =>
    accounts.map(account => ({ value: String(account.id), label: account.label }))

  return (
    <MasterDrawer
      title={product ? `Edit ${product.name}` : 'Produk Baru'}
      description="Akun pendapatan wajib bila produk ini dijual; akun persediaan bila dibeli sebagai stok."
      onClose={onClose}
      isSaving={isSaving}
      isValid={isValid}
      error={error}
      onSave={() =>
        onSave({
          code: code.trim() || null,
          name: name.trim(),
          category,
          unit: unit.trim(),
          revenue_account_id: revenueId ? Number(revenueId) : null,
          inventory_account_id: inventoryId ? Number(inventoryId) : null,
          is_active: isActive,
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Kode">
          <Input placeholder="Otomatis" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
          <FieldError message={error?.fieldError('code')} />
        </Field>
        <Field label="Nama Produk" required>
          <Input autoFocus={!product} value={name} onChange={e => setName(e.target.value)} />
          <FieldError message={error?.fieldError('name')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" required>
          <Combobox placeholder="Pilih kategori..." options={categories} value={category} onChange={setCategory} />
          <FieldError message={error?.fieldError('category')} />
        </Field>
        <Field label="Satuan" required>
          <Input value={unit} onChange={e => setUnit(e.target.value)} />
          <FieldError message={error?.fieldError('unit')} />
        </Field>
      </div>

      <Field label="Akun Pendapatan">
        <Combobox
          placeholder="Tidak dijual"
          options={toOptions(revenueAccounts)}
          value={revenueId}
          onChange={setRevenueId}
        />
        <FieldError message={error?.fieldError('revenue_account_id')} />
      </Field>

      <Field label="Akun Persediaan">
        <Combobox
          placeholder="Bukan barang stok"
          options={toOptions(assetAccounts)}
          value={inventoryId}
          onChange={setInventoryId}
        />
        <FieldError message={error?.fieldError('inventory_account_id')} />
      </Field>

      <ActiveToggle value={isActive} onChange={setIsActive} />
    </MasterDrawer>
  )
}
