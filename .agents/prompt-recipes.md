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

Delta e invariantes criticos:
- [resultado funcional verificable de esta fase]
- [invariante critico que no puede cambiar]

Limites: [exclusion o frontera relevante de esta fase; no crees commit salvo
solicitud]. Preserva cambios ajenos del worktree. Selecciona las verificaciones
mediante `.agents/verification.md`.

Reporte final: delta aplicado, verificaciones ejecutadas y gates aplicables
omitidos con motivo; bloqueos.
```

## Implement One Calendar-Resilience Phase

Use this for one phase of `calendar-resilience-roadmap.md`; replace every
bracketed field. Keep the phase boundary explicit so the synchronizer, report,
and correction paths do not silently absorb later operational work.

```text
Ejecuta unicamente la Fase [numero] — “[titulo]” — de:

../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-resilience-roadmap.md

Las Fases [previas] estan completadas. No redisenes sus contratos.

Contrato persistido vigente:
- [estados, transiciones y preservacion que deben mantenerse]
- [protecciones cuantificadas, por ejemplo el umbral masivo]
- [invariantes de privacidad, transaccionalidad y salida publica]

Antes de trabajar:

1. Lee AGENTS.md.
2. Lee completamente calendar-resilience-roadmap.md.
3. Usa ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/index.md para
   seleccionar el contexto documental minimo.
4. Lee .agents/project-map.md, .agents/implementation-contract.md y
   .agents/verification.md.
5. Revisa el estado de ambos repositorios y preserva cambios ajenos.
6. Revisa los scripts, datos y pruebas nombrados por la fase antes de editar.
7. Usa la evidencia de fases cerradas; no reabras seguimientos externos no
   bloqueantes salvo una regresion reproducible.

Objetivo:

[resultado concreto y verificable de la fase].

Alcance autorizado:

- [cambio 1]
- [cambio 2]
- Añadir pruebas dirigidas para comportamiento, determinismo, privacidad y
  preservacion transaccional cuando correspondan.
- Actualizar solo la documentacion propietaria cuyo comportamiento o estado
  cambie.

Fuera de alcance:

- No cambiar el contrato v4 ni protecciones previas salvo correccion
  indispensable demostrada por una prueba.
- No implementar responsabilidades de las Fases [siguientes].
- No modificar diseno, copy publico, SEO, rutas, workflows ni crear commit,
  salvo que resulte estrictamente necesario; si lo parece, detenerse y
  explicarlo.
- No guardar secretos, URL ICS, URL privada de Drive ni datos sensibles en
  registro publico, TypeScript, reportes persistidos, logs o documentacion.

Criterio de salida:

- [evidencia funcional observable]
- [invariante de seguridad o preservacion]
- Primero pasan pruebas dirigidas; despues typecheck, unitarias, build, salida
  generada, E2E y las verificaciones aplicables de .agents/verification.md.
- Resume archivos modificados, esquema o flujo resultante, pruebas, riesgos y
  trabajo reservado para fases posteriores.
- No crees un commit.
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
