# Prompt Recipes

Use these prompts as starting points for Codex work in this repo.

The owner also maintains a companion visual reference,
`Guia_rapida_ahorro_tokens_Codex.docx`. It is a memory aid, not an
authoritative project input. Do not load it unless the user asks. When the
scope-discovery recipes below change materially, flag the visual reference for
manual synchronization.

## Discover Scope Without Editing

```text
Investiga [problema].
Usa .agents/project-map.md para descubrir las rutas, archivos, componentes y
pruebas relacionadas. Resume el alcance en maximo 10 lineas. No edites todavia.
No revises todas las rutas salvo que encuentres una dependencia compartida que
lo justifique; si amplias el alcance, explica por que.
```

## Implement The Discovered Scope

```text
Implementa unicamente el alcance identificado para [problema].
No explores mejoras adicionales ni refactorices fuera de alcance.
Ejecuta primero la prueba dirigida y despues solo la verificacion final que
corresponda segun .agents/verification.md.
```

## Discover And Implement When Unambiguous

```text
Corrige [problema].
Primero usa .agents/project-map.md para identificar el alcance minimo. Si la
causa y el cambio son inequivocos, implementa sin ampliar el alcance y ejecuta
solo las pruebas relacionadas. Si hay mas de una interpretacion material,
resume las opciones en maximo 10 lineas y espera mi decision.
```

## Review One File

```text
Revisa solo [archivo].
Usa .agents/review-contract.md.
No asumas codigo no inspeccionado.
Devuelve findings por severidad y recomienda el siguiente archivo.
```

## Plan A Change

```text
Quiero cambiar [objetivo].
Antes de editar, lee los archivos relevantes y dame un plan breve.
Separa hechos verificados de sugerencias.
No propongas refactors fuera de alcance.
```

## Implement A Specific Finding

```text
Aplica solo el finding [nivel/titulo].
Usa .agents/implementation-contract.md.
Manten el cambio minimo.
No toques archivos no relacionados.
Al final corre los checks relevantes de .agents/verification.md.
```

## Implement One Roadmap Phase

```text
Fase [numero], [titulo/enlace directo]: [objetivo exacto].
Las fases previas estan cerradas; no las reaudites.

Contexto minimo: parte del apartado enlazado; si no basta, usa `docs/index.md`
y el mapa documental aplicable para seleccionar solo la referencia indispensable.

Delta: [resultado funcional verificable de esta fase].
Invariantes criticos: [condicion observable que no puede cambiar].
Decision humana: [bloqueo y alternativa minima que requiere aprobacion; o
"ninguna"].

Limites: [exclusion o frontera relevante de esta fase; no crees commit salvo
solicitud]. Preserva cambios ajenos del worktree. Selecciona las verificaciones
mediante `.agents/verification.md`.

Reporte final: delta aplicado, verificaciones ejecutadas y gates aplicables
omitidos con motivo; bloqueos.
```

## Implement One Calendar-Resilience Phase

Use the canonical `Implement One Roadmap Phase` recipe. Its direct phase link
points to the relevant section of `calendar-resilience-roadmap.md`; do not add
calendar-specific preamble, file lists, gates, or historical contracts.

## SEO Change

```text
Cambia [titulo/descripcion/metadato] para [ruta].
Empieza por src/app/config/seo-data.json.
Verifica runtime y HTML generado.
No cambies copy visible ni datos legales fuera del alcance.
```

## Responsive Bug

```text
Corrige el problema responsive en [ruta/componente].
Valida mobile, tablet y desktop.
No redisenes la seccion completa.
Manten touch targets >=44px.
```

## Final Self-Review

```text
Revisa tu propio diff.
Busca regresiones en TS, React, Tailwind, A11Y, SEO, PERF y RESPONSIVE.
No hagas cambios nuevos salvo que encuentres un bug claro.
Reporta riesgos restantes.
```
