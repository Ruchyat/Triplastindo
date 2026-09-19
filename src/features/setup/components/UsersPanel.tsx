import { useCallback, useState } from 'react'
import { Combobox, Field, FieldError, Input, Status } from '@/components/common'
import { useAsync } from '@/hooks/useAsync'
import type { ApiError } from '@/services/httpClient'
import { setupService } from '@/services/setupService'
import type { ApiUser, UserPayload } from '@/types'
import { matches } from '../matches'
import { useMasterList } from '../useMasterList'
import { ActiveToggle, MasterDrawer, MasterPanel } from './MasterShell'

/** Pengguna dan perannya. Hanya Super Admin yang melihat tab ini. */
export function UsersPanel() {
  const load = useCallback(() => setupService.users(), [])
  const list = useMasterList<ApiUser>(load)
  const loadRoles = useCallback(() => setupService.roles(), [])
  const roles = useAsync(loadRoles).data ?? []

  const rows = list.items.filter(u => matches(list.search, u.name, u.email, u.role_label))

  return (
    <>
      <MasterPanel
        title="Pengguna & Peran"
        description="Peran menentukan menu dan tindakan yang boleh diakses"
        addLabel="Tambah Pengguna"
        onAdd={() => list.setEditing('new')}
        search={list.search}
        onSearch={list.setSearch}
        searchPlaceholder="Cari nama, email, atau peran..."
        error={list.loadError}
        isEmpty={rows.length === 0 && !list.isLoading}
        emptyText="Tidak ada pengguna yang cocok."
      >
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Peran</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td className="font-semibold">{u.name}</td>
              <td className="text-slate-500">{u.email}</td>
              <td>{u.role_label}</td>
              <td>
                <Status tone={u.is_active ? 'green' : 'slate'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</Status>
              </td>
              <td>
                <button type="button" className="font-semibold text-blue-700" onClick={() => list.setEditing(u)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterPanel>

      {list.editing && (
        <UserDrawer
          user={list.editing === 'new' ? null : list.editing}
          roles={roles}
          isSaving={list.isSaving}
          error={list.error}
          onClose={list.close}
          onSave={payload =>
            void list.save(() =>
              list.editing === 'new' || list.editing === null
                ? setupService.createUser(payload)
                : setupService.updateUser(list.editing.id, payload),
            )
          }
        />
      )}
    </>
  )
}

type DrawerProps = {
  user: ApiUser | null
  roles: { value: ApiUser['role']; label: string }[]
  isSaving: boolean
  error: ApiError | null
  onClose: () => void
  onSave: (payload: UserPayload) => void
}

function UserDrawer({ user, roles, isSaving, error, onClose, onSave }: DrawerProps) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<ApiUser['role']>(user?.role ?? 'finance')
  const [isActive, setIsActive] = useState(user?.is_active ?? true)

  const isValid = name.trim() !== '' && email.trim() !== '' && (user !== null || password.length >= 8)

  return (
    <MasterDrawer
      title={user ? `Edit ${user.name}` : 'Pengguna Baru'}
      description={user ? 'Kosongkan kata sandi bila tidak diganti.' : 'Kata sandi minimal 8 karakter.'}
      onClose={onClose}
      isSaving={isSaving}
      isValid={isValid}
      error={error}
      onSave={() => onSave({ name: name.trim(), email: email.trim(), password: password || null, role, is_active: isActive })}
    >
      <Field label="Nama" required>
        <Input autoFocus={!user} value={name} onChange={e => setName(e.target.value)} />
        <FieldError message={error?.fieldError('name')} />
      </Field>
      <Field label="Email" required>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <FieldError message={error?.fieldError('email')} />
      </Field>
      <Field label="Kata Sandi" required={!user}>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        <FieldError message={error?.fieldError('password')} />
      </Field>
      <Field label="Peran" required>
        <Combobox clearable={false} options={roles} value={role} onChange={v => setRole(v as ApiUser['role'])} />
        <FieldError message={error?.fieldError('role')} />
      </Field>
      <ActiveToggle value={isActive} onChange={setIsActive} />
    </MasterDrawer>
  )
}
