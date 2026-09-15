import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, subtitle, onClose, children, width = 480 }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(23,24,26,0.45)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
        style={{ maxWidth: width }}
      >
        <div
          className="flex items-start justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--bp-line)' }}
        >
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--bp-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f5f6f8]"
            style={{ color: 'var(--bp-muted)' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
