import { Plus } from 'lucide-react'
import {
  Card,
  FilterBar,
  MiniStat,
  PageHeader,
  Select,
  Status,
  TableWrap,
} from '@/components/common'
import { TransactionDrawer } from '@/components/financial'
import { Button } from '@/components/ui/Button'
import { useDisclosure } from '@/hooks/useDisclosure'
import { formatCurrency } from '@/lib'
import { expenseSummary, expenseVouchers } from '@/mocks/expenses'

/**
 * Halaman Pengeluaran.
 *
 * Untuk biaya yang tidak melalui proses pembelian barang — listrik,
 * transportasi, maintenance, sewa, dan sejenisnya.
 */
export function ExpensesPage() {
  const drawer = useDisclosure()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pengeluaran"
        title="Pengeluaran Biaya"
        description="Catat biaya operasional yang dibayar langsung"
        actions={
          <Button onClick={drawer.open}>
            <Plus size={16} />
            Catat Pengeluaran
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Pengeluaran September" value={expenseSummary.monthlyExpense} />
        <MiniStat label="Beban Produksi" value={expenseSummary.productionExpense} tone="amber" />
        <MiniStat label="Beban Operasional" value={expenseSummary.operationalExpense} />
      </div>

      <Card>
        <FilterBar>
          <Select>
            <option>September 2026</option>
          </Select>
          <Select>
            <option>Semua Kategori</option>
          </Select>
          <Select>
            <option>Semua Akun Pembayaran</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>No. Bukti</th>
              <th>Tanggal</th>
              <th>Kategori Biaya</th>
              <th>Penerima</th>
              <th className="text-right">Nominal</th>
              <th>Akun Pembayaran</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {expenseVouchers.map(voucher => (
              <tr key={voucher.number}>
                <td className="font-semibold text-blue-700">{voucher.number}</td>
                <td>{voucher.date}</td>
                <td className="font-semibold">{voucher.category}</td>
                <td>{voucher.payee}</td>
                <td className="money">{formatCurrency(voucher.amount)}</td>
                <td>{voucher.paymentAccount}</td>
                <td>
                  <Status tone="green">{voucher.status}</Status>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {drawer.isOpen && <TransactionDrawer type="expense" onClose={drawer.close} />}
    </div>
  )
}
