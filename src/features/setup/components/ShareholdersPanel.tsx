import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, Input, NumberInput, Status } from '@/components/common'
import { usePermissions } from '@/features/auth/usePermissions'
import { useAsync } from '@/hooks/useAsync'
import { formatNumber, formatPercent } from '@/lib'
import type { ApiError } from '@/services/httpClient'
import { setupService } from '@/services/setupService'
import type { ApiShareholder, ApiUser } from '@/types'
import { matches } from '../matches'
import { useMasterList } from '../useMasterList'
import { ActiveToggle, MasterDrawer, MasterPanel } from './MasterShell'

/** Master pemegang saham; persentase dihitung dari total saham aktif. */
export function ShareholdersPanel() {
  const permissions = usePermissions()
  const load = useCallback(async () => (await setupService.shareholders()).data, [])
  const list = useMasterList<ApiShareholder>(load)

  const loadUsers = useCallback(
    () => (permissions.can('setup.admin') ? setupService.users() : Promise.resolve([] as ApiUser[])),
    [permissions],
  )
  const users = useAsync(loadUsers).data ?? []

  const rows = list.items.filter(s => matches(list.search, s.name))
  const totalShares = list.items.filter(s => s.is_active).reduce((sum, s) => sum + s.shares, 0)

  return (
    <>
      <MasterPanel
        title="Pemegang Saham"
        description={`Total saham aktif ${formatNumber(totalShares)} lembar`}
        addLabel="Tambah Pemegang Saham"
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari nama..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText="Belum ada pemegang saham."
      >
        <thead>
          <tr>
            <th>Nama</th>
            <th className="text-right">Jumlah Saham</th>
            <th className="text-right">% Share</th>
            <th>Akun Pengguna</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id}>
              <td className="font-semibold">{s.name}</td>
              <td className="money">{formatNumber(s.shares)}</td>
              <td className="money">{formatPercent(s.percentage)}</td>
              <td className="text-slate-500">{s.user_name ?? '–'}</td>
              <td>
                <Status tone={s.is_active ? 'green' : 'slate'}>{s.is_active ? 'Aktif' : 'Nonaktif'}</Status>
              </td>
              <td>
                {permissions.can('setup.admin') && (
                  <button type="button" className="font-semibold text-blue-700" onClick={() => list.setEditing(s)}>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <ShareholderDrawer
          shareholder={list.editing === 'new' ? null : list.editing}
          users={users}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() =>
              list.editing === 'new' || list.editing === null
                ? setupService.createShareholder(payload)
                : setupService.updateShareholder(list.editing.id, payload),
            )
          }
        />
      )}
    </>
  )
}

type DrawerProps = {
  shareholder: ApiShareholder | null
  users: ApiUser[]
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: { name: string; shares: number; user_id: number | null; is_active: boolean }) => void
}

function ShareholderDrawer({ shareholder, users, isSaving, error, onClose, onSave }: DrawerProps) {
  const [name, setName] = useState(shareholder?.name ?? '')
  const [shares, setShares] = useState(shareholder ? String(shareholder.shares) : '')
  const [userId, setUserId] = useState(shareholder?.user_id ? String(shareholder.user_id) : '')
  const [isActive, setIsActive] = useState(shareholder?.is_active ?? true)

  return (
    <MasterDrawer
      title={shareholder ? `Edit ${shareholder.name}` : 'Pemegang Saham Baru'}
      description="Tautkan ke akun pengguna berperan Viewer agar ia melihat dividennya sendiri."
      onClose={onClose}
      isSaving={isSaving}
      isValid={name.trim() !== '' && Number(shares) >= 0}
      error={error}
      onSave={() => onSave({ name: name.trim(), shares: Number(shares) || 0, user_id: userId ? Number(userId) : null, is_active: isActive })}
    >
      <Field label="Nama" required>
        <Input autoFocus={!shareholder} value={name} onChange={e => setName(e.target.value)} />
        <FieldError message={error?.fieldError('name')} />
      </Field>
      <Field label="Jumlah Saham" required>
        <NumberInput suffix="lembar" value={shares} onChange={setShares} />
        <FieldError message={error?.fieldError('shares')} />
      </Field>
      <Field label="Akun Pengguna">
        <Combobox
          placeholder="Tidak ditautkan"
          options={users.map(u => ({ value: String(u.id), label: u.name, description: `${u.email} · ${u.role_label}` }))}
          value={userId}
          onChange={setUserId}
        />
      </Field>
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </MasterDrawer>
  )
}
