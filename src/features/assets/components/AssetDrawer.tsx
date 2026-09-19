import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, InfoNote, Input, NumberInput, Textarea } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount, today } from '@/lib'
import { ApiError } from '@/services/httpClient'
import { assetService } from '@/services/assetService'
import { masterDataService } from '@/services/masterDataService'
import type { ApiAssetType, ApiFixedAsset } from '@/types'

type Props = {
  asset: ApiFixedAsset | null
  types: ApiAssetType[]
  onClose: () => void
  onSaved: () => void
}

const fundingOptions = [
  { value: 'opening', label: 'Saldo awal (tanpa jurnal)', },
  { value: 'cash', label: 'Dibeli tunai (D aset · K kas/bank)' },
  { value: 'payable', label: 'Dibeli bertermin (D aset · K hutang usaha)' },
]

/** Form aset tetap. Residu dan umur manfaat terisi dari jenisnya. */
export function AssetDrawer({ asset, types, onClose, onSaved }: Props) {
  const [code, setCode] = useState(asset?.code ?? '')
  const [name, setName] = useState(asset?.name ?? '')
  const [typeId, setTypeId] = useState(asset ? String(asset.asset_type_id) : '')
  const [acquisitionDate, setAcquisitionDate] = useState(asset?.acquisition_date ?? today())
  const [inUseDate, setInUseDate] = useState(asset?.in_use_date ?? '')
  const [cost, setCost] = useState(asset?.cost ?? '')
  const [residual, setResidual] = useState(asset?.residual_value ?? '')
  const [years, setYears] = useState(asset ? String(asset.useful_life_years) : '')
  const [openingAccumulated, setOpeningAccumulated] = useState(asset?.opening_accumulated ?? '')
  const [funding, setFunding] = useState('opening')
  const [cashAccountId, setCashAccountId] = useState('')
  const [note, setNote] = useState(asset?.note ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const loadCash = useCallback(() => masterDataService.accounts({ isCash: true }), [])
  const cashAccounts = useAsync(loadCash).data ?? []

  const type = types.find(t => String(t.id) === typeId)
  const lifeYears = Number(years) || type?.default_useful_life_years || 0
  const residualValue = residual !== '' ? toAmount(residual) : toAmount(cost) * 0.01
  const monthly = type?.is_depreciable && lifeYears > 0 ? (toAmount(cost) - residualValue) / (lifeYears * 12) : 0

  const isValid = code.trim() !== '' && name.trim() !== '' && typeId !== '' && acquisitionDate !== '' && (funding !== 'cash' || cashAccountId !== '')

  async function save() {
    setIsSaving(true)
    setError(null)
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        asset_type_id: Number(typeId),
        acquisition_date: acquisitionDate,
        in_use_date: inUseDate || null,
        cost: cost || '0',
        residual_value: residual || null,
        useful_life_years: years ? Number(years) : null,
        opening_accumulated: openingAccumulated || null,
        note: note || null,
      }
      if (asset) await assetService.update(asset.id, payload)
      else await assetService.create({ ...payload, funding: funding as 'opening' | 'cash' | 'payable', cash_account_id: cashAccountId ? Number(cashAccountId) : null })
      onSaved()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure : new ApiError('Aset gagal disimpan.', 0))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer size="md" eyebrow="Aset Tetap" title={asset ? `Edit ${asset.code}` : 'Aset Baru'} onClose={onClose}>
      {error && !Object.keys(error.errors).length && <InfoNote tone="red">{error.message}</InfoNote>}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Kode Aset" required>
          <Input placeholder="MCC-01" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
          <FieldError message={error?.fieldError('code')} />
        </Field>
        <Field label="Nama Aset" required>
          <Input autoFocus={!asset} value={name} onChange={e => setName(e.target.value)} />
          <FieldError message={error?.fieldError('name')} />
        </Field>
      </div>

      <Field label="Jenis Aset" required>
        <Combobox
          placeholder="Pilih jenis..."
          options={types.map(t => ({ value: String(t.id), label: t.name, description: t.is_depreciable ? `${t.default_useful_life_years} tahun · ${t.expense_account}` : 'Tidak disusutkan' }))}
          value={typeId}
          onChange={setTypeId}
        />
        <FieldError message={error?.fieldError('asset_type_id')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal Pembelian" required>
          <Input type="date" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} />
        </Field>
        <Field label="Tanggal Digunakan">
          <Input type="date" value={inUseDate} onChange={e => setInUseDate(e.target.value)} placeholder="Sama dengan pembelian" />
        </Field>
        <Field label="Nominal" required>
          <NumberInput prefix="Rp" value={cost} onChange={setCost} />
          <FieldError message={error?.fieldError('cost')} />
        </Field>
        <Field label="Nilai Residu">
          <NumberInput prefix="Rp" placeholder={`1% = ${formatCurrency(toAmount(cost) * 0.01)}`} value={residual} onChange={setResidual} />
        </Field>
        <Field label="Umur Manfaat">
          <NumberInput suffix="tahun" placeholder={type ? String(type.default_useful_life_years) : ''} value={years} onChange={setYears} />
        </Field>
        <Field label="Akumulasi Sebelum Aplikasi">
          <NumberInput prefix="Rp" placeholder="0" value={openingAccumulated} onChange={setOpeningAccumulated} />
        </Field>
      </div>

      {type?.is_depreciable && toAmount(cost) > 0 && (
        <InfoNote>
          Penyusutan <b>{formatCurrency(monthly)}</b> per bulan ({formatCurrency(monthly * 12)} per tahun) selama {lifeYears} tahun.
        </InfoNote>
      )}

      {!asset && (
        <>
          <Field label="Pendanaan" required>
            <Combobox clearable={false} options={fundingOptions} value={funding} onChange={setFunding} />
          </Field>
          {funding === 'cash' && (
            <Field label="Dibayar dari Akun" required>
              <Combobox
                placeholder="Pilih akun kas/bank..."
                options={cashAccounts.map(a => ({ value: String(a.id), label: a.label }))}
                value={cashAccountId}
                onChange={setCashAccountId}
              />
            </Field>
          )}
        </>
      )}

      <Field label="Keterangan">
        <Textarea className="min-h-16" value={note} onChange={e => setNote(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Batal</Button>
        <Button disabled={!isValid || isSaving} onClick={() => void save()}>
          {isSaving ? 'Menyimpan...' : 'Simpan Aset'}
        </Button>
      </div>
    </Drawer>
  )
}
