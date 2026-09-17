/** Kop laporan keuangan yang ikut tercetak pada layout A4. */
export function ReportTitle({ title, period }: { title: string; period: string }) {
  return (
    <div className="border-b-2 border-slate-800 py-5 text-center">
      <p className="text-base font-black tracking-[.16em] text-slate-950">TRIPLASTINDO</p>
      <h2 className="mt-2 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">
        Periode yang berakhir pada {period} · Dalam IDR
      </p>
    </div>
  )
}
