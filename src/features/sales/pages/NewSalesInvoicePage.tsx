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
import { SaleInvoiceForm } from '../components/invoice-form'

/**
 * Halaman pembuatan invoice penjualan.
 *
 * Halaman penuh, bukan panel: pencatatan penjualan adalah pintu masuk
 * transaksi inti, isiannya panjang, dan ia perlu punya alamat sendiri agar
 * tidak hilang oleh satu klik atau satu refresh.
 */
export function NewSalesInvoicePage() {
  const navigate = useNavigate()
  const [isDirty, setIsDirty] = useState(false)
  const guard = useUnsavedChanges(isDirty)

  const loadMasterData = useCallback(
    () =>
      Promise.all([
        masterDataService.customers({ withBalance: true }),
        masterDataService.products(),
        masterDataService.accounts({ isCash: true }),
      ]),
    [],
  )
  const master = useAsync(loadMasterData)
  const [customers = [], products = [], accounts = []] = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Penjualan"
        title="Invoice Penjualan Baru"
        description="Jurnal dibuat otomatis oleh sistem setelah invoice diposting"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.sales)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {master.error && <InfoNote tone="red">{master.error}</InfoNote>}

      {!master.isLoading && (
        <SaleInvoiceForm
          customers={customers}
          products={products}
          accounts={accounts}
          onCancel={() => navigate(routePaths.sales)}
          onDirtyChange={setIsDirty}
          onSaved={invoice => {
            guard.release()
            navigate(toPath.salesInvoice(invoice.id), { replace: true })
          }}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan invoice ini?"
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
