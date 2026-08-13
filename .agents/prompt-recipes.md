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
Implementa unicamente la Fase [numero] de [roadmap].

Lee AGENTS.md, el roadmap y los contratos aplicables. Usa
../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/index.md para
seleccionar el contexto documental minimo; no cargues fases posteriores.

Alcance:
- [resultados autorizados de esta fase]

Fuera de alcance:
- [responsabilidades de fases posteriores]
- cambios visuales no aprobados;
- refactors no requeridos.

Criterio de salida:
- primero pasan las pruebas dirigidas de la fase;
- despues pasan las verificaciones finales indicadas por
  .agents/verification.md;
- el diff queda limitado, revisable y apto para un commit atomico.

Detente ante una diferencia visual inesperada o una decision de producto que
el roadmap no haya resuelto. No crees un commit salvo que se solicite.
```

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
