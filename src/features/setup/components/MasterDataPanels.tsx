import { Card, CardHeader, Status, TableWrap } from '@/components/common'
import { Button } from '@/components/ui/Button'
import {
  assetTypeMasters,
  chartOfAccounts,
  customerMasters,
  employeeMasters,
  productMasters,
  shareholderMasters,
  supplierMasters,
} from '@/mocks/setup'

/** Chart of Accounts — akun yang sudah dipakai jurnal hanya bisa dinonaktifkan. */
export function ChartOfAccountsPanel() {
  return (
    <Card>
      <CardHeader
        title="Chart of Accounts"
        description="Daftar akun yang digunakan dalam pencatatan"
        action={
          <div className="flex gap-2">
            <Button variant="outline">Muat COA Default</Button>
            <Button>Tambah Akun</Button>
          </div>
        }
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Akun</th>
            <th>Kategori</th>
            <th>Saldo Normal</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {chartOfAccounts.map(account => (
            <tr key={account.code}>
              <td className="font-semibold text-blue-700">{account.code}</td>
              <td className="font-semibold">{account.name}</td>
              <td>{account.category}</td>
              <td>{account.normalBalance}</td>
              <td>
                <Status tone={account.active ? 'green' : 'slate'}>
                  {account.active ? 'Aktif' : 'Nonaktif'}
                </Status>
              </td>
              <td>
                <button className="font-semibold text-blue-700">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

export function CustomerMasterPanel() {
  return (
    <Card>
      <CardHeader
        title="Master Customer"
        description="Digunakan pada invoice penjualan dan piutang"
        action={<Button>Tambah Customer</Button>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Customer</th>
            <th>Kontak</th>
            <th>Termin</th>
            <th>Batas Kredit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customerMasters.map(customer => (
            <tr key={customer.code}>
              <td className="font-semibold text-blue-700">{customer.code}</td>
              <td className="font-semibold">{customer.name}</td>
              <td>{customer.contact}</td>
              <td>{customer.term}</td>
              <td>{customer.creditLimit}</td>
              <td>
                <Status tone="green">Aktif</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

export function SupplierMasterPanel() {
  return (
    <Card>
      <CardHeader
        title="Master Supplier"
        description="Digunakan pada pembelian dan utang"
        action={<Button>Tambah Supplier</Button>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Supplier</th>
            <th>Kategori</th>
            <th>Kontak</th>
            <th>Termin</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {supplierMasters.map(supplier => (
            <tr key={supplier.code}>
              <td className="font-semibold text-blue-700">{supplier.code}</td>
              <td className="font-semibold">{supplier.name}</td>
              <td>{supplier.category}</td>
              <td>{supplier.contact}</td>
              <td>{supplier.term}</td>
              <td>
                <Status tone="green">Aktif</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

/** Item transaksi dipetakan ke akun akuntansi agar jurnal dapat dibuat otomatis. */
export function ProductMasterPanel() {
  return (
    <Card>
      <CardHeader
        title="Produk & Item"
        description="Pemetaan item transaksi ke akun akuntansi"
        action={<Button>Tambah Item</Button>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Item</th>
            <th>Kategori</th>
            <th>Satuan</th>
            <th>Akun</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {productMasters.map(product => (
            <tr key={product.code}>
              <td className="font-semibold text-blue-700">{product.code}</td>
              <td className="font-semibold">{product.name}</td>
              <td>{product.category}</td>
              <td>{product.unit}</td>
              <td>{product.account}</td>
              <td>
                <Status tone="green">Aktif</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

export function AssetTypeMasterPanel() {
  return (
    <Card>
      <CardHeader
        title="Master Jenis Aset"
        description="Pemetaan aset dan akun depresiasi"
        action={<Button>Tambah Jenis</Button>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama</th>
            <th>Jenis</th>
            <th>Umur Default</th>
            <th>Akun Akumulasi</th>
          </tr>
        </thead>
        <tbody>
          {assetTypeMasters.map(assetType => (
            <tr key={assetType.code}>
              <td className="font-semibold text-blue-700">{assetType.code}</td>
              <td className="font-semibold">{assetType.name}</td>
              <td>{assetType.type}</td>
              <td>{assetType.defaultLife}</td>
              <td>{assetType.accumulationAccount}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

/** Departemen dan posisi wajib terisi agar Slip Gaji tidak menampilkan data kosong. */
export function EmployeeMasterPanel() {
  return (
    <Card>
      <CardHeader
        title="Master Karyawan"
        description="Data karyawan aktif Triplastindo"
        action={<Button>Tambah Karyawan</Button>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>NIK</th>
            <th>Nama</th>
            <th>Departemen</th>
            <th>Posisi</th>
            <th>Status</th>
            <th>Aktif</th>
          </tr>
        </thead>
        <tbody>
          {employeeMasters.map(employee => (
            <tr key={employee.employeeId}>
              <td className="font-semibold text-blue-700">{employee.employeeId}</td>
              <td className="font-semibold">{employee.name}</td>
              <td>{employee.department}</td>
              <td>{employee.position}</td>
              <td>{employee.employmentStatus}</td>
              <td>
                <Status tone="green">Aktif</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}

export function ShareholderMasterPanel() {
  return (
    <Card>
      <CardHeader
        title="Pemegang Saham"
        description="Komposisi kepemilikan 3.600.000 lembar saham"
        action={<Button>Tambah Pemegang Saham</Button>}
      />
      <TableWrap>
        <thead>
          <tr>
            <th>Nama</th>
            <th className="text-right">Jumlah Saham</th>
            <th className="text-right">Persentase</th>
          </tr>
        </thead>
        <tbody>
          {shareholderMasters.map(shareholder => (
            <tr key={shareholder.name}>
              <td className="font-semibold">{shareholder.name}</td>
              <td className="money">{shareholder.shares}</td>
              <td className="money">{shareholder.percentage}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}
