import { Status } from '@/components/common'
import { formatCurrency } from '@/lib'

/**
 * Indikator keseimbangan debit dan kredit.
 *
 * Jurnal yang tidak balance tidak boleh tersimpan, sehingga indikator ini
 * selalu ditampilkan pada form jurnal dan Laporan Neraca.
 */
export function BalanceIndicator({ difference }: { difference: number }) {
  const balanced = difference === 0
  return (
    <Status tone={balanced ? 'green' : 'red'}>
      {balanced ? 'Balance' : `Selisih ${formatCurrency(Math.abs(difference))}`}
    </Status>
  )
}
