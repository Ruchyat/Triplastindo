import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '@/lib'
import type { InventoryMonth } from '@/types'

/** Tren kuantitas masuk dan saldo persediaan per bulan, dalam kilogram. */
export function StockTrendChart({ data }: { data: InventoryMonth[] }) {
  const series = data.map(month => ({
    month: month.month,
    masuk: month.qtyInKg,
    sisa: month.remainingKg,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 5, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }}
          formatter={value => `${formatNumber(Number(value))} Kg`}
        />
        <Area type="monotone" dataKey="masuk" name="Qty Masuk" stroke="#2563eb" fill="#dbeafe" />
        <Area type="monotone" dataKey="sisa" name="Qty Sisa" stroke="#059669" fill="#d1fae5" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
