# Prompt Recipes

Use these prompts as starting points for Codex work in this repo.

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
