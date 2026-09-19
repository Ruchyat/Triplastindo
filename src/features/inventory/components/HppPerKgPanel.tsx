import { Card, CardHeader, InfoNote, MiniStat } from '@/components/common'
import { formatCurrency, formatKg, formatPercent, toAmount } from '@/lib'
import type { ApiHppPerKg } from '@/types'

/**
 * HPP per Kg tahun berjalan: HPP Produksi (Laba Rugi) dibagi Kg hasil
 * produksi, disandingkan dengan harga jual rata-rata per Kg.
 */
export function HppPerKgPanel({ hpp, year }: { hpp: ApiHppPerKg; year: number }) {
  const money = (v: string | null) => (v === null ? '–' : formatCurrency(toAmount(v)))
  const hppValue = toAmount(hpp.hpp_per_kg)
  const price = toAmount(hpp.selling_price_per_kg)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={`Produksi ${year}`} value={formatKg(toAmount(hpp.produced_kg))} />
        <MiniStat label="Terjual" value={formatKg(toAmount(hpp.sold_kg))} />
        <MiniStat label="Pembelian Bahan" value={formatKg(toAmount(hpp.purchased_kg))} hint={money(hpp.purchased_amount)} />
        <MiniStat label="Harga Beli Rata-rata / Kg" value={money(hpp.average_purchase_per_kg)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Komponen HPP per Kg" description="Dari Laba Rugi tahun berjalan dibagi Kg hasil produksi" />
          <div className="divide-y divide-slate-100 px-5 text-xs">
            <Row label="Bahan baku per Kg" value={money(hpp.material_per_kg)} />
            <Row label="HPP produksi per Kg (bahan + tenaga kerja + overhead)" value={money(hpp.hpp_per_kg)} strong />
            <Row label="Beban operasional per Kg terjual" value={money(hpp.operational_per_kg)} />
            <Row label="Harga jual rata-rata per Kg" value={money(hpp.selling_price_per_kg)} strong />
            <Row label="Margin kotor per Kg" value={money(hpp.margin_per_kg)} tone={toAmount(hpp.margin_per_kg) < 0 ? 'text-rose-700' : 'text-emerald-700'} strong />
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Rasio HPP terhadap Harga Jual" description="Semakin rendah semakin baik" />
          {hpp.hpp_ratio === null ? (
            <InfoNote>Belum ada produksi atau penjualan tahun ini.</InfoNote>
          ) : (
            <div className="mt-4 flex items-center gap-6">
              <div
                className="grid size-32 place-items-center rounded-full"
                style={{ background: `conic-gradient(${hpp.hpp_ratio > 0.9 ? '#e11d48' : '#2563eb'} ${Math.min(hpp.hpp_ratio, 1) * 100}%, #e8edf3 0)` }}
              >
                <div className="grid size-24 place-items-center rounded-full bg-white text-center">
                  <p className="text-xl font-bold text-slate-900">{formatPercent(hpp.hpp_ratio)}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p>HPP {formatCurrency(hppValue)} dari harga jual {formatCurrency(price)} per Kg.</p>
                <p>Margin <b className={toAmount(hpp.margin_per_kg) < 0 ? 'text-rose-700' : 'text-emerald-700'}>{money(hpp.margin_per_kg)}</b> per Kg sebelum beban operasional.</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <InfoNote>
        Kg hasil produksi berasal dari mutasi "Hasil Produksi" yang diinput di tab Kartu Stok. Tanpa input itu, HPP per Kg tidak dapat dihitung.
      </InfoNote>
    </div>
  )
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex justify-between py-3">
      <span className={strong ? 'font-semibold text-slate-800' : 'text-slate-600'}>{label}</span>
      <b className={`tabular-nums ${tone ?? 'text-slate-900'}`}>{value}</b>
    </div>
  )
}
