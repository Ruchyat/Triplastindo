import { useState } from 'react'
import { Card, CardHeader, Combobox, TableWrap } from '@/components/common'
import { StockTrendChart } from '@/components/charts/StockTrendChart'
import { monthNames } from '@/features/reports/useReportPeriod'
import { formatCurrency, formatCurrencyOrDash, formatNumber, toAmount } from '@/lib'
import type { ApiInventoryProduct } from '@/types'

/** Tiga tabel per produk seperti di sheet: penjualan, persediaan (Kg), nilai persediaan. */
export function ProductSummary({ products }: { products: ApiInventoryProduct[] }) {
  const [productId, setProductId] = useState(String(products[0]?.product_id ?? ''))
  const product = products.find(p => String(p.product_id) === productId) ?? products[0]

  if (!product) return <p className="text-xs text-slate-500">Belum ada produk.</p>

  const kg = (v: string) => formatNumber(toAmount(v))

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Combobox
          className="sm:w-80"
          clearable={false}
          options={products.map(p => ({ value: String(p.product_id), label: p.name, description: `${p.code} · ${p.category_label}` }))}
          value={String(product.product_id)}
          onChange={setProductId}
        />
        <p className="text-xs text-slate-500">
          Saldo awal tahun {kg(product.opening_qty)} {product.unit} · harga rata-rata {formatCurrency(toAmount(product.average_cost))}/{product.unit}
          {product.inventory_account && ` · ${product.inventory_account}`}
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title={`Persediaan ${product.name} per Bulan`} description={`Dalam ${product.unit}; sisa = saldo awal + masuk − keluar`} />
          <TableWrap>
            <thead>
              <tr>
                <th>Bulan</th>
                <th className="text-right">Qty In</th>
                <th className="text-right">Qty Out</th>
                <th className="text-right">Qty Sisa</th>
                <th className="text-right">Nilai Persediaan</th>
                <th className="text-right">Terjual (Kg)</th>
                <th className="text-right">Penjualan (Rp)</th>
                <th className="text-right">Omset − HPP</th>
              </tr>
            </thead>
            <tbody>
              {product.months.map(m => (
                <tr key={m.month}>
                  <td className="font-semibold">{monthNames[m.month - 1]}</td>
                  <td className="money">{kg(m.qty_in)}</td>
                  <td className="money">{kg(m.qty_out)}</td>
                  <td className="money !text-blue-700">{kg(m.qty_balance)}</td>
                  <td className="money">{formatCurrencyOrDash(toAmount(m.inventory_value))}</td>
                  <td className="money">{kg(m.sold_qty)}</td>
                  <td className="money">{formatCurrencyOrDash(toAmount(m.sales_amount))}</td>
                  <td className="money">{formatCurrencyOrDash(toAmount(m.sales_amount) - toAmount(m.cost_of_sold))}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td>TOTAL</td>
                <td className="money">{kg(product.totals.qty_in)}</td>
                <td className="money">{kg(product.totals.qty_out)}</td>
                <td className="money !text-blue-700">{kg(product.totals.qty_balance)}</td>
                <td className="money">{formatCurrency(toAmount(product.totals.inventory_value))}</td>
                <td className="money">{kg(product.totals.sold_qty)}</td>
                <td className="money">{formatCurrency(toAmount(product.totals.sales_amount))}</td>
                <td className="money">{formatCurrency(product.months.reduce((s, m) => s + toAmount(m.sales_amount) - toAmount(m.cost_of_sold), 0))}</td>
              </tr>
            </tbody>
          </TableWrap>
        </Card>

        <Card className="p-5">
          <CardHeader title="Tren Stok" description="Qty masuk dan sisa per bulan (Kg)" />
          <div className="mt-4 h-72">
            <StockTrendChart data={product.months.map(m => ({ month: monthNames[m.month - 1].slice(0, 3), qtyInKg: toAmount(m.qty_in), remainingKg: toAmount(m.qty_balance) }))} />
          </div>
        </Card>
      </div>
    </div>
  )
}
