-- ============================================================
-- Esquema Supabase: Obras & Servicios (BP Soluciones Eléctricas)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- OBRAS ----------
create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  numero_of text,
  cliente text,
  ubicacion text,
  estado text not null default 'activa' check (estado in ('activa','pausada','finalizada')),
  color text not null default '#E8452F',
  created_at timestamptz not null default now()
);

-- ---------- OPERARIOS ----------
create table if not exists operarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  cuil text,
  telefono text,
  puesto text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- ASIGNACIONES ----------
-- Un operario sólo puede estar en una obra por día (evita doble asignación).
create table if not exists asignaciones (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  operario_id uuid not null references operarios(id) on delete cascade,
  fecha date not null,
  nota text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (operario_id, fecha)
);

create index if not exists idx_asignaciones_fecha on asignaciones(fecha);
create index if not exists idx_asignaciones_obra on asignaciones(obra_id);
create index if not exists idx_asignaciones_operario on asignaciones(operario_id);

-- ---------- ROW LEVEL SECURITY ----------
-- Cualquier usuario autenticado (usuario/contraseña creado en Supabase Auth)
-- puede leer y escribir todo. Ajustar si más adelante se necesitan roles.
alter table obras enable row level security;
alter table operarios enable row level security;
alter table asignaciones enable row level security;

create policy "auth_full_access_obras" on obras
  for all to authenticated using (true) with check (true);

create policy "auth_full_access_operarios" on operarios
  for all to authenticated using (true) with check (true);

create policy "auth_full_access_asignaciones" on asignaciones
  for all to authenticated using (true) with check (true);

-- ---------- Datos de ejemplo (opcional, borrar si no se quiere) ----------
-- insert into obras (nombre, cliente, ubicacion) values
--   ('Planta Minera Bajo la Alumbrera', 'Minera Alumbrera', 'Catamarca'),
--   ('Tablero Industrial Ingenio', 'Ingenio Concepción', 'Tucumán');
