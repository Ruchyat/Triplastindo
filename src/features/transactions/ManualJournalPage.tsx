import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { useAsync } from '@/hooks/useAsync'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { ApiError } from '@/services/httpClient'
import { journalService } from '@/services/journalService'
import { masterDataService } from '@/services/masterDataService'
import type { ApiJournalEntry } from '@/types'
import { CompoundJournalForm } from './components/CompoundJournalForm'
import { SimpleJournalForm } from './components/SimpleJournalForm'
import { useManualJournalForm } from './useManualJournalForm'

type JournalMode = 'simple' | 'compound'

const modes: TabOption<JournalMode>[] = [
  { value: 'simple', label: 'Jurnal Sederhana' },
  { value: 'compound', label: 'Jurnal Majemuk' },
]

/**
 * Halaman Jurnal Manual.
 *
 * Bukan jalur utama pencatatan. Transaksi bisnis dicatat lewat menu
 * Penjualan, Pembelian, Pengeluaran, dan Kas & Bank; halaman ini khusus
 * untuk jurnal penyesuaian, koreksi, reklasifikasi, dan jurnal penutup.
 *
 * Kedua mode memakai state yang sama: jurnal sederhana hanyalah jurnal
 * majemuk dengan dua baris. Berpindah mode tidak menghilangkan isian.
 */
export function ManualJournalPage() {
  const [mode, setMode] = useState<JournalMode>('simple')
  const form = useManualJournalForm()
  const guard = useUnsavedChanges(form.isDirty)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<ApiJournalEntry | null>(null)

  const loadAccounts = useCallback(() => masterDataService.accounts(), [])
  const accounts = useAsync(loadAccounts)

  async function save() {
    setIsSaving(true)
    setError(null)

    try {
      const entry = await journalService.create(form.toPayload())
      setSaved(entry)
      form.reset()
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'Jurnal gagal disimpan. Coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Jurnal Manual"
        title="Jurnal Manual"
        description="Jurnal penyesuaian, koreksi, dan transaksi khusus oleh Finance"
      />

      <InfoNote>
        Transaksi bisnis sehari-hari dicatat melalui menu <b>Penjualan</b>, <b>Pembelian</b>,{' '}
        <b>Pengeluaran</b>, dan <b>Kas &amp; Bank</b>. Jurnal manual dipakai hanya untuk penyesuaian,
        koreksi akuntansi, reklasifikasi akun, dan jurnal penutup.
      </InfoNote>

      {accounts.error && <InfoNote tone="red">{accounts.error}</InfoNote>}
      {error && <InfoNote tone="red">{error}</InfoNote>}
      {saved && (
        <InfoNote tone="green">
          Jurnal <b>{saved.number}</b> tersimpan.{' '}
          <Link
            to={`${routePaths.journals}?search=${encodeURIComponent(saved.number)}&month=${saved.date.slice(0, 7)}`}
            className="font-semibold underline"
          >
            Lihat di Jurnal Umum
          </Link>
        </InfoNote>
      )}

      <TabSwitch options={modes} value={mode} onChange={setMode} variant="solid" />

      {mode === 'simple' ? (
        <SimpleJournalForm
          form={form}
          accounts={accounts.data ?? []}
          isSaving={isSaving}
          onSave={() => void save()}
        />
      ) : (
        <CompoundJournalForm
          form={form}
          accounts={accounts.data ?? []}
          isSaving={isSaving}
          onSave={() => void save()}
        />
      )}

      {guard.isBlocked && (
        <ConfirmDialog
          title="Tinggalkan jurnal ini?"
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
