import { useCallback, useState } from 'react'
import { Combobox, Field, Input, NumberInput } from '@/components/common'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount, today } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { assetService } from '@/services/assetService'
import { masterDataService } from '@/services/masterDataService'
import type { ApiFixedAsset } from '@/types'

type Props = { asset: ApiFixedAsset; onClose: () => void; onDone: () => void }

/** Pelepasan aset: nilai buku keluar dari neraca, selisih dengan hasil jualnya menjadi rugi/laba. */
export function DisposeDialog({ asset, onClose, onDone }: Props) {
  const [date, setDate] = useState(today())
  const [proceeds, setProceeds] = useState('')
  const [cashAccountId, setCashAccountId] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCash = useCallback(() => masterDataService.accounts({ isCash: true }), [])
  const cashAccounts = useAsync(loadCash).data ?? []

  const bookValue = toAmount(asset.book_value)
  const difference = toAmount(proceeds) - bookValue

  async function dispose() {
    setIsWorking(true)
    setError(null)
    try {
      await assetService.dispose(asset.id, { date, proceeds: proceeds || '0', cash_account_id: cashAccountId ? Number(cashAccountId) : null })
      onDone()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Pelepasan gagal.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <ConfirmDialog
      title={`Lepas aset ${asset.code}?`}
      description={
        <div className="space-y-3">
          <p>
            Nilai buku saat ini <b>{formatCurrency(bookValue)}</b>. Perolehan dan akumulasi penyusutannya dikeluarkan dari neraca;{' '}
            {difference < 0 ? `rugi pelepasan ${formatCurrency(-difference)}` : difference > 0 ? `laba pelepasan ${formatCurrency(difference)}` : 'tanpa rugi/laba'}.
          </p>
          <Field label="Tanggal Pelepasan" required>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Hasil Penjualan (bila ada)">
            <NumberInput prefix="Rp" placeholder="0" value={proceeds} onChange={setProceeds} />
          </Field>
          {toAmount(proceeds) > 0 && (
            <Field label="Diterima di Akun" required>
              <Combobox placeholder="Pilih akun kas/bank..." options={cashAccounts.map(a => ({ value: String(a.id), label: a.label }))} value={cashAccountId} onChange={setCashAccountId} />
            </Field>
          )}
        </div>
      }
      confirmLabel="Lepas Aset"
      tone="danger"
      isWorking={isWorking}
      error={error}
      onCancel={onClose}
      onConfirm={() => void dispose()}
    />
  )
}
