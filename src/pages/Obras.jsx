import { useEffect, useMemo, useState } from 'react'
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'
import ObraModal from '../components/ObraModal'

const ESTADOS = [
  { value: 'todas', label: 'Todas' },
  { value: 'activa', label: 'Activas' },
  { value: 'pausada', label: 'Pausadas' },
  { value: 'finalizada', label: 'Finalizadas' },
]

const ESTADO_STYLE = {
  activa: { background: '#e7f6ee', color: 'var(--bp-green)', label: 'Activa' },
  pausada: { background: '#fdf3e0', color: 'var(--bp-amber)', label: 'Pausada' },
  finalizada: { background: '#f1f2f4', color: 'var(--bp-muted)', label: 'Finalizada' },
}

export default function Obras() {
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState('todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('obras').select('*').order('created_at', { ascending: false })
    setObras(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => (estado === 'todas' ? obras : obras.filter((o) => o.estado === estado)),
    [obras, estado]
  )

  async function handleDelete(obra) {
    if (!confirm(`¿Eliminar la obra "${obra.nombre}"? Se quitarán sus asignaciones.`)) return
    await supabase.from('obras').delete().eq('id', obra.id)
    load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="OBRAS Y SERVICIOS"
        title="Obras"
        subtitle="Sitios de trabajo disponibles para asignar operarios."
        action={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} /> Nueva obra
          </button>
        }
      />

      <div className="px-6 md:px-10 pb-10">
        <div className="flex gap-2 mb-5 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setEstado(e.value)}
              className={`pill ${estado === e.value ? 'pill-active' : ''}`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--bp-muted)' }}>
            Cargando…
          </p>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-medium">Sin obras para mostrar</p>
            <p className="text-sm mt-1" style={{ color: 'var(--bp-muted)' }}>
              Creá una nueva obra con el botón de arriba.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((obra) => {
              const est = ESTADO_STYLE[obra.estado] || ESTADO_STYLE.activa
              return (
                <div key={obra.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: obra.color || 'var(--bp-red)' }}
                      />
                      <h3 className="font-semibold truncate">{obra.nombre}</h3>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                      style={{ background: est.background, color: est.color }}
                    >
                      {est.label}
                    </span>
                  </div>

                  {obra.cliente && (
                    <p className="text-sm" style={{ color: 'var(--bp-ink-soft)' }}>
                      {obra.cliente}
                    </p>
                  )}

                  {obra.ubicacion && (
                    <p
                      className="text-sm flex items-center gap-1.5"
                      style={{ color: 'var(--bp-muted)' }}
                    >
                      <MapPin size={14} /> {obra.ubicacion}
                    </p>
                  )}

                  <div className="flex justify-end gap-1 mt-1 pt-3" style={{ borderTop: '1px solid var(--bp-line)' }}>
                    <button
                      onClick={() => {
                        setEditing(obra)
                        setModalOpen(true)
                      }}
                      className="p-2 rounded-lg hover:bg-[#f5f6f8]"
                      style={{ color: 'var(--bp-ink-soft)' }}
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(obra)}
                      className="p-2 rounded-lg hover:bg-[#f5f6f8]"
                      style={{ color: 'var(--bp-red)' }}
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <ObraModal
          obra={editing}
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
