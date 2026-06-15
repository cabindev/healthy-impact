import { useState } from 'react'
import tambonData from '@/app/data/tambon.json'

export type TambonEntry = { TAMBON_T: string; AMPHOE_T: string; CHANGWAT_T: string }

const tambons: TambonEntry[] = (tambonData as { data: TambonEntry[] }).data

export function useTambonSearch(initialSelected: TambonEntry | null = null) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<TambonEntry | null>(initialSelected)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = search.length >= 2
    ? tambons
        .filter(
          (t) =>
            t.TAMBON_T.includes(search) ||
            t.AMPHOE_T.includes(search) ||
            t.CHANGWAT_T.includes(search),
        )
        .slice(0, 10)
    : []

  function selectTambon(t: TambonEntry) {
    setSelected(t)
    setSearch('')
    setShowDropdown(false)
  }

  return { search, setSearch, selected, setSelected, showDropdown, setShowDropdown, filtered, selectTambon }
}
