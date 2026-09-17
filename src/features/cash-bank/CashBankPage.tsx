import { ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react'
import {
  Card,
  CardHeader,
  FilterBar,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableWrap,
} from '@/components/common'
import { TransactionDrawer } from '@/components/financial'
import { useDrawer } from '@/hooks/useDisclosure'
import { formatCurrencyOrDash } from '@/lib'
import { cashBankBalances, cashBankMovements } from '@/mocks/cash-bank'
import type { CashBankMovement, DocumentType, Tone } from '@/types'
import { ActionCard } from './components/ActionCard'

/**
 * Halaman Kas & Bank.
 *
 * Pusat penerimaan piutang, pembayaran utang, dan transfer antar akun.
 * Setiap pembayaran ditautkan ke invoice atau tagihan asalnya.
 */
export function CashBankPage() {
  const drawer = useDrawer<DocumentType>()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Kas & Bank"
        title="Kas & Bank"
        description="Pusat penerimaan, pembayaran, transfer, dan saldo rekening"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <ActionCard
          icon={<ArrowDownLeft size={20} />}
          title="Terima Pembayaran"
          description="Catat pelunasan invoice dan kurangi piutang"
          tone="green"
          onClick={() => drawer.open('receipt')}
        />
        <ActionCard
          icon={<ArrowUpRight size={20} />}
          title="Bayar Tagihan"
          description="Bayar tagihan supplier dan kurangi utang"
          tone="amber"
          onClick={() => drawer.open('payment')}
        />
        <ActionCard
          icon={<Landmark size={20} />}
          title="Transfer Antar Akun"
          description="Pindahkan dana bank atau petty cash"
          onClick={() => drawer.open('transfer')}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Bank BCA" value={cashBankBalances.bcaBalance} />
        <MiniStat label="Bank BNI" value={cashBankBalances.bniBalance} />
        <MiniStat label="Petty Cash" value={cashBankBalances.pettyCashBalance} />
        <MiniStat label="Total Kas & Bank" value={cashBankBalances.totalBalance} tone="green" />
      </div>

      <Card>
        <CardHeader title="Mutasi Kas & Bank" description="Transaksi terbaru dari seluruh akun" />
        <FilterBar>
          <Select>
            <option>Semua Akun</option>
          </Select>
          <Select>
            <option>Semua Jenis</option>
          </Select>
          <Select>
            <option>September 2026</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Akun</th>
              <th>Jenis</th>
              <th>Lawan Transaksi</th>
              <th>Referensi</th>
              <th className="text-right">Masuk</th>
              <th className="text-right">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {cashBankMovements.map((movement, index) => (
              <tr key={`${movement.reference}-${index}`}>
                <td>{movement.date}</td>
                <td className="font-semibold">{movement.account}</td>
                <td>
                  <Status tone={movementTone(movement)}>{movement.type}</Status>
                </td>
                <td>{movement.counterparty}</td>
                <td className="font-semibold text-blue-700">{movement.reference}</td>
                <td className="money !text-emerald-700">
                  {formatCurrencyOrDash(movement.amount > 0 ? movement.amount : 0)}
                </td>
                <td className="money !text-rose-700">
                  {formatCurrencyOrDash(movement.amount < 0 ? Math.abs(movement.amount) : 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {drawer.active && <TransactionDrawer type={drawer.active} onClose={drawer.close} />}
    </div>
  )
}

/** Transfer masuk diberi nada hijau agar arah dananya langsung terbaca. */
function movementTone(movement: CashBankMovement): Tone {
  if (movement.type === 'Penerimaan') return 'green'
  if (movement.type === 'Transfer') return movement.amount > 0 ? 'green' : 'blue'
  return 'amber'
}
