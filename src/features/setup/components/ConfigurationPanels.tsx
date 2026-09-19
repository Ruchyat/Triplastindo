import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import {
  Card,
  CardHeader,
  Combobox,
  Field,
  InfoNote,
  Input,
  NumberInput,
  Status,
  TableWrap,
  Textarea,
} from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePermissions } from '@/features/auth/usePermissions'
import { monthNames } from '@/features/reports/useReportPeriod'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate, formatPercent, toAmount } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { setupService } from '@/services/setupService'
import type { ApiSettings } from '@/types'

/** Menyimpan sebagian pengaturan lalu memuat ulang; dipakai ketiga panel di bawah. */
function useSettings() {
  const load = useCallback(() => setupService.settings(), [])
  const { data, error, reload } = useAsync(load)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)

  async function save(patch: Partial<ApiSettings>) {
    setIsSaving(true)
    setMessage(null)
    try {
      await setupService.updateSettings(patch)
      reload()
      setMessage({ tone: 'green', text: 'Pengaturan tersimpan.' })
    } catch (failure) {
      setMessage({ tone: 'red', text: failure instanceof ApiError ? failure.message : 'Gagal menyimpan.' })
    } finally {
      setIsSaving(false)
    }
  }

  return { settings: data, error, isSaving, message, save }
}

type SettingsState = ReturnType<typeof useSettings>

/** Jenis pembayaran yang ditawarkan pada jurnal dan dokumen. */
export function PaymentMethodPanel() {
  const state = useSettings()
  if (!state.settings) return state.error ? <InfoNote tone="red">{state.error}</InfoNote> : null

  // `key` memaksa form memulai ulang dari nilai tersimpan setiap kali pengaturan dimuat ulang.
  return <PaymentMethodForm key={state.settings.payment_methods.join('|')} initial={state.settings.payment_methods} state={state} />
}

function PaymentMethodForm({ initial, state }: { initial: string[]; state: SettingsState }) {
  const { error, isSaving, message, save } = state
  const permissions = usePermissions()
  const [methods, setMethods] = useState<string[]>(initial)
  const [draft, setDraft] = useState('')

  return (
    <Card>
      <CardHeader
        title="Jenis Pembayaran"
        description="Pilihan metode pada jurnal manual dan dokumen"
        action={
          permissions.can('setup.admin') && (
            <Button disabled={isSaving || methods.length === 0} onClick={() => void save({ payment_methods: methods })}>
              Simpan
            </Button>
          )
        }
      />
      <div className="space-y-4 p-5">
        {error && <InfoNote tone="red">{error}</InfoNote>}
        {message && <InfoNote tone={message.tone}>{message.text}</InfoNote>}
        <div className="flex flex-wrap gap-2">
          {methods.map(method => (
            <span key={method} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {method}
              {permissions.can('setup.admin') && (
                <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => setMethods(methods.filter(m => m !== method))}>
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {permissions.can('setup.admin') && (
          <div className="flex gap-2">
            <Input
              placeholder="Jenis pembayaran baru"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && draft.trim()) {
                  setMethods([...methods, draft.trim()])
                  setDraft('')
                }
              }}
            />
            <Button
              variant="outline"
              disabled={!draft.trim()}
              onClick={() => {
                setMethods([...methods, draft.trim()])
                setDraft('')
              }}
            >
              Tambah
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Tutup dan buka buku bulanan.
 *
 * Bulan tertutup menolak jurnal baru dari modul mana pun. Menutup harus
 * berurutan; membuka kembali hanya Super Admin, dari bulan tertutup terakhir.
 */
export function FiscalPeriodPanel() {
  const permissions = usePermissions()
  const [year, setYear] = useState(new Date().getFullYear())
  const load = useCallback(() => setupService.fiscalPeriods(year), [year])
  const { data, error, reload } = useAsync(load)
  const [confirm, setConfirm] = useState<{ month: number; action: 'close' | 'reopen' } | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function run() {
    if (!confirm) return
    setIsWorking(true)
    setActionError(null)
    try {
      if (confirm.action === 'close') await setupService.closePeriod(year, confirm.month)
      else await setupService.reopenPeriod(year, confirm.month)
      reload()
      setConfirm(null)
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : 'Gagal memproses periode.')
    } finally {
      setIsWorking(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 3 + i))

  return (
    <Card>
      <CardHeader
        title={`Tahun Buku ${year}`}
        description="Bulan tertutup menolak jurnal baru; tutup buku harus berurutan"
        action={
          <Combobox
            className="w-28"
            clearable={false}
            options={years.map(y => ({ value: y, label: y }))}
            value={String(year)}
            onChange={v => setYear(Number(v))}
          />
        }
      />
      {error && <div className="p-4"><InfoNote tone="red" variant="inset">{error}</InfoNote></div>}
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map(period => {
          const closed = period.status === 'closed'
          return (
            <div key={period.month} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between">
                <p className="text-xs font-bold">{monthNames[period.month - 1]} {period.year}</p>
                <Status tone={closed ? 'slate' : 'green'}>{closed ? 'Closed' : 'Open'}</Status>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {period.journal_count} jurnal
                {closed && period.closed_by && ` · ditutup ${period.closed_by}`}
                {closed && period.closed_at && `, ${formatDate(period.closed_at)}`}
              </p>
              <div className="mt-3">
                {closed
                  ? permissions.can('setup.admin') && (
                      <button type="button" className="text-xs font-semibold text-blue-700" onClick={() => setConfirm({ month: period.month, action: 'reopen' })}>
                        Buka kembali
                      </button>
                    )
                  : permissions.can('transactions.write') && (
                      <button type="button" className="text-xs font-semibold text-blue-700" onClick={() => setConfirm({ month: period.month, action: 'close' })}>
                        Tutup buku
                      </button>
                    )}
              </div>
            </div>
          )
        })}
      </div>

      {confirm && (
        <ConfirmDialog
          title={`${confirm.action === 'close' ? 'Tutup' : 'Buka kembali'} ${monthNames[confirm.month - 1]} ${year}?`}
          description={
            confirm.action === 'close'
              ? 'Setelah ditutup, tidak ada jurnal baru yang dapat masuk ke bulan ini dari modul mana pun. Hanya Super Admin yang dapat membukanya kembali.'
              : 'Bulan ini kembali menerima jurnal. Laporan periode ini dapat berubah.'
          }
          confirmLabel={confirm.action === 'close' ? 'Tutup Buku' : 'Buka Kembali'}
          tone={confirm.action === 'close' ? 'danger' : 'default'}
          isWorking={isWorking}
          error={actionError}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void run()}
        />
      )}
    </Card>
  )
}

/** Identitas perusahaan pada kop laporan dan slip gaji. */
export function CompanyProfilePanel() {
  const state = useSettings()
  if (!state.settings) return state.error ? <InfoNote tone="red">{state.error}</InfoNote> : null

  return <CompanyProfileForm key={JSON.stringify(state.settings.company)} initial={state.settings.company} state={state} />
}

function CompanyProfileForm({ initial, state }: { initial: ApiSettings['company']; state: SettingsState }) {
  const { isSaving, message, save } = state
  const permissions = usePermissions()
  const [form, setForm] = useState<ApiSettings['company']>(initial)

  const set = (key: keyof ApiSettings['company']) => (value: string) => setForm({ ...form, [key]: value })
  const editable = permissions.can('setup.admin')

  return (
    <Card>
      <CardHeader
        title="Profil Perusahaan"
        description="Dipakai pada kop laporan dan slip gaji"
        action={editable && <Button disabled={isSaving} onClick={() => void save({ company: form })}>Simpan</Button>}
      />
      <div className="grid gap-4 p-5 md:grid-cols-2">
        {message && <div className="md:col-span-2"><InfoNote tone={message.tone}>{message.text}</InfoNote></div>}
        <Field label="Nama Perusahaan" required>
          <Input value={form.name} onChange={e => set('name')(e.target.value)} readOnly={!editable} />
        </Field>
        <Field label="NPWP">
          <Input value={form.npwp} onChange={e => set('npwp')(e.target.value)} readOnly={!editable} />
        </Field>
        <Field label="Alamat" className="md:col-span-2">
          <Textarea className="min-h-16" value={form.address} onChange={e => set('address')(e.target.value)} readOnly={!editable} />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={e => set('website')(e.target.value)} readOnly={!editable} />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={e => set('email')(e.target.value)} readOnly={!editable} />
        </Field>
        <Field label="Telepon">
          <Input value={form.phone} onChange={e => set('phone')(e.target.value)} readOnly={!editable} />
        </Field>
      </div>
    </Card>
  )
}

const ratioLabels: Record<string, { label: string; percent: boolean; direction: string }> = {
  current_ratio: { label: 'Current Ratio', percent: false, direction: '≥' },
  quick_ratio: { label: 'Quick Ratio', percent: false, direction: '≥' },
  gross_profit_margin: { label: 'Gross Profit Margin', percent: true, direction: '≥' },
  net_profit_margin: { label: 'Net Profit Margin', percent: true, direction: '≥' },
  debt_to_equity: { label: 'Debt to Equity Ratio', percent: false, direction: '≤' },
  cashflow_to_revenue: { label: 'Cashflow to Revenue', percent: true, direction: '≥' },
}

/** Parameter perhitungan: minimum kas, pajak dividen, residu aset, standar rasio. */
export function ParameterPanel() {
  const state = useSettings()
  if (!state.settings) return state.error ? <InfoNote tone="red">{state.error}</InfoNote> : null

  return <ParameterForm key={JSON.stringify([state.settings.parameters, state.settings.ratio_standards])} settings={state.settings} state={state} />
}

function ParameterForm({ settings, state }: { settings: ApiSettings; state: SettingsState }) {
  const { isSaving, message, save } = state
  const permissions = usePermissions()
  const [minimumCash, setMinimumCash] = useState(settings.parameters.minimum_cash)
  const [dividendTax, setDividendTax] = useState(String(settings.parameters.dividend_tax_rate * 100))
  const [residualRate, setResidualRate] = useState(String(settings.parameters.residual_value_rate * 100))
  const [fiscalYear, setFiscalYear] = useState(String(settings.parameters.fiscal_year))
  const [standards, setStandards] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(settings.ratio_standards).map(([key, value]) => [
        key,
        ratioLabels[key]?.percent ? String(Math.round(value * 10000) / 100) : String(value),
      ]),
    ),
  )

  const editable = permissions.can('setup.admin')

  function submit() {
    void save({
      parameters: {
        minimum_cash: minimumCash || '0',
        dividend_tax_rate: (Number(dividendTax) || 0) / 100,
        residual_value_rate: (Number(residualRate) || 0) / 100,
        fiscal_year: Number(fiscalYear) || new Date().getFullYear(),
      },
      ratio_standards: Object.fromEntries(
        Object.entries(standards).map(([key, value]) => [
          key,
          ratioLabels[key]?.percent ? (Number(value.replace(',', '.')) || 0) / 100 : Number(value.replace(',', '.')) || 0,
        ]),
      ),
    })
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Parameter Perhitungan"
          description="Dipakai Bagi Hasil, Aset, dan rasio keuangan"
          action={editable && <Button disabled={isSaving} onClick={submit}>Simpan</Button>}
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {message && <div className="md:col-span-2"><InfoNote tone={message.tone}>{message.text}</InfoNote></div>}
          <Field label="Minimum Cash (check point dividen)">
            <NumberInput prefix="Rp" value={minimumCash} onChange={setMinimumCash} readOnly={!editable} />
          </Field>
          <Field label="Pajak Dividen">
            <NumberInput suffix="%" decimals={2} value={dividendTax} onChange={setDividendTax} readOnly={!editable} />
          </Field>
          <Field label="Nilai Residu Aset">
            <NumberInput suffix="%" decimals={2} value={residualRate} onChange={setResidualRate} readOnly={!editable} />
          </Field>
          <Field label="Tahun Buku Aktif">
            <NumberInput value={fiscalYear} onChange={setFiscalYear} readOnly={!editable} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Standar Rasio Keuangan" description="Dibandingkan dengan rasio YTD pada Neraca dan Dashboard" />
        <TableWrap>
          <thead>
            <tr>
              <th>Rasio</th>
              <th>Arah</th>
              <th className="text-right">Standar</th>
              <th>Saat ini</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(ratioLabels).map(key => (
              <tr key={key}>
                <td className="font-semibold">{ratioLabels[key].label}</td>
                <td>{ratioLabels[key].direction}</td>
                <td>
                  <NumberInput
                    className="ml-auto w-32"
                    decimals={2}
                    suffix={ratioLabels[key].percent ? '%' : undefined}
                    value={standards[key] ?? ''}
                    onChange={value => setStandards({ ...standards, [key]: value })}
                    readOnly={!editable}
                  />
                </td>
                <td className="text-slate-500">
                  {ratioLabels[key].percent
                    ? formatPercent(settings.ratio_standards[key])
                    : settings.ratio_standards[key]}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p className="px-5 py-3 text-[11px] text-slate-500">
          Lihat hasilnya di <Link to={routePaths.balanceSheet} className="font-semibold text-blue-700">Laporan Neraca</Link>.
          Minimum cash saat ini {formatCurrency(toAmount(settings.parameters.minimum_cash))}.
        </p>
      </Card>
    </div>
  )
}
