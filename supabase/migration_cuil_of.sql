-- ============================================================
-- Migración: si ya habías corrido el schema.sql original,
-- ejecutá esto en el SQL Editor de Supabase para actualizar tu base.
-- (Si recién estás arrancando el proyecto, no hace falta: usá
-- directamente supabase/schema.sql, que ya incluye estos campos.)
-- ============================================================

-- Renombra la columna dni -> cuil en operarios (conserva los datos existentes)
alter table operarios rename column dni to cuil;

-- Agrega el número de OF a obras
alter table obras add column if not exists numero_of text;
