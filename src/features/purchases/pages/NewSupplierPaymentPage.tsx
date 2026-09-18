import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { masterDataService } from '@/services/masterDataService'
import { SupplierPaymentForm } from '../components/payment-form'

/**
 * Halaman pencatatan pembayaran supplier.
 *
 * `?supplier=` dan `?bill=` mengisi form di muka, dipakai tombol Bayar pada
 * detail tagihan.
 */
export function NewSupplierPaymentPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [isDirty, setIsDirty] = useState(false)
  const guard = useUnsavedChanges(isDirty)

  const supplierId = Number(params.get('supplier')) || undefined
  const billId = Number(params.get('bill')) || undefined

  const loadMasterData = useCallback(
    () => Promise.all([masterDataService.suppliers(), masterDataService.accounts({ isCash: true })]),
    [],
  )
  const master = useAsync(loadMasterData)
  const [suppliers = [], accounts = []] = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pembelian"
        title="Pembayaran Supplier"
        description="Utang tagihan yang dibayar berkurang, dan jurnalnya dibuat otomatis"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.purchases)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {master.error && <InfoNote tone="red">{master.error}</InfoNote>}

      {!master.isLoading && (
        <SupplierPaymentForm
          suppliers={suppliers}
          accounts={accounts}
          initialSupplierId={supplierId}
          initialBillId={billId}
          onCancel={() => navigate(-1)}
          onDirtyChange={setIsDirty}
          onSaved={paymentId => {
            guard.release()
            navigate(toPath.supplierPayment(paymentId), { replace: true })
          }}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan pembayaran ini?"
          description="Tagihan yang sudah dicentang belum tersimpan dan akan hilang."
          confirmLabel="Tinggalkan"
          cancelLabel="Tetap di Sini"
          onCancel={guard.stay}
          onConfirm={guard.proceed}
        />
      )}
    </div>
  )
}
