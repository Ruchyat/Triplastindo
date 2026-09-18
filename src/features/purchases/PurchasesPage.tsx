import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toPath } from '@/app/router'
import { InfoNote, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/Button'
import { TabSwitch, type TabOption } from '@/components/ui/TabSwitch'
import { useAsync } from '@/hooks/useAsync'
import { masterDataService } from '@/services/masterDataService'
import { PurchaseBillTable } from './components/PurchaseBillTable'
import { SupplierPaymentsTable } from './components/SupplierPaymentsTable'
import { usePurchaseBills } from './usePurchaseBills'
import { useSupplierPayments } from './useSupplierPayments'

type PurchaseTab = 'bills' | 'payments'

const tabs: TabOption<PurchaseTab>[] = [
  { value: 'bills', label: 'Tagihan Pembelian' },
  { value: 'payments', label: 'Pembayaran Supplier' },
]

/**
 * Halaman Pembelian — daftar tagihan dan pembayarannya.
 *
 * Satu menu menampung seluruh kategori pembelian: bahan baku, bahan pendukung,
 * sparepart, dan beban. Kategorilah yang menentukan akun mana yang didebit dan
 * akun utang mana yang dipakai, bukan menu yang terpisah-pisah.
 */
export function PurchasesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<PurchaseTab>('bills')
  const purchases = usePurchaseBills()
  const payments = useSupplierPayments()

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
          <>
            <Button
              variant={tab === 'payments' ? 'primary' : 'outline'}
              onClick={() => navigate(toPath.supplierPaymentNew())}
            >
              {tab === 'payments' && <Plus size={16} />}
              Bayar Supplier
            </Button>
            {tab === 'bills' && (
              <Button onClick={() => navigate(toPath.purchaseBillNew())}>
                <Plus size={16} />
                Buat Tagihan
              </Button>
            )}
          </>
        }
      />

      <TabSwitch options={tabs} value={tab} onChange={setTab} />

      {(purchases.error || payments.error || master.error) && (
        <InfoNote tone="red">{purchases.error ?? payments.error ?? master.error}</InfoNote>
      )}

      {tab === 'bills' && (
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
      )}

      {tab === 'payments' && (
        <SupplierPaymentsTable
          payments={payments.payments}
          suppliers={suppliers}
          filters={payments.filters}
          onFilterChange={payments.setFilters}
          isLoading={payments.isLoading}
          onSelect={id => navigate(toPath.supplierPayment(id))}
        />
      )}
    </div>
  )
}
