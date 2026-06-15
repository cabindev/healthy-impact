import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { type SurveyPayload } from '@/app/actions/survey'
import SurveyForm from '../../new/SurveyForm'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

const dateInput = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : undefined)
const decStr = (v: unknown) => (v === null || v === undefined ? undefined : Number(v).toString())
const intStr = (v: number | null | undefined) => (v === null || v === undefined ? undefined : String(v))
const arr = (s?: string | null): string[] => {
  if (!s) return []
  try { const a = JSON.parse(s); return Array.isArray(a) ? a : [] } catch { return [] }
}

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const surveyId = Number(id)
  if (!Number.isInteger(surveyId)) notFound()

  const s = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { tobacco: true, alcohol: true },
  })
  if (!s) notFound()

  const t = s.tobacco
  const a = s.alcohol

  const initial: SurveyPayload = {
    questionnaireNo: s.questionnaireNo ?? undefined,
    collectorName: s.collectorName ?? undefined,
    collectorPhone: s.collectorPhone ?? undefined,
    collectedAt: dateInput(s.collectedAt),
    verifierName: s.verifierName ?? undefined,
    verifierPhone: s.verifierPhone ?? undefined,
    verifiedAt: dateInput(s.verifiedAt),
    siteType: s.siteType,

    villageNo: s.villageNo ?? undefined,
    villageName: s.villageName ?? undefined,
    province: s.province ?? undefined,
    amphoe: s.amphoe ?? undefined,
    tambon: s.tambon ?? undefined,
    residence6Months: s.residence6Months === true ? '2' : s.residence6Months === false ? '1' : undefined,
    consentGiven: s.consentGiven ? '1' : '2',
    nationalId: s.nationalId ?? undefined,
    prefix: s.prefix ?? undefined,
    firstName: s.firstName ?? undefined,
    lastName: s.lastName ?? undefined,
    phone: s.phone ?? undefined,
    gender: s.gender ?? undefined,
    genderOther: s.genderOther ?? undefined,
    birthDate: s.birthDate ?? undefined,
    religion: s.religion ?? undefined,
    religionOther: s.religionOther ?? undefined,
    rights: arr(s.rights),
    weightKg: decStr(s.weightKg),
    heightCm: decStr(s.heightCm),
    waistCm: decStr(s.waistCm),
    diseases: arr(s.diseases),
    diseaseOther: s.diseaseOther ?? undefined,
    eduStatus: s.eduStatus ?? undefined,
    eduLevel: s.eduLevel ?? undefined,

    homeSmoking: t?.homeSmoking ?? undefined,
    smokeStatus: t?.smokeStatus ?? undefined,
    firstCigTime: t?.firstCigTime ?? undefined,
    quitAttempt: t?.quitAttempt ?? undefined,

    q1Frequency: intStr(a?.q1Frequency),
    beerDrink: a?.beerDrink ?? false,
    beerAmt: intStr(a?.beerAmt),
    liquorDrink: a?.liquorDrink ?? false,
    liquorAmt: intStr(a?.liquorAmt),
    wineDrink: a?.wineDrink ?? false,
    wineAmt: intStr(a?.wineAmt),
    q3Binge: intStr(a?.q3Binge),
    q4CannotStop: intStr(a?.q4CannotStop),
    q5FailNormal: intStr(a?.q5FailNormal),
    q6Morning: intStr(a?.q6Morning),
    q7Guilt: intStr(a?.q7Guilt),
    q8Blackout: intStr(a?.q8Blackout),
    q9Injury: intStr(a?.q9Injury),
    q10Advised: intStr(a?.q10Advised),

    ddDroveAfterDrink: s.ddDroveAfterDrink ?? undefined,
    ddInjured: s.ddInjured ?? undefined,
  }

  const initialEver: Record<string, boolean> = {
    Factory: !!t?.everFactory, Rolled: !!t?.everRolled, Ecig: !!t?.everEcig, Smokeless: !!t?.everSmokeless, Other: !!t?.everOther,
  }
  const initialCur: Record<string, boolean> = {
    Factory: !!t?.curFactory, Rolled: !!t?.curRolled, Ecig: !!t?.curEcig, Smokeless: !!t?.curSmokeless, Other: !!t?.curOther,
  }
  const initialCurAmt: Record<string, string> = {
    Factory: intStr(t?.curFactoryAmt) ?? '', Rolled: intStr(t?.curRolledAmt) ?? '', Ecig: intStr(t?.curEcigAmt) ?? '',
    Smokeless: intStr(t?.curSmokelessAmt) ?? '', Other: intStr(t?.curOtherAmt) ?? '',
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/dashboard/surveys/${s.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-1">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">แก้ไขแบบสอบถาม</h1>
        <p className="text-sm text-gray-400 mt-0.5">{s.questionnaireNo || `#${s.id}`}</p>
      </div>
      <SurveyForm
        surveyId={s.id}
        initial={initial}
        initialEver={initialEver}
        initialCur={initialCur}
        initialCurAmt={initialCurAmt}
      />
    </div>
  )
}
