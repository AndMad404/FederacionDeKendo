# Contributing

Mantén cada cambio acotado a un resultado observable y parte de la versión
actual de `main`. No reescribas el historial de `main`.

## Commits y pull requests

Usa el formato `type(scope): resultado observable` en títulos de commits y
pull requests. Los tipos aceptados son `fix`, `feat`, `refactor`, `docs`,
`test`, `build`, `ci` y `chore`.

El cuerpo debe registrar problema, resultado esperado, alcance, verificación y
riesgos. Para habilitar la plantilla local de commits:

```bash
git config --local commit.template .gitmessage
```

## Verificación

Ejecuta primero las pruebas dirigidas y, antes de solicitar revisión:

```bash
corepack pnpm run verify:site
git diff --check
```

Registra en el pull request los comandos ejecutados y su resultado. Si el
cambio no tiene una verificación ejecutable, explica el motivo.

Los archivos nuevos no deben superar 5 MiB. Cualquier excepción requiere una
decisión explícita y debe quedar codificada en la política del repositorio.
