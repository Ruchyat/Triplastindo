import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { VoucherDetail } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, toAmount } from '@/lib'
import { expenseService } from '@/services/expenseService'
import { ApiError } from '@/services/httpClient'

/** Halaman satu bukti pengeluaran. */
export function ExpensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const expenseId = Number(id)

  const load = useCallback(() => expenseService.show(expenseId), [expenseId])
  const { data: expense, error, reload } = useAsync(load)

  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function cancel() {
    setIsWorking(true)
    setActionError(null)
    try {
      await expenseService.cancel(expenseId)
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
        eyebrow="Transaksi / Pengeluaran"
        title={expense?.number ?? 'Memuat...'}
        description={expense ? `${formatDate(expense.date)} · ${expense.description}` : undefined}
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.expenses)}>
            <ArrowLeft size={16} />
            Daftar Pengeluaran
          </Button>
        }
      />

      {error && <InfoNote tone="red">{error}</InfoNote>}

      {expense && (
        <VoucherDetail
          number={expense.number}
          status={expense.status}
          statusLabel={expense.status_label}
          amount={toAmount(expense.amount)}
          facts={[
            { label: 'Akun Beban', value: expense.expense_account?.label },
            { label: 'Dibayar dari', value: expense.cash_account?.label },
            { label: 'Penerima', value: expense.payee ?? '–' },
            { label: 'No. Referensi', value: expense.reference ?? '–' },
            { label: 'Dibuat oleh', value: expense.created_by?.name ?? '–' },
            { label: 'Catatan', value: expense.note ?? '–' },
          ]}
          journalEntry={expense.journal_entry}
          noun="pengeluaran"
          cancelConsequence={
            <p>
              Jurnal {expense.journal_entry?.number} akan dibalik: beban{' '}
              {expense.expense_account?.name} berkurang dan saldo {expense.cash_account?.name}{' '}
              kembali seperti semula.
            </p>
          }
          cancelledNote="Pengeluaran ini sudah dibatalkan. Jurnalnya dibalik oleh jurnal tersendiri."
          isWorking={isWorking}
          actionError={actionError}
          onCancel={cancel}
        />
      )}
    </div>
  )
}
