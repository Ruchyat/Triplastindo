import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { useAsync } from '@/hooks/useAsync'
import { masterDataService } from '@/services/masterDataService'
import { PurchaseBillTable } from './components/PurchaseBillTable'
import { usePurchaseBills } from './usePurchaseBills'

/**
 * Halaman Pembelian — daftar tagihannya.
 *
 * Satu menu menampung seluruh kategori pembelian: bahan baku, bahan pendukung,
 * sparepart, dan beban. Kategorilah yang menentukan akun mana yang didebit dan
 * akun utang mana yang dipakai, bukan menu yang terpisah-pisah.
 */
export function PurchasesPage() {
  const navigate = useNavigate()
  const purchases = usePurchaseBills()

  // Dipakai isi dropdown penyaring.
  const loadFilters = useCallback(
    () => Promise.all([masterDataService.suppliers(), masterDataService.purchaseCategories()]),
    [],
  )
  const master = useAsync(loadFilters)
  const [suppliers = [], categories = []] = master.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi / Pembelian"
        title="Pembelian"
        description="Catat tagihan supplier, utang, dan pembayarannya"
        actions={
          <Button onClick={() => navigate(toPath.purchaseBillNew())}>
            <Plus size={16} />
            Buat Tagihan
          </Button>
        }
      />

      {(purchases.error || master.error) && (
        <InfoNote tone="red">{purchases.error ?? master.error}</InfoNote>
      )}

      <PurchaseBillTable
        bills={purchases.bills}
        summary={purchases.summary}
        suppliers={suppliers}
        categories={categories}
        filters={purchases.filters}
        onFilterChange={purchases.setFilters}
        isLoading={purchases.isLoading}
        onSelect={id => navigate(toPath.purchaseBill(id))}
      />
    </div>
  )
}
