type Props = {
  value: number // 0..100
  label?: string
}

export default function ProgressBar({ value, label }: Props) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      {label ? <div className="mb-1 text-xs text-slate-600">{label}</div> : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-[width]"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  )
}

