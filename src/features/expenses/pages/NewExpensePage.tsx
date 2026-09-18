import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { routePaths, toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAsync } from '@/hooks/useAsync'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { masterDataService } from '@/services/masterDataService'
import { ExpenseForm } from '../components/ExpenseForm'
import { EXPENSE_GROUPS } from '../expenseGroups'

/** Halaman pencatatan pengeluaran biaya. */
export function NewExpensePage() {
  const navigate = useNavigate()
  const [isDirty, setIsDirty] = useState(false)
  const guard = useUnsavedChanges(isDirty)

  const loadMasterData = useCallback(
    () =>
      Promise.all([
        masterDataService.accounts({ groups: EXPENSE_GROUPS }),
        masterDataService.accounts({ isCash: true }),
      ]),
    [],
  )
  const master = useAsync(loadMasterData)
  const [expenseAccounts = [], cashAccounts = []] = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pengeluaran"
        title="Catat Pengeluaran"
        description="Beban bertambah dan kas berkurang; jurnalnya dibuat otomatis"
        actions={
          <Button variant="outline" onClick={() => navigate(routePaths.expenses)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
        }
      />

      {master.error && <InfoNote tone="red">{master.error}</InfoNote>}

      {!master.isLoading && (
        <ExpenseForm
          expenseAccounts={expenseAccounts}
          cashAccounts={cashAccounts}
          onCancel={() => navigate(routePaths.expenses)}
          onDirtyChange={setIsDirty}
          onSaved={expense => {
            guard.release()
            navigate(toPath.expense(expense.id), { replace: true })
          }}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan pengeluaran ini?"
          description="Isian yang sudah diketik belum tersimpan dan akan hilang."
          confirmLabel="Tinggalkan"
          cancelLabel="Tetap di Sini"
          onCancel={guard.stay}
          onConfirm={guard.proceed}
        />
      )}
    </div>
  )
}
