import { Loader } from 'lucide-react'

export default function Loading({ text = 'กำลังโหลด...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader className="w-8 h-8 text-green-400 animate-spin" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}
