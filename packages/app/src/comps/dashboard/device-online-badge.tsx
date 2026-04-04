type DeviceOnlineBadgeProps = {
  isOnline: boolean | null | undefined
}

export function DeviceOnlineBadge({ isOnline }: DeviceOnlineBadgeProps) {
  if (isOnline) {
    return (
      <span className='inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-300'>
        在线
      </span>
    )
  }

  return (
    <span className='inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300'>
      离线
    </span>
  )
}
