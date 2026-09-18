import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { masterDataService } from '@/services/masterDataService'
import type { ApiProduct } from '@/types'
import { PurchaseBillFormView } from '../components/bill-form'

/**
 * Halaman pembuatan tagihan pembelian.
 *
 * Kategori pembelian diambil dari backend, bukan didaftar ulang di sini:
 * pemetaan kategori ke akun ada di konfigurasi server.
 */
export function NewPurchaseBillPage() {
  const navigate = useNavigate()
  const [isDirty, setIsDirty] = useState(false)
  const guard = useUnsavedChanges(isDirty)

  // Produk yang dibuat dari dalam form, ditambahkan ke daftar tanpa memuat
  // ulang master data — pemuatan ulang akan mengosongkan form yang sedang diisi.
  const [createdProducts, setCreatedProducts] = useState<ApiProduct[]>([])

  const loadMasterData = useCallback(
    () =>
      Promise.all([
        masterDataService.suppliers(),
        masterDataService.products(),
        masterDataService.productCategories(),
        masterDataService.purchaseCategories(),
        masterDataService.accounts({ isCash: true }),
        masterDataService.accounts(),
      ]),
    [],
  )
  const master = useAsync(loadMasterData)
  const [
    suppliers = [],
    loadedProducts = [],
    productCategories = [],
    categories = [],
    cashAccounts = [],
    allAccounts = [],
  ] = master.data ?? []

  const products = [...loadedProducts, ...createdProducts].sort((a, b) =>
    a.name.localeCompare(b.name, 'id'),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pembelian"
        title="Tagihan Pembelian Baru"
        description="Kategori pembelian menentukan akun mana yang dipakai jurnalnya"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.purchases)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {master.error && <InfoNote tone="red">{master.error}</InfoNote>}

      {!master.isLoading && (
        <PurchaseBillFormView
          suppliers={suppliers}
          products={products}
          productCategories={productCategories}
          categories={categories}
          cashAccounts={cashAccounts}
          allAccounts={allAccounts}
          onCancel={() => navigate(routePaths.purchases)}
          onDirtyChange={setIsDirty}
          onProductCreated={product => setCreatedProducts(current => [...current, product])}
          onSaved={bill => {
            guard.release()
            navigate(toPath.purchaseBill(bill.id), { replace: true })
          }}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan tagihan ini?"
          description="Isian yang sudah diketik belum tersimpan dan akan hilang. Simpan sebagai draft bila ingin melanjutkannya nanti."
          confirmLabel="Tinggalkan"
          cancelLabel="Tetap di Sini"
          onCancel={guard.stay}
          onConfirm={guard.proceed}
        />
      )}
    </div>
  )
}
