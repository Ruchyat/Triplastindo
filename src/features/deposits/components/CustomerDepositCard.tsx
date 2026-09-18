import { useState } from 'react'
import { Link } from 'react-router-dom'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, SectionHeader, Status } from '@/components/common'
import { Card } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn, formatCurrency, formatDate, toAmount } from '@/lib'
import type { ApiCustomerDeposit, ApiDepositMovement, Tone } from '@/types'
import { useCustomerDepositCard, type DepositCardRow } from '../useCustomerDepositCard'

type Props = {
  customerId: number
  onChanged: () => void
  /** Membuka form deposit dengan customer ini sudah terpilih. */
  onCreate: (movement: 'received' | 'refunded') => void
  customerName: string
}

const movementTone: Record<ApiDepositMovement, Tone> = {
  received: 'green',
  applied: 'blue',
  refunded: 'amber',
}

/**
 * Kartu deposit satu customer: saldo, riwayat, dan saldo berjalannya.
 *
 * Halaman penuh dengan alamat sendiri, sehingga kartu seorang customer dapat
 * ditautkan langsung.
 */
export function CustomerDepositCard({ customerId, customerName, onChanged, onCreate }: Props) {
  const card = useCustomerDepositCard(customerId, onChanged)
  const [confirming, setConfirming] = useState<ApiCustomerDeposit | null>(null)

  return (
    <div className="max-w-3xl space-y-5">
      {card.error && <InfoNote tone="red">{card.error}</InfoNote>}
      {card.actionError && <InfoNote tone="red">{card.actionError}</InfoNote>}

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-[11px] text-slate-500">Saldo Deposit Tersedia</p>
          <b className="text-2xl tracking-tight text-slate-900">{formatCurrency(card.balance)}</b>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onCreate('refunded')}>
            Kembalikan
          </Button>
          <Button onClick={() => onCreate('received')}>Terima Deposit</Button>
        </div>
      </Card>

      <SectionHeader title="Riwayat Mutasi" />

      {card.rows.length === 0 && !card.isLoading ? (
        <p className="rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
          Belum ada mutasi deposit untuk customer ini.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {card.rows.map(row => (
            <MovementRow
              key={row.movement.id}
              row={row}
              isWorking={card.isWorking}
              onCancel={() => setConfirming(row.movement)}
            />
          ))}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Batalkan ${confirming.number}?`}
          description={
            <>
              <p>
                Jurnal {confirming.journal_entry?.number} akan dibalik, dan saldo deposit{' '}
                {customerName}{' '}
                {confirming.movement === 'received' ? 'berkurang' : 'bertambah'}{' '}
                <b>{formatCurrency(toAmount(confirming.amount))}</b>.
              </p>
              <p className="mt-2">Pembatalan tidak dapat diurungkan.</p>
            </>
          }
          confirmLabel="Batalkan Mutasi"
          cancelLabel="Jangan Batalkan"
          isWorking={card.isWorking}
          error={card.actionError}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (await card.cancel(confirming.id)) setConfirming(null)
          }}
        />
      )}
    </div>
  )
}

type RowProps = {
  row: DepositCardRow
  isWorking: boolean
  onCancel: () => void
}

function MovementRow({ row, isWorking, onCancel }: RowProps) {
  const { movement, balance } = row
  const isCancelled = movement.status === 'cancelled'
  const isIncoming = toAmount(movement.received) > 0

  // Pemakaian deposit lahir dari invoicenya dan tidak punya jurnal sendiri;
  // membatalkannya dilakukan dengan membatalkan invoice itu.
  const canCancel = movement.movement !== 'applied' && !isCancelled

  return (
    <div className="border-b border-slate-100 p-3 text-xs last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={cn(
              'font-semibold',
              isCancelled ? 'text-slate-400 line-through' : 'text-slate-800',
            )}
          >
            {movement.number}
          </span>
          <span className="ml-2 align-middle">
            <Status tone={isCancelled ? 'slate' : movementTone[movement.movement]}>
              {isCancelled ? 'Dibatalkan' : movement.movement_label}
            </Status>
          </span>
          <span className="mt-1 block text-[10px] text-slate-500">
            {formatDate(movement.date)}
            {movement.cash_account && ` · ${movement.cash_account.name}`}
            {movement.reference && ` · ${movement.reference}`}
          </span>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={cn(
              'block font-semibold tabular-nums',
              isCancelled ? 'text-slate-400 line-through' : isIncoming ? 'text-emerald-700' : 'text-amber-700',
            )}
          >
            {isIncoming ? '+' : '−'}
            {formatCurrency(toAmount(isIncoming ? movement.received : movement.applied_or_refunded))}
          </span>
          {!isCancelled && (
            <span className="block text-[10px] text-slate-500">
              saldo {formatCurrency(balance)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
        {movement.invoice && (
          <Link
            to={toPath.salesInvoice(movement.invoice.id)}
            className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2"
          >
            {movement.invoice.number}
          </Link>
        )}

        {movement.journal_entry && (
          <Link
            to={`${routePaths.journals}?search=${encodeURIComponent(movement.journal_entry.number)}&month=${movement.journal_entry.date.slice(0, 7)}`}
            className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2"
          >
            {movement.journal_entry.number}
          </Link>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="ml-auto font-bold text-rose-600 hover:underline disabled:opacity-40"
          >
            Batalkan
          </button>
        )}
      </div>
    </div>
  )
}
