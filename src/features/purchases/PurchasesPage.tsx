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
import { purchaseBills, purchaseSummary } from '@/mocks/purchases'
import { paymentStatusTone } from '@/types'

/**
 * Halaman Pembelian.
 *
 * Satu menu menampung seluruh kategori pembelian — bahan baku, sparepart,
 * bahan pendukung, dan aset. Tagihan kredit langsung membentuk utang.
 */
export function PurchasesPage() {
  const drawer = useDisclosure()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pembelian"
        title="Pembelian"
        description="Catat tagihan bahan baku, sparepart, bahan pendukung, dan aset"
        actions={
          <Button onClick={drawer.open}>
            <Plus size={16} />
            Buat Pembelian
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Pembelian September" value={purchaseSummary.monthlyPurchases} />
        <MiniStat label="Sudah Dibayar" value={purchaseSummary.paid} tone="green" />
        <MiniStat label="Utang Terbuka" value={purchaseSummary.openPayable} tone="amber" />
        <MiniStat label="Tagihan Jatuh Tempo" value={purchaseSummary.overdueBills} tone="red" />
      </div>

      <Card>
        <FilterBar>
          <Select>
            <option>Semua Kategori</option>
          </Select>
          <Select>
            <option>Semua Supplier</option>
          </Select>
          <Select>
            <option>Semua Status</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>No. Pembelian</th>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th>Kategori</th>
              <th>Item</th>
              <th className="text-right">Total</th>
              <th className="text-right">Dibayar</th>
              <th className="text-right">Sisa</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {purchaseBills.map(bill => (
              <tr key={bill.number}>
                <td className="font-semibold text-blue-700">{bill.number}</td>
                <td>{bill.date}</td>
                <td className="font-semibold">{bill.supplier}</td>
                <td>
                  <Status tone="blue">{bill.category}</Status>
                </td>
                <td>{bill.item}</td>
                <td className="money">{formatCurrency(bill.total)}</td>
                <td className="money">{formatCurrency(bill.paid)}</td>
                <td className="money">{formatCurrency(bill.total - bill.paid)}</td>
                <td>
                  <Status tone={paymentStatusTone[bill.status]}>{bill.status}</Status>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {drawer.isOpen && <TransactionDrawer type="purchase" onClose={drawer.close} />}
    </div>
  )
}
