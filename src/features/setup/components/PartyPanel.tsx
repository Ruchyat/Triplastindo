import { useCallback, useState } from 'react'
import { Field, FieldError, Input, NumberInput, Status, Textarea } from '@/components/common'
import { formatCurrency, toAmount } from '@/lib'
import type { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import type { ApiCustomer, ApiSupplier, CustomerPayload } from '@/types'
import { useMasterList } from '../useMasterList'
import { matches } from '../matches'
import { ActiveToggle, MasterDrawer, MasterPanel, ShowInactive } from './MasterShell'

type Kind = 'customer' | 'supplier'
type Party = ApiCustomer | ApiSupplier

const copy = {
  customer: {
    title: 'Master Customer',
    description: 'Dipakai invoice penjualan, penerimaan, dan deposit',
    addLabel: 'Tambah Customer',
    noun: 'Customer',
    balanceLabel: 'Piutang',
  },
  supplier: {
    title: 'Master Supplier',
    description: 'Dipakai tagihan pembelian dan pembayaran supplier',
    addLabel: 'Tambah Supplier',
    noun: 'Supplier',
    balanceLabel: 'Utang',
  },
} as const

/**
 * Master customer dan supplier.
 *
 * Bentuk keduanya sama — nama, kontak, termin — sehingga satu panel melayani
 * keduanya; yang membedakan hanya batas kredit pada customer dan ke mana
 * datanya disimpan.
 */
export function PartyPanel({ kind }: { kind: Kind }) {
  const text = copy[kind]
  const load = useCallback(
    () =>
      kind === 'customer'
        ? masterDataService.customers({ includeInactive: true, withBalance: true })
        : masterDataService.suppliers({ includeInactive: true, withBalance: true }),
    [kind],
  )
  const list = useMasterList<Party>(load)
  const [showInactive, setShowInactive] = useState(false)

  const rows = list.items.filter(
    party =>
      (showInactive || party.is_active) &&
      matches(list.search, party.code, party.name, party.contact_name, party.phone),
  )

  return (
    <>
      <MasterPanel
        title={text.title}
        description={text.description}
        addLabel={text.addLabel}
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari kode, nama, atau kontak..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText={`Tidak ada ${text.noun.toLowerCase()} yang cocok.`}
        extra={<ShowInactive value={showInactive} onChange={setShowInactive} />}
      >
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama</th>
            <th>Kontak</th>
            <th>Termin</th>
            <th className="text-right">{text.balanceLabel}</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(party => (
            <tr key={party.id}>
              <td className="font-semibold text-blue-700">{party.code}</td>
              <td className="font-semibold">{party.name}</td>
              <td>
                {party.contact_name ?? '–'}
                {party.phone && <span className="block text-[10px] text-slate-500">{party.phone}</span>}
              </td>
              <td>{party.payment_term_days} hari</td>
              <td className="money">{formatCurrency(toAmount(openBalance(party)))}</td>
              <td>
                <Status tone={party.is_active ? 'green' : 'slate'}>
                  {party.is_active ? 'Aktif' : 'Nonaktif'}
                </Status>
              </td>
              <td>
                <button
                  type="button"
                  className="font-semibold text-blue-700"
                  onClick={() => list.setEditing(party)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <PartyDrawer
          kind={kind}
          party={list.editing === 'new' ? null : list.editing}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() => {
              const current = list.editing
              if (kind === 'customer') {
                return current === 'new' || current === null
                  ? masterDataService.createCustomer(payload)
                  : masterDataService.updateCustomer(current.id, payload)
              }
              return current === 'new' || current === null
                ? masterDataService.createSupplier(payload)
                : masterDataService.updateSupplier(current.id, payload)
            })
          }
        />
      )}
    </>
  )
}

/** Sisa piutang untuk customer, sisa utang untuk supplier. */
function openBalance(party: Party): string | undefined {
  return 'open_receivable' in party ? party.open_receivable : (party as ApiSupplier).open_payable
}

type DrawerProps = {
  kind: Kind
  party: Party | null
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: CustomerPayload) => void
}

function PartyDrawer({ kind, party, isSaving, error, onClose, onSave }: DrawerProps) {
  const text = copy[kind]
  const [code, setCode] = useState(party?.code ?? '')
  const [name, setName] = useState(party?.name ?? '')
  const [contactName, setContactName] = useState(party?.contact_name ?? '')
  const [phone, setPhone] = useState(party?.phone ?? '')
  const [email, setEmail] = useState(party?.email ?? '')
  const [address, setAddress] = useState(party?.address ?? '')
  const [npwp, setNpwp] = useState(party?.npwp ?? '')
  const [termDays, setTermDays] = useState(String(party?.payment_term_days ?? 30))
  const [creditLimit, setCreditLimit] = useState(
    party && 'credit_limit' in party ? (party.credit_limit ?? '') : '',
  )
  const [isActive, setIsActive] = useState(party?.is_active ?? true)

  const isValid = name.trim() !== '' && termDays !== ''

  return (
    <MasterDrawer
      title={party ? `Edit ${party.name}` : `${text.noun} Baru`}
      onClose={onClose}
      isSaving={isSaving}
      isValid={isValid}
      error={error}
      onSave={() =>
        onSave({
          code: code.trim() || null,
          name: name.trim(),
          contact_name: contactName || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          npwp: npwp || null,
          payment_term_days: Number(termDays) || 0,
          credit_limit: creditLimit || null,
          is_active: isActive,
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Kode">
          <Input
            placeholder="Otomatis"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
          <FieldError message={error?.fieldError('code')} />
        </Field>
        <Field label={`Nama ${text.noun}`} required>
          <Input autoFocus={!party} value={name} onChange={e => setName(e.target.value)} />
          <FieldError message={error?.fieldError('name')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Kontak">
          <Input value={contactName} onChange={e => setContactName(e.target.value)} />
        </Field>
        <Field label="Telepon">
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <FieldError message={error?.fieldError('email')} />
        </Field>
        <Field label="NPWP">
          <Input value={npwp} onChange={e => setNpwp(e.target.value)} />
        </Field>
      </div>

      <Field label="Alamat">
        <Textarea className="min-h-16" value={address} onChange={e => setAddress(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Termin Bawaan" required>
          <NumberInput suffix="hari" value={termDays} onChange={setTermDays} />
          <FieldError message={error?.fieldError('payment_term_days')} />
        </Field>
        {kind === 'customer' && (
          <Field label="Batas Kredit">
            <NumberInput prefix="Rp" placeholder="Tanpa batas" value={creditLimit} onChange={setCreditLimit} />
            <FieldError message={error?.fieldError('credit_limit')} />
          </Field>
        )}
      </div>

      <ActiveToggle value={isActive} onChange={setIsActive} />
    </MasterDrawer>
  )
}
