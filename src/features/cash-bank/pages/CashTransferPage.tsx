import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { VoucherDetail } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, toAmount } from '@/lib'
import { cashBankService } from '@/services/cashBankService'
import { ApiError } from '@/services/httpClient'

/** Halaman satu transfer antar akun. */
export function CashTransferPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const transferId = Number(id)

  const load = useCallback(() => cashBankService.transfer(transferId), [transferId])
  const { data: transfer, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function cancel() {
    setIsWorking(true)
    setActionError(null)
    try {
      await cashBankService.cancelTransfer(transferId)
      reload()
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Pembatalan gagal dijalankan.')
      throw failure
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Kas & Bank"
        title={transfer?.number ?? 'Memuat...'}
        description={
          transfer
            ? `${formatDate(transfer.date)} · ${transfer.from_account?.name} → ${transfer.to_account?.name}`
            : undefined
        }
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.cashBank)}>
            <ArrowLeft size={16} />
            Kas &amp; Bank
          </Button>
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      {transfer && (
        <VoucherDetail
          number={transfer.number}
          status={transfer.status}
          statusLabel={transfer.status_label}
          amount={toAmount(transfer.amount)}
          facts={[
            { label: 'Dari Akun', value: transfer.from_account?.label },
            { label: 'Ke Akun', value: transfer.to_account?.label },
            { label: 'No. Referensi', value: transfer.reference ?? '–' },
            { label: 'Dibuat oleh', value: transfer.created_by?.name ?? '–' },
            { label: 'Keterangan', value: transfer.note ?? '–' },
          ]}
          journalEntry={transfer.journal_entry}
          noun="transfer"
          cancelConsequence={
            <p>
              Jurnal {transfer.journal_entry?.number} akan dibalik: saldo{' '}
              {transfer.from_account?.name} dan {transfer.to_account?.name} kembali seperti sebelum
              transfer.
            </p>
          }
          cancelledNote="Transfer ini sudah dibatalkan. Jurnalnya dibalik oleh jurnal tersendiri."
          isWorking={isWorking}
          actionError={actionError}
          onCancel={cancel}
        />
      )}
    </div>
  )
}
