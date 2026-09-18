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
import { ReceiptForm } from '../components/receipt-form'

/**
 * Halaman pencatatan penerimaan pembayaran.
 *
 * `?customer=` dan `?invoice=` mengisi form di muka, dipakai tombol Terima
 * Pembayaran pada detail invoice.
 */
export function NewReceiptPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [isDirty, setIsDirty] = useState(false)
  const guard = useUnsavedChanges(isDirty)

  const customerId = Number(params.get('customer')) || undefined
  const invoiceId = Number(params.get('invoice')) || undefined

  const loadMasterData = useCallback(
    () =>
      Promise.all([
        masterDataService.customers({ withBalance: true }),
        masterDataService.accounts({ isCash: true }),
      ]),
    [],
  )
  const master = useAsync(loadMasterData)
  const [customers = [], accounts = []] = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Penjualan"
        title="Penerimaan Pembayaran"
        description="Piutang invoice yang dibayar berkurang, dan jurnalnya dibuat otomatis"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.sales)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {master.error && <InfoNote tone="red">{master.error}</InfoNote>}

      {!master.isLoading && (
        <ReceiptForm
          customers={customers}
          accounts={accounts}
          initialCustomerId={customerId}
          initialInvoiceId={invoiceId}
          onCancel={() => navigate(-1)}
          onDirtyChange={setIsDirty}
          onSaved={receiptId => {
            guard.release()
            navigate(toPath.receipt(receiptId), { replace: true })
          }}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan penerimaan ini?"
          description="Invoice yang sudah dicentang belum tersimpan dan akan hilang."
          confirmLabel="Tinggalkan"
          cancelLabel="Tetap di Sini"
          onCancel={guard.stay}
          onConfirm={guard.proceed}
        />
      )}
    </div>
  )
}
