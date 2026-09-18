import { useMemo, useState } from 'react'
import { toAmount } from '@/lib'
import type {
  ApiProduct,
  ApiPurchaseCategory,
  ApiPurchaseSettlement,
  ApiSupplier,
  PurchaseBillPayload,
} from '@/types'

/** Satu baris item pada form, masih berupa teks apa adanya dari input. */
export type BillItemDraft = {
  key: number
  productId: string
  description: string
  quantity: string
  unit: string
  unitPrice: string
}

const emptyItem = (key: number): BillItemDraft => ({
  key,
  productId: '',
  description: '',
  quantity: '',
  unit: 'Kg',
  unitPrice: '',
})

const today = () => new Date().toISOString().slice(0, 10)

/**
 * State form tagihan pembelian.
 *
 * Perbedaannya dari form penjualan ada pada kategori: ialah yang menentukan
 * akun mana yang didebit, apakah barisnya harus menunjuk produk, dan akun
 * utang mana yang dipakai. Karena itu kategori memengaruhi bentuk formnya,
 * bukan sekadar menjadi satu kolom tambahan.
 */
export function usePurchaseBillForm(
  categories: ApiPurchaseCategory[],
  products: ApiProduct[],
  suppliers: ApiSupplier[],
) {
  const [date, setDate] = useState(today)
  const [supplierId, setSupplierId] = useState('')
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('')
  const [categoryValue, setCategoryValue] = useState('')
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [settlement, setSettlement] = useState<ApiPurchaseSettlement>('payable')
  const [cashAccountId, setCashAccountId] = useState('')
  const [termDays, setTermDays] = useState('30')
  const [downPayment, setDownPayment] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<BillItemDraft[]>([emptyItem(0)])

  const category = categories.find(candidate => candidate.value === categoryValue)
  const isDeferred = settlement === 'payable'
  const paidNow = isDeferred ? toAmount(downPayment) : 0

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + toAmount(item.quantity) * toAmount(item.unitPrice), 0),
    [items],
  )
  const total = subtotal + toAmount(taxAmount)

  const dueDate = useMemo(() => {
    if (!isDeferred || !date) return null
    const due = new Date(date)
    due.setDate(due.getDate() + (Number(termDays) || 0))
    return due.toISOString().slice(0, 10)
  }, [date, termDays, isDeferred])

  function addItem() {
    setItems(current => [...current, emptyItem(Date.now())])
  }

  function removeItem(key: number) {
    setItems(current => (current.length === 1 ? current : current.filter(item => item.key !== key)))
  }

  function updateItem(key: number, patch: Partial<BillItemDraft>) {
    setItems(current =>
      current.map(item => {
        if (item.key !== key) return item
        const next = { ...item, ...patch }
        // Satuan mengikuti produk yang dipilih, kecuali sudah diubah sendiri.
        if (patch.productId) {
          const product = products.find(candidate => String(candidate.id) === patch.productId)
          if (product) next.unit = product.unit
        }
        return next
      }),
    )
  }

  /** Mengganti kategori mengosongkan baris, karena bentuk barisnya berubah. */
  function selectCategory(value: string) {
    setCategoryValue(value)
    setExpenseAccountId('')
    setItems([emptyItem(Date.now())])
  }

  function selectSupplier(value: string) {
    setSupplierId(value)
    const picked = suppliers.find(candidate => String(candidate.id) === value)
    if (picked) setTermDays(String(picked.payment_term_days))
  }

  /** Uang yang benar-benar dibayar saat tagihan dicatat. */
  const paidAtBilling = isDeferred ? paidNow : total
  const needsCashAccount = paidAtBilling > 0

  const isStock = category?.is_stock ?? false

  const hasUsableItem = items.some(
    item =>
      toAmount(item.quantity) > 0 &&
      toAmount(item.unitPrice) > 0 &&
      (isStock ? Boolean(item.productId) : Boolean(item.description.trim())),
  )

  const isDirty =
    Boolean(supplierId) ||
    Boolean(categoryValue) ||
    Boolean(note) ||
    Boolean(supplierInvoiceNumber) ||
    items.some(item => item.productId || item.description || item.quantity || item.unitPrice)

  const isValid =
    Boolean(date) &&
    Boolean(supplierId) &&
    Boolean(category) &&
    (!category?.needs_account_choice || Boolean(expenseAccountId)) &&
    (!needsCashAccount || Boolean(cashAccountId)) &&
    hasUsableItem

  function toPayload(post: boolean): PurchaseBillPayload {
    return {
      date,
      supplier_id: Number(supplierId),
      supplier_invoice_number: supplierInvoiceNumber || null,
      category: categoryValue,
      expense_account_id: category?.needs_account_choice ? Number(expenseAccountId) : null,
      settlement_method: settlement,
      cash_account_id: needsCashAccount ? Number(cashAccountId) : null,
      term_days: isDeferred ? Number(termDays) || 0 : null,
      due_date: isDeferred ? dueDate : null,
      tax_amount: taxAmount || '0',
      down_payment: isDeferred && downPayment ? downPayment : '0',
      note: note || null,
      items: items
        .filter(item => toAmount(item.quantity) > 0 && toAmount(item.unitPrice) > 0)
        .map(item => ({
          product_id: isStock ? Number(item.productId) : null,
          description: item.description || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
        })),
      post,
    }
  }

  return {
    date, setDate,
    supplierId, selectSupplier,
    supplierInvoiceNumber, setSupplierInvoiceNumber,
    categoryValue, selectCategory, category,
    categoryOptions: categories,
    expenseAccountId, setExpenseAccountId,
    settlement, setSettlement,
    cashAccountId, setCashAccountId,
    termDays, setTermDays,
    downPayment, setDownPayment,
    taxAmount, setTaxAmount,
    note, setNote,
    items, addItem, removeItem, updateItem,
    isStock, isDeferred, needsCashAccount, dueDate,
    subtotal, total, paidNow,
    payable: Math.max(total - paidNow, 0),
    isDirty, isValid,
    toPayload,
  }
}

export type PurchaseBillForm = ReturnType<typeof usePurchaseBillForm>
