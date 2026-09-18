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
import { DepositForm } from '../components'

const copy = {
  received: {
    title: 'Terima Deposit Pelanggan',
    description: 'Uang titipan dicatat sebagai kewajiban, bukan pendapatan',
  },
  refunded: {
    title: 'Kembalikan Deposit Pelanggan',
    description: 'Saldo deposit berkurang, dan uangnya keluar dari kas atau bank',
  },
} as const

/**
 * Halaman pencatatan mutasi deposit.
 *
 * `?movement=` menentukan penerimaan atau pengembalian, `?customer=` mengisi
 * customernya di muka — dipakai tombol pada kartu deposit.
 */
export function NewDepositPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [isDirty, setIsDirty] = useState(false)
  const guard = useUnsavedChanges(isDirty)

  const movement = params.get('movement') === 'refunded' ? 'refunded' : 'received'
  const customerId = Number(params.get('customer')) || undefined
  const text = copy[movement]

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
        eyebrow="Keuangan / Deposit Pelanggan"
        title={text.title}
        description={text.description}
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.customerDeposits)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {master.error && <InfoNote tone="red">{master.error}</InfoNote>}

      {!master.isLoading && (
        <DepositForm
          movement={movement}
          customers={customers}
          accounts={accounts}
          initialCustomerId={customerId}
          onCancel={() => navigate(-1)}
          onDirtyChange={setIsDirty}
          onSaved={saved => {
            guard.release()
            navigate(toPath.depositCard(saved), { replace: true })
          }}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan halaman ini?"
          description="Isian yang sudah diketik belum tersimpan dan akan hilang."
          confirmLabel="Tinggalkan"
          cancelLabel="Tetap di Sini"
          onCancel={guard.stay}
          onConfirm={guard.proceed}
        />
      )}
    </div>
  )
}
