import { useMemo, useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabaseClient'
import { Search, Check } from 'lucide-react'

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

function datesBetween(startStr, endStr) {
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  const out = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toISO(d))
  }
  return out
}

const today = toISO(new Date())

export default function AsignacionModal({ obras, operarios, onClose, onSaved }) {
  const [obraId, setObraId] = useState(obras[0]?.id || '')
  const [mode, setMode] = useState('dia') // 'dia' | 'rango'
  const [fecha, setFecha] = useState(today)
  const [desde, setDesde] = useState(today)
  const [hasta, setHasta] = useState(today)
  const [seleccionados, setSeleccionados] = useState([])
  const [search, setSearch] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [conflicts, setConflicts] = useState([])

  const activos = useMemo(() => operarios.filter((o) => o.activo), [operarios])

  const filteredOperarios = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activos
    return activos.filter((o) => `${o.nombre} ${o.apellido}`.toLowerCase().includes(q))
  }, [activos, search])

  function toggleOperario(id) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setConflicts([])

    if (!obraId) {
      setError('Elegí una obra.')
      return
    }
    if (seleccionados.length === 0) {
      setError('Seleccioná al menos un operario.')
      return
    }
    if (mode === 'rango' && desde > hasta) {
      setError('La fecha "desde" no puede ser posterior a "hasta".')
      return
    }

    const fechas = mode === 'dia' ? [fecha] : datesBetween(desde, hasta)

    const rows = []
    for (const f of fechas) {
      for (const opId of seleccionados) {
        rows.push({ obra_id: obraId, operario_id: opId, fecha: f, nota: nota.trim() || null })
      }
    }

    setSaving(true)
    const results = await Promise.all(
      rows.map(async (row) => {
        const { error } = await supabase.from('asignaciones').insert(row)
        return { row, error }
      })
    )
    setSaving(false)

    const failed = results.filter((r) => r.error)
    if (failed.length > 0) {
      const byOperario = {}
      failed.forEach(({ row }) => {
        const op = operarios.find((o) => o.id === row.operario_id)
        const label = op ? `${op.nombre} ${op.apellido}` : 'Operario'
        byOperario[label] = byOperario[label] || []
        byOperario[label].push(row.fecha)
      })
      setConflicts(
        Object.entries(byOperario).map(([label, fechas]) => `${label}: ya asignado el ${fechas.join(', ')}`)
      )
    }

    const succeeded = results.length - failed.length
    if (succeeded > 0) {
      onSaved()
    }
    if (failed.length === 0) {
      onClose()
    }
  }

  return (
    <Modal
      title="Nueva asignación"
      subtitle="Elegí la obra, el o los operarios, y el día o rango de fechas."
      onClose={onClose}
      width={560}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Obra</span>
          <select className="input" value={obraId} onChange={(e) => setObraId(e.target.value)}>
            {obras.length === 0 && <option value="">No hay obras cargadas</option>}
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="block text-sm font-medium mb-1.5">¿Cuándo?</span>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMode('dia')}
              className={`pill ${mode === 'dia' ? 'pill-active' : ''}`}
            >
              Un día
            </button>
            <button
              type="button"
              onClick={() => setMode('rango')}
              className={`pill ${mode === 'rango' ? 'pill-active' : ''}`}
            >
              Rango de fechas
            </button>
          </div>

          {mode === 'dia' ? (
            <input
              type="date"
              className="input max-w-[200px]"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="input max-w-[200px]"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
              <span className="text-sm" style={{ color: 'var(--bp-muted)' }}>
                hasta
              </span>
              <input
                type="date"
                className="input max-w-[200px]"
                value={hasta}
                min={desde}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">Operarios</span>
            {seleccionados.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--bp-muted)' }}>
                {seleccionados.length} seleccionado{seleccionados.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="relative mb-2">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--bp-muted)' }}
            />
            <input
              className="input pl-9"
              placeholder="Buscar operario"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div
            className="max-h-48 overflow-y-auto rounded-lg"
            style={{ border: '1px solid var(--bp-line)' }}
          >
            {filteredOperarios.length === 0 ? (
              <p className="text-sm p-4 text-center" style={{ color: 'var(--bp-muted)' }}>
                No hay operarios activos que coincidan.
              </p>
            ) : (
              filteredOperarios.map((op) => {
                const checked = seleccionados.includes(op.id)
                return (
                  <button
                    type="button"
                    key={op.id}
                    onClick={() => toggleOperario(op.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f5f6f8]"
                    style={{ borderTop: '1px solid var(--bp-line)' }}
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        background: checked ? 'var(--bp-red)' : '#fff',
                        border: checked ? 'none' : '1px solid var(--bp-line)',
                      }}
                    >
                      {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                    </span>
                    <span className="text-sm font-medium">
                      {op.nombre} {op.apellido}
                    </span>
                    {op.puesto && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--bp-muted)' }}>
                        {op.puesto}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Nota (opcional)</span>
          <input
            className="input"
            placeholder="Turno mañana, traer EPP, etc."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </label>

        {error && <p className="text-sm" style={{ color: 'var(--bp-red)' }}>{error}</p>}

        {conflicts.length > 0 && (
          <div
            className="text-sm rounded-lg p-3"
            style={{ background: 'var(--bp-red-tint)', color: 'var(--bp-red-dark)' }}
          >
            <p className="font-medium mb-1">Algunas asignaciones no se pudieron crear:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {conflicts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Asignando…' : 'Asignar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
