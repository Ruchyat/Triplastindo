import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { CompoundJournalForm } from './components/CompoundJournalForm'
import { SimpleJournalForm } from './components/SimpleJournalForm'

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
 */
export function ManualJournalPage() {
  const [mode, setMode] = useState<JournalMode>('simple')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Jurnal Manual"
        title="Jurnal Manual"
        description="Jurnal penyesuaian, koreksi, dan transaksi khusus oleh Finance"
        actions={
          <Button variant="outline">
            <FileSpreadsheet size={16} />
            Template Jurnal
          </Button>
        }
      />

      <InfoNote>
        Transaksi bisnis sehari-hari dicatat melalui menu <b>Penjualan</b>, <b>Pembelian</b>,{' '}
        <b>Pengeluaran</b>, dan <b>Kas &amp; Bank</b>. Jurnal manual dipakai hanya untuk penyesuaian,
        koreksi akuntansi, reklasifikasi akun, dan jurnal penutup.
      </InfoNote>

      <TabSwitch options={modes} value={mode} onChange={setMode} variant="solid" />

      {mode === 'simple' ? <SimpleJournalForm /> : <CompoundJournalForm />}
    </div>
  )
}
