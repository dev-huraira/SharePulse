export default function OtpBadge({ otp }: { otp: string }) {
  const digits = otp.replace(/\D/g, '').slice(0, 6).padEnd(6, '•').split('')
  return (
    <div className="sp-glass sp-otp-glow flex w-full items-center justify-center overflow-hidden rounded-xl px-2 py-3 sm:px-3 sm:py-4">
      <div className="flex w-full flex-nowrap items-center justify-center gap-2 sm:gap-3">
        {digits.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="font-mono text-[clamp(1.65rem,2.2vw,2.65rem)] font-semibold leading-none text-slate-900"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}

