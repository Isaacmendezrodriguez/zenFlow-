# ZenFlow

ZenFlow es una aplicacion web personal de productividad que combina:

- Backlog Kanban
- Organizaciones y proyectos
- Cards sencillas y complejas
- Subtareas con horas estimadas vs horas reales
- To-do semanal tipo calendario
- Temporizador opcional
- Dashboard de productividad
- Archivo y Papelera
- Espacio de trabajo por card con links, notas e historial

Este repositorio debe construirse con:

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase Edge Functions solo si se requieren procesos server-side

La app es de uso personal en la primera version.

## Desarrollo

```bash
npm install
npm run dev
npm run test
npm run build
```

## Variables de Entorno

Crea `.env.local` usando `.env.example`:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No uses ni expongas service role keys en el frontend.

## Despliegue

La app esta preparada para Vercel como SPA de Vite con `vercel.json`.

Configuracion recomendada:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Branch de trabajo: `dev`

Antes del despliegue configura en Vercel:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Supabase

La migracion inicial esta en:

```txt
supabase/migrations/20260524000100_create_zenflow_schema.sql
```

Cuando tengas Supabase CLI instalado y un proyecto dev enlazado:

```bash
supabase link --project-ref PROJECT_REF
supabase db push
```

Para tipos generados:

```bash
supabase gen types typescript --project-id PROJECT_ID > src/types/database.ts
```
