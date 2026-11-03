import * as XLSX from 'xlsx'

function hoyISO() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function exportarObras(obras) {
  const filas = obras.map((o) => ({
    Obra: o.nombre,
    'Número de OF': o.numero_of || '',
    Cliente: o.cliente || '',
    Ubicación: o.ubicacion || '',
    Estado: o.estado ? o.estado[0].toUpperCase() + o.estado.slice(1) : '',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 24 }, { wch: 20 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Obras')
  XLSX.writeFile(wb, `Obras_${hoyISO()}.xlsx`)
}

export function exportarOperarios(operarios) {
  const filas = operarios.map((o) => ({
    Nombre: o.nombre,
    Apellido: o.apellido,
    CUIL: o.cuil || '',
    Teléfono: o.telefono || '',
    Puesto: o.puesto || '',
    Estado: o.activo ? 'Activo' : 'Inactivo',
  }))
  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Operarios')
  XLSX.writeFile(wb, `Operarios_${hoyISO()}.xlsx`)
}