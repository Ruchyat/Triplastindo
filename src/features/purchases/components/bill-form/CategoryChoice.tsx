import { Field, InfoNote, Select } from '@/components/common'
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
        <Select
          className="w-full"
          value={form.categoryValue}
          onChange={event => form.selectCategory(event.target.value)}
        >
          <option value="">Pilih kategori...</option>
          {form.categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
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
          <Select
            className="w-full"
            value={form.expenseAccountId}
            onChange={event => form.setExpenseAccountId(event.target.value)}
          >
            <option value="">Pilih akun...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </>
  )
}
