import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, Input, NumberInput, Status } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, toAmount } from '@/lib'
import type { ApiError } from '@/services/httpClient'
import { masterDataService } from '@/services/masterDataService'
import { setupService } from '@/services/setupService'
import type { ApiAccount, ApiEmployee, EmployeePayload } from '@/types'
import { matches } from '../matches'
import { useMasterList } from '../useMasterList'
import { ActiveToggle, MasterDrawer, MasterPanel, ShowInactive } from './MasterShell'

const departments = [
  { value: 'produksi', label: 'Produksi' },
  { value: 'kantor', label: 'Kantor' },
  { value: 'lapangan', label: 'Lapangan' },
]

const statuses = [
  { value: 'tetap', label: 'Tetap' },
  { value: 'kontrak', label: 'Kontrak' },
  { value: 'harian', label: 'Harian' },
]

/**
 * Master karyawan.
 *
 * Departemen wajib — itulah yang menentukan akun beban gaji bawaan (produksi
 * ke HPP, kantor dan lapangan ke beban operasional) dan mengisi slip gaji.
 */
export function EmployeesPanel() {
  const load = useCallback(() => setupService.employees({ includeInactive: true, withLoan: true }), [])
  const list = useMasterList<ApiEmployee>(load)
  const [showInactive, setShowInactive] = useState(false)

  const loadAccounts = useCallback(() => masterDataService.accounts({ groups: ['hpp', 'beban'] }), [])
  const accounts = useAsync(loadAccounts).data ?? []

  const rows = list.items.filter(
    e => (showInactive || e.is_active) && matches(list.search, e.nik, e.name, e.position, e.department_label),
  )

  return (
    <>
      <MasterPanel
        title="Master Karyawan"
        description="Dipakai payroll dan slip gaji"
        addLabel="Tambah Karyawan"
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari NIK, nama, atau posisi..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText="Tidak ada karyawan yang cocok."
        extra={<ShowInactive value={showInactive} onChange={setShowInactive} />}
      >
        <thead>
          <tr>
            <th>NIK</th>
            <th>Nama</th>
            <th>Departemen</th>
            <th>Posisi</th>
            <th>Status</th>
            <th className="text-right">Gaji Pokok</th>
            <th className="text-right">Sisa Kasbon</th>
            <th>Aktif</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(e => (
            <tr key={e.id}>
              <td className="font-semibold text-blue-700">{e.nik}</td>
              <td className="font-semibold">{e.name}</td>
              <td>{e.department_label}</td>
              <td>{e.position ?? '–'}</td>
              <td>{e.employment_status_label}</td>
              <td className="money">{formatCurrency(toAmount(e.basic_salary))}</td>
              <td className="money">{formatCurrency(toAmount(e.loan_balance))}</td>
              <td>
                <Status tone={e.is_active ? 'green' : 'slate'}>{e.is_active ? 'Aktif' : 'Nonaktif'}</Status>
              </td>
              <td>
                <button type="button" className="font-semibold text-blue-700" onClick={() => list.setEditing(e)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <EmployeeDrawer
          employee={list.editing === 'new' ? null : list.editing}
          accounts={accounts}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() =>
              list.editing === 'new' || list.editing === null
                ? setupService.createEmployee(payload)
                : setupService.updateEmployee(list.editing.id, payload),
            )
          }
        />
      )}
    </>
  )
}

type DrawerProps = {
  employee: ApiEmployee | null
  accounts: ApiAccount[]
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: EmployeePayload) => void
}

function EmployeeDrawer({ employee, accounts, isSaving, error, onClose, onSave }: DrawerProps) {
  const [nik, setNik] = useState(employee?.nik ?? '')
  const [name, setName] = useState(employee?.name ?? '')
  const [department, setDepartment] = useState<ApiEmployee['department']>(employee?.department ?? 'produksi')
  const [position, setPosition] = useState(employee?.position ?? '')
  const [status, setStatus] = useState<ApiEmployee['employment_status']>(employee?.employment_status ?? 'tetap')
  const [joinedAt, setJoinedAt] = useState(employee?.joined_at ?? '')
  const [basic, setBasic] = useState(employee?.basic_salary ?? '')
  const [allowance, setAllowance] = useState(employee?.allowance ?? '')
  const [accountId, setAccountId] = useState(employee ? String(employee.expense_account_id) : '')
  const [bank, setBank] = useState(employee?.bank_account ?? '')
  const [isActive, setIsActive] = useState(employee?.is_active ?? true)

  const isValid = nik.trim() !== '' && name.trim() !== '' && toAmount(basic) >= 0

  return (
    <MasterDrawer
      title={employee ? `Edit ${employee.name}` : 'Karyawan Baru'}
      description="Akun beban gaji mengikuti departemen bila dikosongkan."
      onClose={onClose}
      isSaving={isSaving}
      isValid={isValid}
      error={error}
      onSave={() =>
        onSave({
          nik: nik.trim(),
          name: name.trim(),
          department,
          position: position || null,
          employment_status: status,
          joined_at: joinedAt || null,
          basic_salary: basic || '0',
          allowance: allowance || '0',
          expense_account_id: accountId ? Number(accountId) : null,
          bank_account: bank || null,
          is_active: isActive,
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="NIK" required>
          <Input value={nik} onChange={e => setNik(e.target.value)} />
          <FieldError message={error?.fieldError('nik')} />
        </Field>
        <Field label="Nama" required>
          <Input autoFocus={!employee} value={name} onChange={e => setName(e.target.value)} />
          <FieldError message={error?.fieldError('name')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Departemen" required>
          <Combobox clearable={false} options={departments} value={department} onChange={v => setDepartment(v as ApiEmployee['department'])} />
        </Field>
        <Field label="Posisi">
          <Input value={position} onChange={e => setPosition(e.target.value)} />
        </Field>
        <Field label="Status Kerja" required>
          <Combobox clearable={false} options={statuses} value={status} onChange={v => setStatus(v as ApiEmployee['employment_status'])} />
        </Field>
        <Field label="Tanggal Masuk">
          <Input type="date" value={joinedAt} onChange={e => setJoinedAt(e.target.value)} />
        </Field>
        <Field label="Gaji Pokok" required>
          <NumberInput prefix="Rp" value={basic} onChange={setBasic} />
          <FieldError message={error?.fieldError('basic_salary')} />
        </Field>
        <Field label="Allowance Tetap">
          <NumberInput prefix="Rp" value={allowance} onChange={setAllowance} />
        </Field>
      </div>

      <Field label="Akun Beban Gaji">
        <Combobox
          placeholder="Mengikuti departemen"
          options={accounts.map(a => ({ value: String(a.id), label: a.label }))}
          value={accountId}
          onChange={setAccountId}
        />
      </Field>

      <Field label="Rekening Bank">
        <Input placeholder="BCA 1234567890 a.n. ..." value={bank} onChange={e => setBank(e.target.value)} />
      </Field>

      <ActiveToggle value={isActive} onChange={setIsActive} />
    </MasterDrawer>
  )
}
