import { Card, CardHeader, Field, Input, Select, Status, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib'
import { companyProfile } from '@/mocks/payroll'
import { fiscalPeriods, paymentMethods, systemParameters } from '@/mocks/setup'

export function PaymentMethodPanel() {
  return (
    <Card>
      <CardHeader
        title="Jenis Pembayaran"
        description="Referensi metode pembayaran transaksi"
        action={<Button>Tambah Metode</Button>}
      />
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((method, index) => (
          <div
            key={method}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
          >
            <div>
              <p className="text-xs font-bold">{method}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                Metode #{String(index + 1).padStart(2, '0')}
              </p>
            </div>
            <Status tone="green">Aktif</Status>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Tahun buku dan status periode.
 *
 * Transaksi pada periode yang sudah ditutup tidak dapat diedit; pembukaan
 * kembali hanya oleh Super Admin.
 */
export function FiscalPeriodPanel() {
  return (
    <Card>
      <CardHeader
        title="Tahun Buku 2026"
        description="Kelola status buka dan tutup periode"
        action={
          <Select>
            <option>2026</option>
          </Select>
        }
      />
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {fiscalPeriods.map(period => {
          const closed = period.status === 'Closed'
          return (
            <div key={period.month} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between">
                <p className="text-xs font-bold">
                  {period.month} {period.year}
                </p>
                <Status tone={closed ? 'slate' : 'green'}>{period.status}</Status>
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                {closed ? 'Ditutup oleh Super Admin' : 'Periode dapat digunakan'}
              </p>
              <button className="mt-3 text-[10px] font-bold text-blue-700">
                {closed ? 'Lihat detail' : 'Tutup periode'}
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/** Identitas perusahaan yang dicetak pada kop laporan dan slip gaji. */
export function CompanyProfilePanel() {
  return (
    <Card>
      <CardHeader
        title="Profil Perusahaan"
        description="Digunakan pada header laporan dan slip gaji"
      />
      <div className="grid gap-5 p-5 md:grid-cols-[180px_1fr]">
        <div>
          <div
            className={cn(
              'grid aspect-square place-items-center rounded-2xl',
              'border-2 border-dashed border-slate-300 bg-slate-50',
              'text-4xl font-black text-blue-800',
            )}
          >
            T
          </div>
          <Button variant="outline" className="mt-3 w-full">
            Ganti Logo
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Perusahaan">
            <Input placeholder={companyProfile.name} />
          </Field>
          <Field label="Email">
            <Input placeholder={companyProfile.email} />
          </Field>
          <Field label="Alamat" className="sm:col-span-2">
            <Textarea defaultValue={companyProfile.address} />
          </Field>
          <Field label="Website">
            <Input placeholder={companyProfile.website} />
          </Field>
          <Field label="Telepon">
            <Input placeholder="+62 ..." />
          </Field>
          <div className="sm:col-span-2">
            <Button>Simpan Profil</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Parameter perhitungan: minimum cash, pajak dividen, dan standar rasio. */
export function ParameterPanel() {
  return (
    <Card>
      <CardHeader
        title="Parameter Sistem"
        description="Standar dan nilai default perhitungan perusahaan"
      />
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {systemParameters.map(parameter => (
          <Field key={parameter.label} label={parameter.label}>
            <Input placeholder={parameter.placeholder} />
          </Field>
        ))}
        <div className="sm:col-span-2 lg:col-span-3">
          <Button>Simpan Parameter</Button>
        </div>
      </div>
    </Card>
  )
}
