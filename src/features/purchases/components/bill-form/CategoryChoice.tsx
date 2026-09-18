import { Combobox, Field, InfoNote } from '@/components/common'
import type { ApiAccount } from '@/types'
import type { PurchaseBillForm } from './usePurchaseBillForm'

type Props = {
  form: PurchaseBillForm
  accounts: ApiAccount[]
}

/**
 * Pemilihan kategori pembelian beserta penjelasan akibatnya.
 *
 * Kategori menentukan akun mana yang didebit dan akun utang mana yang dipakai,
 * jadi akunnya ditampilkan sebelum tagihan disimpan — pencatat melihat ke mana
 * nilainya bermuara, bukan baru mengetahuinya setelah jurnal terbentuk.
 */
export function CategoryChoice({ form, accounts }: Props) {
  const category = form.category

  return (
    <>
      <Field label="Kategori Pembelian" required>
        <Combobox
          placeholder="Pilih kategori..."
          options={form.categoryOptions}
          value={form.categoryValue}
          onChange={form.selectCategory}
        />
      </Field>

      {category && (
        <InfoNote>
          <p>{category.hint}</p>
          <div className="mt-2 grid gap-1 border-t border-blue-200 pt-2 sm:grid-cols-2">
            <span>
              Didebit ke{' '}
              <b>{category.debit_account ?? 'akun yang Anda pilih di bawah'}</b>
            </span>
            {form.isDeferred && category.payable_account && (
              <span>
                Utangnya ke <b>{category.payable_account}</b>
              </span>
            )}
          </div>
        </InfoNote>
      )}

      {category?.needs_account_choice && (
        <Field label="Akun Beban" required>
          <Combobox
            placeholder="Pilih akun..."
            options={accounts.map(account => ({ value: String(account.id), label: account.label }))}
            value={form.expenseAccountId}
            onChange={form.setExpenseAccountId}
          />
        </Field>
      )}
    </>
  )
}
