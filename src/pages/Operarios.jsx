import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Phone } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'
import OperarioModal from '../components/OperarioModal'

export default function Operarios() {
  const [operarios, setOperarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('operarios')
      .select('*')
      .order('apellido', { ascending: true })
    setOperarios(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return operarios
    return operarios.filter((o) =>
      `${o.nombre} ${o.apellido} ${o.cuil || ''} ${o.puesto || ''}`.toLowerCase().includes(q)
    )
  }, [operarios, search])

  async function handleDelete(op) {
    if (!confirm(`¿Eliminar a ${op.nombre} ${op.apellido}? Se quitarán sus asignaciones.`)) return
    await supabase.from('operarios').delete().eq('id', op.id)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="OBRAS Y SERVICIOS"
        title="Operarios"
        subtitle="Personal disponible para asignar a obras."
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} /> Nuevo operario
          </button>
        }
      />

      <div className="px-6 md:px-10 pb-10">
        <div className="card p-5">
          <div className="relative w-full max-w-xs mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--bp-muted)' }}
            />
            <input
              className="input pl-9"
              placeholder="Buscar por nombre, CUIL o puesto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--bp-muted)' }}>
              Cargando…
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState hasQuery={Boolean(search)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--bp-muted)' }}
                  >
                    <th className="py-2 pr-4">Operario</th>
                    <th className="py-2 pr-4">Puesto</th>
                    <th className="py-2 pr-4">CUIL</th>
                    <th className="py-2 pr-4">Teléfono</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((op) => (
                    <tr key={op.id} style={{ borderTop: '1px solid var(--bp-line)' }}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{ background: 'var(--bp-red-tint)', color: 'var(--bp-red)' }}
                          >
                            {op.nombre[0]}
                            {op.apellido[0]}
                          </div>
                          <span className="font-medium">
                            {op.nombre} {op.apellido}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4" style={{ color: 'var(--bp-ink-soft)' }}>
                        {op.puesto || '—'}
                      </td>
                      <td className="py-3 pr-4" style={{ color: 'var(--bp-ink-soft)' }}>
                        {op.cuil || '—'}
                      </td>
                      <td className="py-3 pr-4" style={{ color: 'var(--bp-ink-soft)' }}>
                        {op.telefono ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={13} /> {op.telefono}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={
                            op.activo
                              ? { background: '#e7f6ee', color: 'var(--bp-green)' }
                              : { background: '#f1f2f4', color: 'var(--bp-muted)' }
                          }
                        >
                          {op.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditing(op)
                              setModalOpen(true)
                            }}
                            className="p-2 rounded-lg hover:bg-[#f5f6f8]"
                            style={{ color: 'var(--bp-ink-soft)' }}
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(op)}
                            className="p-2 rounded-lg hover:bg-[#f5f6f8]"
                            style={{ color: 'var(--bp-red)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <OperarioModal
          operario={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ hasQuery }) {
  return (
    <div className="py-12 text-center">
      <p className="font-medium">{hasQuery ? 'Sin resultados' : 'Todavía no hay operarios'}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--bp-muted)' }}>
        {hasQuery
          ? 'Probá con otro nombre, CUIL o puesto.'
          : 'Agregá el primero con el botón "Nuevo operario".'}
      </p>
    </div>
  )
}
