import { Card, Field, Input, MiniStat } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { hppPerKg, productionStats } from '@/mocks/reports'

/**
 * Sub-laporan HPP per Kg.
 *
 * Biaya produksi dibagi dengan total produksi biji untuk mendapatkan harga
 * pokok per kilogram, lalu dibandingkan terhadap harga jual.
 */
export function HppPerKgPanel() {
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <ProductionDataForm />
      <HppAnalysis />
    </div>
  )
}

function ProductionDataForm() {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-slate-900">Data Produksi</h2>
      <p className="mt-1 text-xs text-slate-500">Input operasional September 2026</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Belanja Bahan Baku (Kg)">
          <Input placeholder={productionStats.materialPurchaseKg} />
        </Field>
        <Field label="Belanja Bahan Baku (Rp)">
          <Input placeholder={productionStats.materialPurchaseAmount} />
        </Field>
        <Field label="Produksi Biji (Kg)">
          <Input placeholder={productionStats.pelletProductionKg} />
        </Field>
        <Field label="Produksi Tali (Kg)">
          <Input placeholder={productionStats.ropeProductionKg} />
        </Field>
        <Field label="Harga Jual per Kg" className="sm:col-span-2">
          <Input placeholder={productionStats.sellingPricePerKg} />
        </Field>
      </div>

      <Button className="mt-5 w-full">Simpan Data Produksi</Button>
    </Card>
  )
}

function HppAnalysis() {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-slate-900">Analisis HPP per Kg</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Avg Harga Beli / Kg" value={hppPerKg.averagePurchasePerKg} />
        <MiniStat label="HPP Komponen / Kg" value={hppPerKg.componentPerKg} />
        <MiniStat label="Biaya Operasional / Kg" value={hppPerKg.operationalPerKg} />
        <MiniStat label="Total HPP / Kg" value={hppPerKg.totalPerKg} tone="amber" />
      </div>

      <div className="mt-5 rounded-xl bg-blue-700 p-5 text-white">
        <p className="text-xs text-blue-100">Rasio HPP terhadap Harga Jual</p>
        <div className="mt-2 flex items-end justify-between">
          <b className="text-3xl">{hppPerKg.ratioLabel}</b>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {hppPerKg.marginLabel}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${hppPerKg.ratioValue}%` }}
          />
        </div>
      </div>
    </Card>
  )
}
