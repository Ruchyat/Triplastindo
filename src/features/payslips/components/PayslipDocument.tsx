import { formatCurrency } from '@/lib'

export type PayslipComponent = { label: string; amount: number }

export type Payslip = {
  employeeId: string
  name: string
  department: string
  period: string
  paymentDate: string
  earnings: PayslipComponent[]
  deductions: PayslipComponent[]
  /** Pinjaman kasbon yang dicairkan bersama gaji; menambah THP, bukan pendapatan. */
  loanAdvance: number
}

type Company = { name: string; address: string; email?: string }

/** Slip gaji dalam layout A4 yang siap dicetak. */
export function PayslipDocument({ payslip, company }: { payslip: Payslip; company: Company }) {
  const totalEarnings = sum(payslip.earnings)
  const totalDeductions = sum(payslip.deductions)
  const takeHomePay = totalEarnings - totalDeductions + payslip.loanAdvance

  const identity = [
    { label: 'Nama', value: payslip.name },
    { label: 'NIK', value: payslip.employeeId },
    { label: 'Departemen', value: payslip.department },
    { label: 'Tanggal', value: payslip.paymentDate },
  ]

  return (
    <div className="mx-auto max-w-[800px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-10">
      <header className="flex justify-between border-b-2 border-slate-800 pb-6">
        <div>
          <div className="text-xl font-black tracking-[.16em]">{company.name}</div>
          <p className="mt-2 max-w-sm text-[10px] leading-4 text-slate-500">
            {company.address}
            {company.email && <span className="block">{company.email}</span>}
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">SLIP GAJI</h2>
          <p className="mt-1 text-xs text-slate-500">{payslip.period}</p>
        </div>
      </header>

      <div className="grid gap-3 border-b border-slate-200 py-5 text-xs sm:grid-cols-2">
        {identity.map(item => (
          <div key={item.label}>
            <span className="inline-block w-28 text-slate-400">{item.label}</span>
            <b>{item.value}</b>
          </div>
        ))}
      </div>

      <div className="grid gap-8 py-6 sm:grid-cols-2">
        <ComponentList
          title="PENDAPATAN"
          titleClass="text-emerald-700"
          components={payslip.earnings}
        />
        <ComponentList
          title="POTONGAN"
          titleClass="text-rose-700"
          components={payslip.deductions}
        />
      </div>

      <div className="grid gap-3 border-t-2 border-slate-800 pt-5 sm:grid-cols-3">
        <TotalBlock label="TOTAL PENDAPATAN" value={formatCurrency(totalEarnings)} />
        <TotalBlock
          label={payslip.loanAdvance > 0 ? 'TOTAL POTONGAN · KASBON CAIR' : 'TOTAL POTONGAN'}
          value={payslip.loanAdvance > 0 ? `${formatCurrency(totalDeductions)} · +${formatCurrency(payslip.loanAdvance)}` : formatCurrency(totalDeductions)}
        />
        <div className="rounded-lg bg-blue-700 p-3 text-white">
          <p className="text-[10px] text-blue-100">TAKE HOME PAY</p>
          <b className="mt-1 block text-lg">{formatCurrency(takeHomePay)}</b>
        </div>
      </div>

      <p className="mt-8 text-center text-[10px] text-slate-400">
        Dokumen ini dibuat secara elektronik dan tidak memerlukan tanda tangan.
      </p>
    </div>
  )
}

function ComponentList({
  title,
  titleClass,
  components,
}: {
  title: string
  titleClass: string
  components: PayslipComponent[]
}) {
  return (
    <div>
      <h3 className={`border-b border-slate-200 pb-2 text-xs font-black ${titleClass}`}>{title}</h3>
      {components.map(component => (
        <div key={component.label} className="flex justify-between py-2 text-xs">
          <span>{component.label}</span>
          <b>{formatCurrency(component.amount)}</b>
        </div>
      ))}
    </div>
  )
}

function TotalBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400">{label}</p>
      <b className="mt-1 block">{value}</b>
    </div>
  )
}

const sum = (components: PayslipComponent[]) =>
  components.reduce((total, component) => total + component.amount, 0)
