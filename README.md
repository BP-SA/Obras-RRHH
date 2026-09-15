# Obras & Servicios — BP Soluciones Eléctricas

Web interna para asignar operarios a obras por día o por rango de fechas,
compartida entre el área de Obras y Servicios y RRHH.

Stack: **React + Vite + Tailwind CSS**, **Supabase** (autenticación y base de
datos), desplegado en **Cloudflare Pages**.

## Funcionalidad

- Login con usuario y contraseña (Supabase Auth).
- **Obras**: alta, edición y baja (nombre, cliente, ubicación, estado, color).
- **Operarios**: alta, edición y baja (nombre, apellido, DNI, teléfono, puesto, activo/inactivo).
- **Asignaciones**: elegir una obra, uno o más operarios, y un día puntual o
  un rango de fechas. Vista mensual filtrable por obra, con opción de quitar
  operarios individualmente o la asignación completa.
- **Exportar a Excel**: desde Asignaciones, el botón "Exportar Excel" exporta
  exactamente lo que está filtrado en pantalla (el mes y, si elegiste una
  obra puntual, sólo esa obra), en tres hojas: **Planificación** (fecha,
  obra, operario, nota), **Obras** y **Operarios** — ambas limitadas a las
  que aparecen en esa vista. Se genera en el navegador, sin pasar por ningún
  servidor.
- Regla de negocio: un operario no puede estar asignado a dos obras el mismo
  día (restricción `unique(operario_id, fecha)` en la base).

## 1. Crear el proyecto en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Andá a **SQL Editor** y ejecutá el contenido de `supabase/schema.sql`
   (crea las tablas `obras`, `operarios`, `asignaciones` y las políticas RLS).
3. En **Authentication → Providers**, dejá habilitado **Email**.
4. En **Authentication → Users**, creá manualmente un usuario por cada
   persona que vaya a usar la web (email + contraseña). No hay
   autorregistro: los usuarios los da de alta un administrador desde
   Supabase, igual que en el organizador de oficina.
5. Copiá **Project URL** y **anon public key** desde
   **Project Settings → API**.

## 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Correr en local

```bash
npm install
npm run dev
```

## 4. Desplegar en Cloudflare Pages

1. Subí este proyecto a un repositorio de GitHub (por ejemplo `BP-SA/obras-rrhh`).
2. En Cloudflare Pages, **Create a project → Connect to Git** y elegí el repo.
3. Configuración de build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. En **Settings → Environment variables**, agregá `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` con los mismos valores del paso 2 (Production y
   Preview).
5. Deploy. El archivo `public/_redirects` ya está incluido para que las
   rutas internas (`/obras`, `/operarios`) funcionen al recargar la página.

## Estructura

```
src/
  lib/supabaseClient.js      cliente de Supabase
  context/AuthContext.jsx    sesión, login/logout
  components/                Layout, Modal, y modales de Obra/Operario/Asignación
  pages/                     Login, Asignaciones, Obras, Operarios
supabase/schema.sql          esquema de base de datos + políticas RLS
```

## Próximos pasos posibles

- Roles diferenciados (ej. RRHH solo lectura, Obras con edición).
- Vista de calendario semanal además de la vista mensual actual.

## Nota sobre la librería de Excel

La exportación usa `xlsx` (SheetJS) sólo para **generar** el archivo en el
navegador; la web nunca lee ni importa archivos Excel subidos por usuarios.
Las alertas de seguridad conocidas de ese paquete (`npm audit`) son sobre
parseo de archivos maliciosos, así que no aplican a este uso. Si en algún
momento se agrega una función de "importar desde Excel", conviene revisar
esas alertas antes.
