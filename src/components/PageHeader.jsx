export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="px-6 md:px-10 pt-8 pb-6">
      {eyebrow && (
        <div
          className="text-[11px] font-semibold tracking-wide mb-2"
          style={{ color: 'var(--bp-muted)' }}
        >
          {eyebrow}
        </div>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm" style={{ color: 'var(--bp-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}
