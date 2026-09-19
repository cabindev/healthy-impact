import { requireAdminPage } from '@/app/lib/auth'
import SurveyForm from './SurveyForm'

export default async function NewSurveyPage() {
  await requireAdminPage()
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">เพิ่มแบบสอบถาม</h1>
        <p className="text-sm text-gray-400 mt-0.5">แบบสอบถามผลกระทบด้านสุขภาวะ</p>
      </div>
      <SurveyForm />
    </div>
  )
}
