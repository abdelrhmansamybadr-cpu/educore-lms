import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SchoolEntry {
  id: string
  name: string
  nameAr: string
  curriculumType: string
  logo?: string | null
}

interface SchoolContextState {
  /** null = "All Schools" org-level view */
  selectedSchoolId: string | null
  schools: SchoolEntry[]
  setSelectedSchool: (id: string | null) => void
  setSchools: (schools: SchoolEntry[]) => void
  currentSchool: () => SchoolEntry | null
}

export const useSchoolContext = create<SchoolContextState>()(
  persist(
    (set, get) => ({
      selectedSchoolId: null,
      schools: [],
      setSelectedSchool: (id) => set({ selectedSchoolId: id }),
      setSchools: (schools) => set({ schools }),
      currentSchool: () => {
        const { selectedSchoolId, schools } = get()
        if (!selectedSchoolId) return null
        return schools.find((s) => s.id === selectedSchoolId) ?? null
      },
    }),
    { name: 'educore-school-context' },
  ),
)
