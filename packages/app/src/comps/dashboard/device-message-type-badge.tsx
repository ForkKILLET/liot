type DeviceMessageType = 'report' | 'request' | 'response' | 'set' | 'action'

export function DeviceMessageTypeBadge({
  type,
}: {
  type?: DeviceMessageType | string
}) {
  const typeColors: Record<string, string> = {
    report: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50',
    request: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50',
    response: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50',
    set: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-900/50',
    action: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-900/50',
  }

  const color = typeColors[type || 'report'] || typeColors.report

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {type || '-'}
    </span>
  )
}
