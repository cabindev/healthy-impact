import type { Prisma } from '@prisma/client'
import { PROVINCE_ZONE } from './province-zone'

export type SurveyFilterParams = {
  q?: string | null
  zone?: string | null
  province?: string | null
  amphoe?: string | null
  tambon?: string | null
  village?: string | null
  /** เฉพาะรายการที่ยังไม่ระบุจังหวัด — ใช้ไล่เก็บข้อมูลเก่าที่บันทึกไว้ก่อนบังคับกรอกพื้นที่ */
  noArea?: boolean
}

// ใช้ร่วมกันระหว่างหน้ารายการแบบสอบถาม (SurveysPage) และ export excel เพื่อให้ export ตรงกับตัวกรองที่เห็นบนจอเสมอ
export function buildSurveyWhere(params: SurveyFilterParams): Prisma.SurveyWhereInput {
  const q = params.q?.trim() ?? ''
  const zone = params.zone?.trim() ?? ''
  const province = params.province?.trim() ?? ''
  const amphoe = params.amphoe?.trim() ?? ''
  const tambon = params.tambon?.trim() ?? ''
  const village = params.village?.trim() ?? ''

  const and: Prisma.SurveyWhereInput[] = []
  if (q) {
    and.push({
      OR: [
        { questionnaireNo: { contains: q } },
        { prefix: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { tambon: { contains: q } },
        { amphoe: { contains: q } },
        { province: { contains: q } },
        { collectorName: { contains: q } },
        { creator: { firstName: { contains: q } } },
        { creator: { lastName: { contains: q } } },
      ],
    })
  }
  if (zone) {
    const zoneProvinces = Object.entries(PROVINCE_ZONE).filter(([, z]) => z === zone).map(([p]) => p)
    and.push({ province: { in: zoneProvinces } })
  }
  if (province) and.push({ province })
  if (amphoe) and.push({ amphoe })
  if (tambon) and.push({ tambon })
  if (village) and.push({ villageName: village })
  if (params.noArea) and.push({ OR: [{ province: null }, { province: '' }] })

  return and.length ? { AND: and } : {}
}
