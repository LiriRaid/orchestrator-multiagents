# Orquestador Multiagente

> by **LiriRaid**

Orquestador reusable para trabajar con múltiples agentes de código desde terminal, con un TUI propio, cola operativa, skills locales, memoria persistente con Engram y artefactos OpenSpec para cambios grandes.

La idea central no es dejar que una sola IA haga todo, sino:

- usar a **Claude** como orquestador principal
  - usar **OpenCode** principalmente para exploración, lectura y contexto, pero también para implementar cuando convenga
  - usar **Codex** para ejecución estructurada e implementación de apoyo
- reflejar todo en una **TUI** que muestra estado, cola, agentes, logs y actividad real

## Qué es hoy

Este repo ya no es solo un runner con `QUEUE.md`.

Hoy incluye:

- **motor de orquestación** en `orchestrator.js`
- **TUI Ink** conectada al motor real
- **skills locales** en `.claude/skills/`
- **routing local** con `CLAUDE.md`
- **memoria persistente** con `ENGRAM.md`
- **OpenSpec** para cambios grandes
- **configuración por agente** con `agentProfiles`
- **base de installer / ecosystem configurator**
- **documentación local de componentes y arquitectura**

## Diferencia frente a gentle-ai

Este proyecto toma ideas de `gentle-ai`, pero no intenta ser una copia.

Lo que sí hereda como inspiración:

- skills locales
- registry local
- memoria persistente
- OpenSpec / SDD
- installer / ecosystem configurator

Lo que agrega como valor propio:

- TUI multiagente visible en tiempo real
- cola operativa (`QUEUE.md`) integrada al runtime
- delegación real para ahorro de tokens
- separación clara entre:
  - exploración
  - planificación
  - ejecución
  - verificación

## Documentación local

La documentación reusable del sistema vive en:

```bash
docs/
```

Incluye:

- `docs/architecture.md`
- `docs/components.md`
- `docs/agents.md`
- `docs/engram.md`
- `docs/openspec.md`
- `docs/usage.md`

## Modelo de uso recomendado

Este orquestador **no debería ensuciar el repo real del producto**.

La instalación recomendada es:

- proyecto real:
  - `C:/code/mi-proyecto`
- workspace del orquestador:
  - `C:/code/orchestrator-mi-proyecto`

O sea:

- el orquestador vive en una carpeta sibling del proyecto
- el proyecto real queda limpio
- el orquestador apunta al proyecto por config

Eso es muy parecido al modelo global de herramientas como `gentle-ai`.

## Instalación desde npm

Nombre del paquete:

```bash
@liriraid/orchestrator-multiagents
```

La página de npm puede mostrar el snippet genérico:

```bash
npm i @liriraid/orchestrator-multiagents
```

pero **ese no es el flujo recomendado** para este proyecto.

### Instalación global recomendada

Instala el CLI una sola vez:

```bash
npm i -g @liriraid/orchestrator-multiagents
```

Luego, para cada proyecto real, crea un workspace sibling del orquestador:

```bash
orchestrator-multiagents init-workspace C:/code/mi-proyecto
```

Eso debería dejar algo así:

- proyecto real:
  - `C:/code/mi-proyecto`
- workspace del orquestador:
  - `C:/code/orchestrator-mi-proyecto`

### Alternativa sin instalación global

Si no quieres instalarlo globalmente, puedes usar `npx`:

```bash
npx @liriraid/orchestrator-multiagents init-workspace C:/code/mi-proyecto
```

Ese comando crea un workspace reusable del orquestador junto al proyecto real.

## Instalación desde el repo fuente

Si vas a modificar el orquestador mismo:

```bash
git clone https://github.com/LiriRaid/orchestrator-multiagents.git
cd orchestrator-multiagents
npm install
```

Este repo local es la **fuente reusable** que tú modificas para agregar herramientas, cambiar el flujo o extender el sistema.

## Qué instala el installer

Cuando usas `init-workspace`, el installer crea una base de trabajo con:

- `ORCHESTRATOR.md`
- `CLAUDE.md`
- `ENGRAM.md`
- `AGENT-CONFIG.md`
- `orchestrator.config.json`
- `QUEUE.md`
- `agents/`
- `openspec/`
- `.claude/`
- `.codex/`
- `.opencode/`

También crea carpetas runtime:

- `logs/`
- `handoffs/`
- `progress/`
- `briefs/`

## Flujo operativo esperado

### 1. Instalar el CLI globalmente

```bash
npm i -g @liriraid/orchestrator-multiagents
```

### 2. Crear el workspace del orquestador

```bash
orchestrator-multiagents init-workspace C:/code/mi-proyecto
```

Si tu proyecto vive, por ejemplo, en:

```bash
C:/code/mi-proyecto
```

el installer debería crear:

```bash
C:/code/orchestrator-mi-proyecto
```

### 3. Ajustar el config

Edita:

```bash
orchestrator.config.json
```

para apuntar a los repos reales.

### 4. Arrancar la TUI

Modo Ink:

```bash
orchestrator-multiagents ink --paused
```

o desde el repo fuente:

```bash
npm run start:ink:paused
```

### 5. Abrir Claude Code en el workspace del orquestador

Y darle el prompt de arranque:

```text
Lee ORCHESTRATOR.md y arranca.
```

o mejor:

```text
Lee ORCHESTRATOR.md, asume el rol de orquestador y arranca.
```

### 6. Pedir una tarea

Ejemplos:

- `explora este proyecto`
- `analiza estos archivos`
- `crea tareas para implementar este cambio`
- `abre un change y prepara proposal, spec y tasks`

Claude usará:

- `CLAUDE.md` como routing local
- `.claude/skills/` como skills del proyecto
- `ENGRAM.md` para continuidad
- `openspec/` para cambios grandes
- `QUEUE.md` para ejecución viva en el motor

## Modelo de seguridad recomendado

Por defecto, el orquestador no debería correr en modo bypass total.

Recomendación:

- **Claude** como orquestador y autoridad final de revisión
- **OpenCode** para lectura, exploración, contexto e implementación cuando se le asigne
- **Codex** para implementación estructurada y apoyo técnico
- cambios sensibles o resultados dudosos deben volver a **Claude** para validación

La idea es que los agentes trabajen, pero no autoacepten todo ciegamente. El usuario conserva la aprobación final, con Claude como filtro principal de calidad.

## UIs disponibles

### Ink

Comandos:

```bash
orchestrator-multiagents ink
orchestrator-multiagents ink --paused
orchestrator-multiagents ink --yolo
```

o desde el repo fuente:

```bash
npm run start:ink
npm run start:ink:paused
```

Estado actual:

- conectada al motor real
- muestra `Pausado` / `Ejecutando`
- muestra tiempo activo
- usa controles reales:
  - `S`
  - `P`
  - `R`
  - `Q`

### Modo con bypass explícito

Si en una sesión concreta quieres permitir modo agresivo para entornos de confianza, puedes iniciar el motor con:

```bash
orchestrator-multiagents ink --yolo
```

o:

```bash
node orchestrator.js --yolo
```

Ese modo no es el default y debe usarse solo cuando realmente lo decidas.

### Blessed

Sigue existiendo como runtime base histórico:

```bash
node orchestrator.js
node orchestrator.js --paused
```

## Skills locales del proyecto

Las skills viven en:

```bash
.claude/skills/
```

Actualmente incluye:

- `orchestrator-init`
- `orchestrator-explore`
- `orchestrator-propose`
- `orchestrator-spec`
- `orchestrator-design`
- `orchestrator-tasks`
- `orchestrator-queue-planning`
- `orchestrator-apply`
- `orchestrator-verify`
- `orchestrator-archive`
- `orchestrator-memory`
- `orchestrator-openspec`

Estas skills son **locales del repo** y deben priorizarse sobre cualquier skill global instalada en el home del usuario.

## Registry local

Se regenera con:

```bash
npm run skills:registry
```

Salida:

```bash
.atl/skill-registry.md
```

Este registry sirve como catálogo local del proyecto y como fuente de resolución para Claude.

## Memoria persistente con Engram

La convención local vive en:

```bash
ENGRAM.md
```

Engram se usa para:

- decisiones importantes
- hallazgos no obvios
- bugs y causas raíz
- continuidad entre sesiones
- resúmenes de sesión

Engram no reemplaza:

- `QUEUE.md`
- la TUI
- `ORCHESTRATOR.md`
- handoffs

Los complementa.

## OpenSpec

OpenSpec vive en:

```bash
openspec/
```

Estructura:

```bash
openspec/
├── changes/
├── FLOW.md
├── specs/
└── templates/
```

Crear un change:

```bash
orchestrator-multiagents openspec:new -- add-mi-cambio
```

o desde el repo fuente:

```bash
npm run openspec:new -- add-mi-cambio
```

Artefactos del change:

- `proposal.md`
- `specs/spec.md`
- `design.md`
- `tasks.md`
- `verify-report.md`
- `archive-report.md`
- `.openspec.yaml`

El flujo canónico está en:

```bash
openspec/FLOW.md
```

## Configuración por agente

La configuración ahora se divide en dos capas:

### `agents`

Instancias operativas visibles para el motor.

Ejemplo:

- `Backend`
- `Frontend`
- `Codex`
- `OpenCode`

### `agentProfiles`

Configuración reusable por familia de agente.

Ejemplo actual:

- `claude`
- `codex`
- `opencode`
- `gemini`
- `cursor`
- `abacusai`

Esto permite:

- usar 1 agente
- usar 3 agentes
- dejar más perfiles preparados para el futuro

### Inicializar carpetas locales por agente

```bash
orchestrator-multiagents agent-config:init
```

o:

```bash
npm run agent-config:init
```

Eso asegura:

- `.claude/`
- `.codex/`
- `.opencode/`

## Config ejemplo

```json
{
  "projectName": "Mi Proyecto",
  "maxConcurrent": 5,
  "pollIntervalSeconds": 30,
  "taskTimeoutMinutes": 30,
  "repos": {
    "backend": "C:/code/mi-backend",
    "frontend": "C:/code/mi-frontend"
  },
  "agentProfiles": {
    "claude": {
      "enabled": true,
      "localConfigDir": ".claude",
      "skillsDir": ".claude/skills",
      "primary": true,
      "useForOrchestration": true
    },
    "codex": {
      "enabled": true,
      "localConfigDir": ".codex"
    },
    "opencode": {
      "enabled": true,
      "localConfigDir": ".opencode"
    }
  },
  "agents": {
    "Backend": {
      "cli": "claude",
      "profile": "claude",
      "defaultRepo": "backend",
      "model": "sonnet",
      "instructionsFile": "agents/BACKEND.md"
    },
    "Codex": {
      "cli": "codex",
      "profile": "codex",
      "defaultRepo": "backend",
      "instructionsFile": "agents/CODEX.md"
    },
    "OpenCode": {
      "cli": "opencode",
      "profile": "opencode",
      "defaultRepo": "backend",
      "instructionsFile": "agents/OPENCODE.md"
    }
  }
}
```

## Controles de la TUI

| Tecla | Acción |
|------|--------|
| `S` | iniciar / reanudar |
| `P` | pausar |
| `R` | recargar `QUEUE.md` |
| `Q` | salir y matar agentes |

## Lo que este repo ya soporta

- cola operativa con `QUEUE.md`
- TUI conectada al motor real
- skills locales del proyecto
- routing local con `CLAUDE.md`
- memoria persistente con Engram
- OpenSpec para cambios grandes
- configuración reusable por agente
- installer / ecosystem configurator base

## Lo que todavía sigue evolucionando

- publicación definitiva en npm
- pulido del installer
- integración más profunda entre OpenSpec, routing y cola
- futuras skills SDD más completas si hacen falta

## Licencia

MIT

El texto completo está en `LICENSE`.
