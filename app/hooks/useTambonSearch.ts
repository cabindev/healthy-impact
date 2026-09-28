import { useState } from 'react'
import tambonData from '@/app/data/tambon.json'

export type TambonEntry = { TAMBON_T: string; AMPHOE_T: string; CHANGWAT_T: string }

const tambons: TambonEntry[] = (tambonData as { data: TambonEntry[] }).data

const MAX_RESULTS = 50

// แยกคำด้วยช่องว่าง ทุกคำต้องเจอในตำบล/อำเภอ/จังหวัด — ชื่อซ้ำเยอะ (เช่น "หนองบัว" มี 27 ตำบล)
// จึงพิมพ์ "หนองบัว ศีขรภูมิ" หรือ "หนองบัว สุรินทร์" เพื่อแคบลงได้; ตัดคำนำหน้า ต./อ./จ. ทิ้ง
function searchTambons(query: string): TambonEntry[] {
  const tokens = query
    .split(/\s+/)
    .map((w) => w.replace(/^(ตำบล|อำเภอ|จังหวัด|ต\.|อ\.|จ\.)/, ''))
    .filter(Boolean)
  if (tokens.length === 0) return []

  const rank = (t: TambonEntry) =>
    t.TAMBON_T === tokens[0] ? 0 : t.TAMBON_T.startsWith(tokens[0]) ? 1 : t.TAMBON_T.includes(tokens[0]) ? 2 : 3

  return tambons
    .filter((t) => tokens.every((w) => t.TAMBON_T.includes(w) || t.AMPHOE_T.includes(w) || t.CHANGWAT_T.includes(w)))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, MAX_RESULTS)
}

export function useTambonSearch(initialSelected: TambonEntry | null = null) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<TambonEntry | null>(initialSelected)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = search.trim().length >= 2 ? searchTambons(search) : []

  function selectTambon(t: TambonEntry) {
    setSelected(t)
    setSearch('')
    setShowDropdown(false)
  }

  return { search, setSearch, selected, setSelected, showDropdown, setShowDropdown, filtered, selectTambon }
}
