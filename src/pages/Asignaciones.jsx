import { useEffect, useMemo, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, CalendarDays, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'
import AsignacionModal from '../components/AsignacionModal'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function monthRange(year, monthIndex) {
  const start = `${year}-${pad(monthIndex + 1)}-01`
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const end = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`
  return { start, end }
}

function formatFecha(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const ASIGNACION_SELECT =
  'id, fecha, nota, obra:obras(id,nombre,color,numero_of,cliente,ubicacion,estado), operario:operarios(id,nombre,apellido,cuil,telefono,puesto,activo)'

export default function Asignaciones() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [dateMode, setDateMode] = useState('mes') // 'mes' | 'rango'
  const [rangoDesde, setRangoDesde] = useState(todayISO())
  const [rangoHasta, setRangoHasta] = useState(todayISO())
  const [obraFilter, setObraFilter] = useState('todas')
  const [operarioFilter, setOperarioFilter] = useState('todos')

  const [obras, setObras] = useState([])
  const [operarios, setOperarios] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function loadStatic() {
    const [{ data: obrasData }, { data: operariosData }] = await Promise.all([
      supabase.from('obras').select('*').order('nombre'),
      supabase.from('operarios').select('*').order('apellido'),
    ])
    setObras(obrasData || [])
    setOperarios(operariosData || [])
  }

  async function loadAsignaciones() {
    setLoading(true)
    const { start, end } =
      dateMode === 'mes' ? monthRange(year, monthIndex) : { start: rangoDesde, end: rangoHasta }

    const { data } = await supabase
      .from('asignaciones')
      .select(ASIGNACION_SELECT)
      .gte('fecha', start)
      .lte('fecha', end)
      .order('fecha', { ascending: true })
    setAsignaciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadStatic()
  }, [])

  useEffect(() => {
    loadAsignaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, monthIndex, dateMode, rangoDesde, rangoHasta])

  const grupos = useMemo(() => {
    const map = new Map()
    for (const a of asignaciones) {
      if (!a.obra || !a.operario) continue
      if (obraFilter !== 'todas' && a.obra.id !== obraFilter) continue
      if (operarioFilter !== 'todos' && a.operario.id !== operarioFilter) continue
      const key = `${a.fecha}__${a.obra.id}`
      if (!map.has(key)) {
        map.set(key, { fecha: a.fecha, obra: a.obra, items: [] })
      }
      map.get(key).items.push(a)
    }
    return Array.from(map.values()).sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
  }, [asignaciones, obraFilter, operarioFilter])

  function shiftMonth(delta) {
    let m = monthIndex + delta
    let y = year
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setMonthIndex(m)
    setYear(y)
  }

  function handleHoy() {
    const hoy = todayISO()
    setDateMode('rango')
    setRangoDesde(hoy)
    setRangoHasta(hoy)
  }

  async function removeItem(id) {
    await supabase.from('asignaciones').delete().eq('id', id)
    loadAsignaciones()
  }

  async function removeGroup(items) {
    if (!confirm(`¿Quitar la asignación completa (${items.length} operario${items.length > 1 ? 's' : ''})?`)) return
    await supabase.from('asignaciones').delete().in('id', items.map((i) => i.id))
    loadAsignaciones()
  }

  async function handleExport() {
    setExporting(true)
    try {
      // Exporta exactamente lo que está filtrado en pantalla: la fecha
      // (mes o rango), la obra y el operario seleccionados.
      const filasFiltradas = asignaciones.filter((a) => {
        if (!a.obra || !a.operario) return false
        if (obraFilter !== 'todas' && a.obra.id !== obraFilter) return false
        if (operarioFilter !== 'todos' && a.operario.id !== operarioFilter) return false
        return true
      })

      if (filasFiltradas.length === 0) {
        alert('No hay asignaciones para exportar con el filtro actual.')
        return
      }

      const filas = filasFiltradas
        .map((a) => ({
          Fecha: formatFecha(a.fecha),
          Obra: a.obra.nombre,
          Operario: `${a.operario.nombre} ${a.operario.apellido}`,
          CUIL: a.operario.cuil || '',
          Nota: a.nota || '',
        }))
        .sort((a, b) => {
          if (a.Fecha === b.Fecha) return a.Obra.localeCompare(b.Obra)
          const [d1, m1, y1] = a.Fecha.split('/')
          const [d2, m2, y2] = b.Fecha.split('/')
          return `${y1}${m1}${d1}`.localeCompare(`${y2}${m2}${d2}`)
        })

      const obrasEnVista = new Map()
      const operariosEnVista = new Map()
      filasFiltradas.forEach((a) => {
        obrasEnVista.set(a.obra.id, a.obra)
        operariosEnVista.set(a.operario.id, a.operario)
      })

      const wb = XLSX.utils.book_new()

      const wsAsignaciones = XLSX.utils.json_to_sheet(filas)
      wsAsignaciones['!cols'] = [{ wch: 11 }, { wch: 30 }, { wch: 24 }, { wch: 16 }, { wch: 28 }]
      XLSX.utils.book_append_sheet(wb, wsAsignaciones, 'Planificación')

      const wsObras = XLSX.utils.json_to_sheet(
        Array.from(obrasEnVista.values()).map((o) => ({
          Obra: o.nombre,
          'Número de OF': o.numero_of || '',
          Cliente: o.cliente || '',
          Ubicación: o.ubicacion || '',
          Estado: o.estado,
        }))
      )
      wsObras['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsObras, 'Obras')

      const wsOperarios = XLSX.utils.json_to_sheet(
        Array.from(operariosEnVista.values()).map((op) => ({
          Nombre: op.nombre,
          Apellido: op.apellido,
          CUIL: op.cuil || '',
          Teléfono: op.telefono || '',
          Puesto: op.puesto || '',
          Estado: op.activo ? 'Activo' : 'Inactivo',
        }))
      )
      wsOperarios['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, wsOperarios, 'Operarios')

      const obraLabel =
        obraFilter === 'todas' ? 'TodasLasObras' : (obras.find((o) => o.id === obraFilter)?.nombre || 'Obra').replace(/[^a-zA-Z0-9]+/g, '_')
      const fechaLabel =
        dateMode === 'mes' ? `${MESES[monthIndex]}_${year}` : `${rangoDesde}_a_${rangoHasta}`
      const nombreArchivo = `Planificacion_${fechaLabel}_${obraLabel}.xlsx`
      XLSX.writeFile(wb, nombreArchivo)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="OBRAS Y SERVICIOS"
        title="Asignaciones"
        subtitle="Quién está trabajando, en qué obra y qué día."
        action={
          <button className="btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nueva asignación
          </button>
        }
      />

      <div className="px-6 md:px-10 pb-10">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-1 rounded-lg p-1"
                style={{ border: '1px solid var(--bp-line)' }}
              >
                <button
                  onClick={() => setDateMode('mes')}
                  className={`pill ${dateMode === 'mes' ? 'pill-active' : ''}`}
                  style={{ border: 'none' }}
                >
                  Mes
                </button>
                <button
                  onClick={() => setDateMode('rango')}
                  className={`pill ${dateMode === 'rango' ? 'pill-active' : ''}`}
                  style={{ border: 'none' }}
                >
                  Rango de fechas
                </button>
              </div>

              {dateMode === 'mes' ? (
                <div
                  className="flex items-center gap-1 rounded-lg p-1"
                  style={{ border: '1px solid var(--bp-line)' }}
                >
                  <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-md hover:bg-[#f5f6f8]">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold px-2 min-w-[150px] text-center flex items-center justify-center gap-1.5">
                    <CalendarDays size={14} style={{ color: 'var(--bp-muted)' }} />
                    {MESES[monthIndex]} {year}
                  </span>
                  <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-md hover:bg-[#f5f6f8]">
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="input"
                    style={{ width: 150 }}
                    value={rangoDesde}
                    onChange={(e) => setRangoDesde(e.target.value)}
                  />
                  <span className="text-sm" style={{ color: 'var(--bp-muted)' }}>
                    hasta
                  </span>
                  <input
                    type="date"
                    className="input"
                    style={{ width: 150 }}
                    value={rangoHasta}
                    min={rangoDesde}
                    onChange={(e) => setRangoHasta(e.target.value)}
                  />
                </div>
              )}

              <button className="pill" onClick={handleHoy}>
                Hoy
              </button>
            </div>

            <button
              className="btn-secondary flex items-center gap-2"
              onClick={handleExport}
              disabled={exporting}
              title="Exporta lo que ves: la fecha, obra y operario filtrados"
            >
              <Download size={15} />
              {exporting ? 'Exportando…' : 'Exportar Excel'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setObraFilter('todas')}
                className={`pill ${obraFilter === 'todas' ? 'pill-active' : ''}`}
              >
                Todas las obras
              </button>
              {obras.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setObraFilter(o.id)}
                  className={`pill ${obraFilter === o.id ? 'pill-active' : ''}`}
                >
                  {o.nombre}
                </button>
              ))}
            </div>

            <select
              className="input"
              style={{ width: 220, marginLeft: 'auto' }}
              value={operarioFilter}
              onChange={(e) => setOperarioFilter(e.target.value)}
            >
              <option value="todos">Todos los operarios</option>
              {operarios.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre} {op.apellido}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--bp-muted)' }}>
              Cargando…
            </p>
          ) : grupos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">Sin asignaciones para este filtro</p>
              <p className="text-sm mt-1" style={{ color: 'var(--bp-muted)' }}>
                Usá "Nueva asignación" para asignar operarios a una obra.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--bp-muted)' }}
                  >
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Obra</th>
                    <th className="py-2 pr-4">Operarios asignados</th>
                    <th className="py-2 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((g) => (
                    <tr key={`${g.fecha}-${g.obra.id}`} style={{ borderTop: '1px solid var(--bp-line)' }}>
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">{formatFecha(g.fecha)}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: g.obra.color || 'var(--bp-red)' }}
                          />
                          {g.obra.nombre}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          {g.items.map((it) => (
                            <span
                              key={it.id}
                              className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full"
                              style={{ background: '#f1f2f4', color: 'var(--bp-ink-soft)' }}
                            >
                              {it.operario.nombre} {it.operario.apellido}
                              <button
                                onClick={() => removeItem(it.id)}
                                className="p-0.5 rounded-full hover:bg-white/70"
                                title="Quitar"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => removeGroup(g.items)}
                          className="text-xs font-semibold"
                          style={{ color: 'var(--bp-red)' }}
                        >
                          Quitar todo
                        </button>
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
        <AsignacionModal
          obras={obras}
          operarios={operarios}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            loadAsignaciones()
          }}
        />
      )}
    </div>
  )
}
