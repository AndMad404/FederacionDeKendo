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

## Drive del calendario

La sincronización de `main` activa Drive con el secreto de Actions
`CALENDAR_DRIVE_CONFIG`. El valor es un objeto JSON con `rootId`, `clientId`,
`clientSecret`, `refreshToken`, `quota` y, opcionalmente, `existingFolders` (mapa de ID
estable de Calendar a ID de carpeta). El usuario OAuth debe tener acceso de
edición a `FOTOS calendario` y a las carpetas que se vinculen. Habilita Drive API
y Drive Activity API y concede los scopes `https://www.googleapis.com/auth/drive`
y `https://www.googleapis.com/auth/drive.activity.readonly`. Prepara debajo de
la raíz las categorías `Examenes`, `Torneos` y `Seminarios`.

En `existingFolders`, asigna la carpeta existente de la Copa Shogun de Panamá al
evento `2d5bad84832b0a2be6193e52`. Valida con la identidad de Actions que puede
listar la carpeta, crear una carpeta de prueba en una categoría y recuperarla.
Comprueba el orden con dos cargas y un archivo movido. Revisa el álbum de Panamá
si Drive Activity no devuelve evidencia suficiente. Los IDs de las carpetas
se resuelven desde Drive y los enlaces se añaden al correo operativo.

Configura `quota.userUnitsPerMinute`, `quota.projectUnitsPerMinute`,
`quota.projectBytesPerDay` y `quota.timeZone` según el proyecto. Configura también
`quota.units` con los costos `metadata`, `list`, `write` y `download`.
Consulta las [cuotas de Google Drive API](https://developers.google.com/workspace/drive/api/guides/quotas).
Si falta la configuración o es inválida, o si la siguiente solicitud superaría
el límite, la ejecución se detiene y genera un aviso operativo. El contador
cubre esta ejecución. El consumo de otras aplicaciones se detecta cuando
Google rechaza una solicitud por cuota de Drive o Drive Activity.

El presupuesto diario de descargas se conserva entre ejecuciones en una
propiedad privada de la carpeta raíz y se reinicia a medianoche de `quota.timeZone`.
Cada descarga reserva el máximo de bytes que puede pedir el importador para
una foto, incluido un byte para detectar archivos demasiado grandes. La
reserva cubre intentos fallidos o interrumpidos. Ejecuta las descargas mediante
`sync-calendar.yml`, que serializa las ejecuciones de `main`. Un error al
verificar o guardar el presupuesto detiene la publicación y genera un aviso.

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
