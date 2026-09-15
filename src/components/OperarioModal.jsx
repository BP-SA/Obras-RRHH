import { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabaseClient'

const empty = { nombre: '', apellido: '', dni: '', telefono: '', puesto: '', activo: true }

export default function OperarioModal({ operario, onClose, onSaved }) {
  const isEdit = Boolean(operario)
  const [form, setForm] = useState(operario ? { ...empty, ...operario } : empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni?.trim() || null,
      telefono: form.telefono?.trim() || null,
      puesto: form.puesto?.trim() || null,
      activo: form.activo,
    }

    const query = isEdit
      ? supabase.from('operarios').update(payload).eq('id', operario.id)
      : supabase.from('operarios').insert(payload)

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
      title={isEdit ? 'Editar operario' : 'Nuevo operario'}
      subtitle={isEdit ? undefined : 'Se agregará a la lista de operarios disponibles para asignar.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Apellido" required>
            <input
              className="input"
              value={form.apellido}
              onChange={(e) => set('apellido', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="DNI">
            <input className="input" value={form.dni || ''} onChange={(e) => set('dni', e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <input
              className="input"
              value={form.telefono || ''}
              onChange={(e) => set('telefono', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Puesto">
          <input
            className="input"
            placeholder="Electricista, Ayudante, Supervisor…"
            value={form.puesto || ''}
            onChange={(e) => set('puesto', e.target.value)}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => set('activo', e.target.checked)}
            className="w-4 h-4 accent-[color:var(--bp-red)]"
          />
          Operario activo (disponible para asignar)
        </label>

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
