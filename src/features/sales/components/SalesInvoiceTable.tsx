import { Card, FilterBar, MiniStat, Select, Status, TableWrap } from '@/components/common'
import { formatCurrency, formatCurrencyOrDash, formatKg } from '@/lib'
import { paymentStatusTone, type SalesInvoice } from '@/types'

type Props = {
  invoices: SalesInvoice[]
  summary: {
    monthlySales: number
    received: number
    openReceivable: number
    overdueInvoices: string
  }
}

export function SalesInvoiceTable({ invoices, summary }: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Penjualan September" value={summary.monthlySales} />
        <MiniStat label="DP & Pembayaran Diterima" value={summary.received} tone="green" />
        <MiniStat label="Piutang Terbuka" value={summary.openReceivable} tone="amber" />
        <MiniStat label="Invoice Jatuh Tempo" value={summary.overdueInvoices} tone="red" />
      </div>

      <Card>
        <FilterBar>
          <Select>
            <option>September 2026</option>
          </Select>
          <Select>
            <option>Semua Customer</option>
          </Select>
          <Select>
            <option>Semua Status</option>
          </Select>
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Tanggal</th>
              <th>Customer</th>
              <th>Produk</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Total</th>
              <th className="text-right">DP/Deposit</th>
              <th className="text-right">Sisa</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.number}>
                <td className="font-semibold text-blue-700">{invoice.number}</td>
                <td>{invoice.date}</td>
                <td className="font-semibold">{invoice.customer}</td>
                <td>{invoice.product}</td>
                <td className="money">{formatKg(invoice.quantityKg)}</td>
                <td className="money">{formatCurrency(invoice.total)}</td>
                <td className="money">{formatCurrencyOrDash(invoice.paid)}</td>
                <td className="money">{formatCurrency(invoice.total - invoice.paid)}</td>
                <td>
                  <Status tone={paymentStatusTone[invoice.status]}>{invoice.status}</Status>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  )
}
