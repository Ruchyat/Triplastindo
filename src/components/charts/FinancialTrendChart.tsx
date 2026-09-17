import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { monthlyTrend } from '@/mocks/dashboard'

export type TrendMode = 'revenue' | 'profit'

/** Tren pendapatan, pengeluaran, dan laba bersih sepanjang tahun (dalam juta Rupiah). */
export function FinancialTrendChart({ mode }: { mode: TrendMode }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={monthlyTrend} margin={{ top: 5, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trendBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trendAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.14} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf3" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#64748b' }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={value => `${value / 1000}M`}
        />
        <Tooltip
          cursor={{ stroke: '#cbd5e1' }}
          contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }}
          formatter={value => `Rp ${Number(value).toLocaleString('id-ID')} jt`}
        />

        {mode === 'revenue' && (
          <>
            <Area
              type="monotone"
              dataKey="revenue"
              name="Pendapatan"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#trendBlue)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Pengeluaran"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#trendAmber)"
            />
          </>
        )}

        {mode === 'profit' && (
          <Area
            type="monotone"
            dataKey="profit"
            name="Laba Bersih"
            stroke="#059669"
            strokeWidth={2.5}
            fill="#d1fae5"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
