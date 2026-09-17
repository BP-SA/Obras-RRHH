import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabaseClient'

const empty = { nombre: '', numero_of: '', cliente: '', ubicacion: '', estado: 'activa', color: '#E8452F' }

const COLORS = ['#E8452F', '#2563EB', '#1F9254', '#B8860B', '#7C3AED', '#0891B2']

export default function ObraModal({ obra, onClose, onSaved }) {
  const isEdit = Boolean(obra)
  const [form, setForm] = useState(obra ? { ...empty, ...obra } : empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre de la obra es obligatorio.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      nombre: form.nombre.trim(),
      numero_of: form.numero_of?.trim() || null,
      cliente: form.cliente?.trim() || null,
      ubicacion: form.ubicacion?.trim() || null,
      estado: form.estado,
      color: form.color,
    }

    const query = isEdit
      ? supabase.from('obras').update(payload).eq('id', obra.id)
      : supabase.from('obras').insert(payload)

    const { error } = await query
    setSaving(false)

    if (error) {
      setError('No se pudo guardar. Intentá de nuevo.')
      return
    }
    onSaved()
  }

  return (
    <Modal
      title={isEdit ? 'Editar obra' : 'Nueva obra'}
      subtitle={isEdit ? undefined : 'Quedará disponible para asignar operarios.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre de la obra" required>
          <input
            className="input"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej: Tablero industrial Ingenio Concepción"
            autoFocus
          />
        </Field>

        <Field label="Número de OF">
          <input
            className="input"
            value={form.numero_of || ''}
            onChange={(e) => set('numero_of', e.target.value)}
            placeholder="Ej: OF-4521"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cliente">
            <input
              className="input"
              value={form.cliente || ''}
              onChange={(e) => set('cliente', e.target.value)}
            />
          </Field>
          <Field label="Ubicación">
            <input
              className="input"
              value={form.ubicacion || ''}
              onChange={(e) => set('ubicacion', e.target.value)}
              placeholder="Tucumán, Salta…"
            />
          </Field>
        </div>

        <Field label="Estado">
          <select className="input" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </Field>

        <Field label="Color identificador">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => set('color', c)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: c,
                  outline: form.color === c ? '2px solid var(--bp-ink)' : 'none',
                  outlineOffset: 2,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        {error && <p className="text-sm" style={{ color: 'var(--bp-red)' }}>{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label} {required && <span style={{ color: 'var(--bp-red)' }}>*</span>}
      </span>
      {children}
    </label>
  )
}
