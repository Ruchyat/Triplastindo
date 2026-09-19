import { useMemo, useState } from 'react'
import { addDays, toAmount, today } from '@/lib'
import type { ApiAccount, ApiCustomer, ApiProduct, ApiSettlementMethod, SalesInvoicePayload } from '@/types'

/** Satu baris produk pada form, masih berupa teks apa adanya dari input. */
export type ItemDraft = {
  /** Kunci lokal agar React dapat membedakan baris meski produknya sama. */
  key: number
  productId: string
  quantity: string
  unitPrice: string
}

const emptyItem = (key: number): ItemDraft => ({ key, productId: '', quantity: '', unitPrice: '' })


/**
 * State form invoice penjualan.
 *
 * Perhitungan di sini hanya untuk ditampilkan. Angka yang mengikat adalah
 * hasil hitungan backend, karena di sanalah jurnalnya dibentuk — form ini
 * tidak pernah mengirimkan total, hanya kuantitas dan harga per baris.
 */
export function useSaleInvoiceForm(products: ApiProduct[], customers: ApiCustomer[]) {
  const [date, setDate] = useState(today)
  const [customerId, setCustomerId] = useState('')
  const [settlement, setSettlement] = useState<ApiSettlementMethod>('receivable')
  const [useDeposit, setUseDeposit] = useState(true)
  const [cashAccountId, setCashAccountId] = useState('')
  const [termDays, setTermDays] = useState('30')
  const [downPayment, setDownPayment] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([emptyItem(0)])

  const isDeferred = settlement === 'receivable'
  const paidNow = isDeferred ? toAmount(downPayment) : 0

  const customer = customers.find(candidate => String(candidate.id) === customerId)

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + toAmount(item.quantity) * toAmount(item.unitPrice), 0),
    [items],
  )

  const total = subtotal + toAmount(taxAmount)

  /**
   * Saldo deposit customer yang akan dipotong backend.
   *
   * Dihitung ulang di sini hanya untuk ditampilkan sebelum menyimpan; yang
   * mengikat adalah hitungan backend saat invoicenya diposting. Berlaku untuk
   * kedua metode: pada penjualan tunai ia mengurangi uang yang perlu diterima,
   * pada penjualan bertermin ia mengurangi piutang.
   */
  const availableDeposit = toAmount(customer?.deposit_balance)
  const appliedDeposit = useDeposit
    ? Math.min(availableDeposit, Math.max(total - paidNow, 0))
    : 0

  /** Uang yang benar-benar diterima saat invoice dibuat. */
  const receivedNow = isDeferred ? paidNow : Math.max(total - appliedDeposit, 0)

  /** Tanggal jatuh tempo dihitung dari termin, sama seperti di backend. */
  const dueDate = useMemo(() => {
    if (!isDeferred || !date) return null
    return addDays(date, Number(termDays) || 0)
  }, [date, termDays, isDeferred])

  function addItem() {
    setItems(current => [...current, emptyItem(Date.now())])
  }

  function removeItem(key: number) {
    setItems(current => (current.length === 1 ? current : current.filter(item => item.key !== key)))
  }

  function updateItem(key: number, patch: Partial<ItemDraft>) {
    setItems(current => current.map(item => (item.key === key ? { ...item, ...patch } : item)))
  }

  /** Produk yang dapat dijual: hanya yang punya pemetaan akun pendapatan. */
  const sellableProducts = useMemo(
    () => products.filter(product => product.revenue_account),
    [products],
  )

  /**
   * Akun penerima hanya wajib bila memang ada uang yang masuk.
   *
   * Invoice tunai yang seluruhnya tertutup saldo deposit tidak memindahkan
   * uang sama sekali, sehingga tidak perlu menunjuk rekening mana pun.
   */
  const needsCashAccount = receivedNow > 0

  /**
   * Sudah ada yang diketik dan belum tersimpan.
   *
   * Dipakai halaman untuk menahan kepergian. Tanggal tidak ikut dihitung
   * karena ia terisi sendiri sejak awal.
   */
  const isDirty =
    Boolean(customerId) ||
    Boolean(note) ||
    Boolean(downPayment) ||
    Boolean(taxAmount) ||
    items.some(item => item.productId || item.quantity || item.unitPrice)

  const isValid =
    Boolean(date) &&
    Boolean(customerId) &&
    (!needsCashAccount || Boolean(cashAccountId)) &&
    items.some(item => item.productId && toAmount(item.quantity) > 0 && toAmount(item.unitPrice) > 0)

  /** Menyusun isi permintaan sesuai kontrak API. */
  function toPayload(post: boolean): SalesInvoicePayload {
    return {
      date,
      customer_id: Number(customerId),
      settlement_method: settlement,
      cash_account_id: needsCashAccount ? Number(cashAccountId) : null,
      use_deposit: useDeposit,
      term_days: isDeferred ? Number(termDays) || 0 : null,
      due_date: isDeferred ? dueDate : null,
      tax_amount: taxAmount || '0',
      down_payment: isDeferred && downPayment ? downPayment : '0',
      note: note || null,
      items: items
        .filter(item => item.productId && toAmount(item.quantity) > 0)
        .map(item => ({
          product_id: Number(item.productId),
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      post,
    }
  }

  /** Mengisi termin bawaan customer saat customer dipilih. */
  function selectCustomer(value: string) {
    setCustomerId(value)
    const picked = customers.find(candidate => String(candidate.id) === value)
    if (picked) setTermDays(String(picked.payment_term_days))
  }

  return {
    date, setDate,
    customerId, selectCustomer, customer,
    settlement, setSettlement,
    useDeposit, setUseDeposit,
    cashAccountId, setCashAccountId,
    termDays, setTermDays,
    downPayment, setDownPayment,
    note, setNote,
    taxAmount, setTaxAmount,
    items, addItem, removeItem, updateItem,
    sellableProducts,
    isDeferred, needsCashAccount, dueDate,
    subtotal, total, paidNow, receivedNow,
    availableDeposit, appliedDeposit,
    receivable: Math.max(total - paidNow - appliedDeposit, 0),
    isDirty,
    isValid,
    toPayload,
  }
}

export type SaleInvoiceForm = ReturnType<typeof useSaleInvoiceForm>

/** Akun yang boleh menerima pembayaran: hanya akun Kas & Bank. */
export function cashAccounts(accounts: ApiAccount[]): ApiAccount[] {
  return accounts.filter(account => account.is_cash)
}
