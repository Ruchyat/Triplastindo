import { Card, FilterBar, Select, TableWrap } from '@/components/common'
import { formatCurrency } from '@/lib'
import { fixedAssets } from '@/mocks/assets'

/** Daftar aset tetap beserta depresiasi bulanan dan nilai bukunya. */
export function AssetListTab() {
  return (
    <Card>
      <FilterBar>
        <Select>
          <option>Semua Jenis</option>
        </Select>
        <Select>
          <option>Aktif</option>
        </Select>
      </FilterBar>

      <TableWrap>
        <thead>
          <tr>
            <th>Kode</th>
            <th>Aset</th>
            <th>Jenis</th>
            <th>Tgl Beli</th>
            <th className="text-right">Nilai</th>
            <th className="text-right">Umur</th>
            <th className="text-right">Depresiasi/Bulan</th>
            <th className="text-right">Nilai Buku</th>
          </tr>
        </thead>
        <tbody>
          {fixedAssets.map(asset => (
            <tr key={asset.code}>
              <td className="font-semibold text-blue-700">{asset.code}</td>
              <td className="font-semibold">{asset.name}</td>
              <td>{asset.type}</td>
              <td>{asset.purchaseDate}</td>
              <td className="money">{formatCurrency(asset.value)}</td>
              <td className="money">{asset.usefulLifeYears} thn</td>
              <td className="money">{formatCurrency(asset.monthlyDepreciation)}</td>
              <td className="money">{formatCurrency(asset.bookValue)}</td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  )
}
