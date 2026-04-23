# Orquestador Multiagente

Un dashboard TUI en terminal que despacha tareas a múltiples agentes de IA trabajando en paralelo sobre tu codebase. Defines tareas en un archivo Markdown simple, y el orchestrator las asigna a los agentes, sigue el progreso, maneja rate limits y dependencias.

![orchestrator-demo](https://img.shields.io/badge/TUI-blessed%20%2B%20ink-cyan)

## Agentes soportados

| Agente             | CLI        | Cómo se conecta                               |
| ------------------ | ---------- | --------------------------------------------- |
| **Claude Code**    | `claude`   | Modo pipe (`-p`), salida `stream-json`        |
| **Codex** (OpenAI) | `codex`    | Modo exec (`--yolo`), prompt por stdin        |
| **Gemini CLI**     | `gemini`   | Approval mode yolo, `stream-json`             |
| **Cursor**         | `agent`    | Modo yolo, prompt por stdin                   |
| **OpenCode**       | `opencode` | Modo run, salida JSON                         |
| **Abacus AI**      | `abacusai` | Modo print (`-p`), prompt por archivo pipeado |
| **Custom**         | cualquiera | Configurando `command` o `args` en el config  |

## Inicio rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/LiriRaid/orchestrator-multiagents.git
cd orchestrator-multiagents
npm install

# 2. Configurar tu proyecto
#    Edita orchestrator.config.json con tus repos y agentes

# 3. Agregar tareas a QUEUE.md

# 4. Ejecutar
node orchestrator.js
```

### Preview Ink experimental

La migración del TUI a Ink ya comenzó en la rama `development`. Puedes abrir la vista experimental con:

```bash
npm run start:ink
```

o en pausa:

```bash
npm run start:ink:paused
```

Por ahora esa vista es un dashboard nuevo para validar layout y experiencia visual; el motor principal actual sigue viviendo en `orchestrator.js`.

## Skills locales del proyecto

Este repo ya puede alojar skills propias del orquestador dentro de:

```bash
.claude/skills/
```

La intención es **no depender de las skills globales** instaladas en `~/.claude/skills/` por herramientas como `gentle-ai`.

Actualmente se incluyen skills locales base para:

- `orchestrator-init`
- `orchestrator-explore`
- `orchestrator-queue-planning`
- `orchestrator-memory`
- `orchestrator-openspec`

Puedes regenerar el registry local con:

```bash
npm run skills:registry
```

Eso escribe:

```bash
.atl/skill-registry.md
```

El registry local prioriza siempre las skills del repo sobre cualquier skill global instalada en tu máquina.

## Configuración por agente

El proyecto ahora separa:

- `agents` — instancias operativas que el motor puede lanzar
- `agentProfiles` — perfiles reutilizables por tipo de agente

Eso permite usar hoy solo:

- `claude`
- `codex`
- `opencode`

pero seguir dejando la arquitectura abierta para:

- un solo agente
- más agentes después
- o perfiles deshabilitados por defecto

Puedes inicializar la capa local por agente con:

```bash
npm run agent-config:init
```

Eso asegura estas carpetas base del proyecto:

```bash
.claude/
.codex/
.opencode/
```

La regla es: la configuración local del proyecto debe ganar sobre la configuración global del usuario cuando el orquestador reusable esté instalado en un workspace.

## Memoria persistente con Engram

El proyecto ya incluye una convención local de memoria en:

```bash
ENGRAM.md
```

La idea es que Claude/orquestador use Engram para:

- recordar decisiones
- recuperar contexto entre sesiones
- guardar resúmenes de sesión
- evitar repetir exploración innecesaria

Engram complementa la TUI, `QUEUE.md` y los handoffs; no los reemplaza.

## OpenSpec local

El proyecto ya incluye una estructura inicial de `openspec/` para cambios grandes:

```bash
openspec/
├── changes/
├── FLOW.md
├── specs/
└── templates/
```

Puedes crear un change nuevo con:

```bash
npm run openspec:new -- add-nombre-del-cambio
```

Eso genera en `openspec/changes/<change-name>/`:

- `proposal.md`
- `specs/spec.md`
- `design.md`
- `tasks.md`
- `verify-report.md`
- `archive-report.md`
- `.openspec.yaml`
- `specs/`

La idea es que:
- `openspec/` guarde el razonamiento y artefactos del cambio
- `QUEUE.md` siga siendo la cola operativa del motor
- Engram guarde memoria y continuidad entre sesiones
- `openspec/FLOW.md` sea la guía de cuándo cada artefacto debe crearse o avanzar

## Atajos de teclado

| Tecla | Acción                         |
| ----- | ------------------------------ |
| **S** | Iniciar / Reanudar             |
| **P** | Pausar / Reanudar              |
| **R** | Recargar cola desde QUEUE.md   |
| **Q** | Salir (mata todos los agentes) |

## Configuración

Edita `orchestrator.config.json`:

```json
{
  "projectName": "Mi Proyecto",
  "maxConcurrent": 5,
  "pollIntervalSeconds": 30,
  "taskTimeoutMinutes": 30,

  "repos": {
    "backend": "/path/to/backend-repo",
    "frontend": "/path/to/frontend-repo"
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
    "Frontend": {
      "cli": "claude",
      "defaultRepo": "frontend",
      "model": "sonnet",
      "instructionsFile": "agents/FRONTEND.md"
    },
    "Codex": {
      "cli": "codex",
      "defaultRepo": "backend",
      "instructionsFile": "agents/CODEX.md"
    },
    "Gemini": {
      "cli": "gemini",
      "defaultRepo": "backend",
      "instructionsFile": "agents/GEMINI.md"
    },
    "OpenCode": {
      "cli": "opencode",
      "defaultRepo": "backend",
      "instructionsFile": "agents/OPENCODE.md"
    },
    "Cursor": {
      "cli": "cursor",
      "defaultRepo": "backend",
      "instructionsFile": "agents/CURSOR.md"
    },
    "Abacus": {
      "cli": "abacusai",
      "defaultRepo": "backend",
      "instructionsFile": "agents/ABACUS.md"
    }
  }
}
```

### Opciones de configuración por agente

| Campo              | Requerido | Descripción                                                                                              |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------- |
| `cli`              | Sí        | Tipo de CLI: `claude`, `codex`, `gemini`, `cursor`, `opencode`, `abacusai` o cualquier CLI personalizado |
| `profile`          | No        | Profile definido en `agentProfiles` para reutilizar configuración por familia de agente                 |
| `defaultRepo`      | Sí        | Clave del mapa `repos` donde ese agente trabaja por defecto                                              |
| `model`            | No        | Override de modelo, por ejemplo `sonnet` u `opus` (solo para Claude)                                     |
| `instructionsFile` | No        | Ruta a un archivo Markdown con instrucciones específicas del agente                                      |
| `command`          | No        | Override completo del comando, por ejemplo `my-cli --flag1 --flag2`                                      |
| `args`             | No        | Array de argumentos para agentes genéricos                                                               |

### Profiles por agente

`agentProfiles` te permite decir:

- qué perfiles están habilitados
- cuál es el principal
- qué directorio local usa cada familia de agente
- y cuáles quedan listos para más adelante aunque no se usen hoy

Eso hace que el repo reusable no quede atado a “exactamente tres agentes”, aunque hoy tu flujo principal sí use `Claude`, `Codex` y `OpenCode`.

### Agregar un agente personalizado

Cualquier CLI que acepte un prompt por stdin y salga con código 0 al completar con éxito puede usarse como agente:

```json
{
  "agents": {
    "MyAgent": {
      "cli": "my-custom-cli",
      "args": ["--no-interactive", "--format", "json"],
      "defaultRepo": "backend"
    }
  }
}
```

## Formato de la cola (`QUEUE.md`)

Las tareas se definen en `QUEUE.md` usando un formato pipe-separated:

```markdown
## Pending

TASK-001 | Fix login bug | Backend | P1 | backend | Fix the 401 error on /auth/login endpoint
TASK-002 | Add dark mode | Frontend | P2 | frontend | Implement dark mode toggle in header
TASK-003 | Write tests | Codex | P2 | backend | Add unit tests for auth module > after:TASK-001

## In Progress

## Completed
```

### Campos

| Campo         | Descripción                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `id`          | ID único de la tarea, por ejemplo `TASK-001`                           |
| `title`       | Descripción corta                                                      |
| `agent`       | Nombre del agente, debe coincidir con una key de `agents` en el config |
| `priority`    | `P1` (alta), `P2` (media), `P3` (baja)                                 |
| `repo`        | Clave del repositorio, debe coincidir con una key de `repos`           |
| `description` | Descripción detallada de la tarea                                      |

### Dependencias

Agrega `> after:TASK-NNN` al final de la descripción para bloquear una tarea hasta que otra se complete:

```
TASK-003 | Write tests | Backend | P2 | backend | Test the auth module > after:TASK-001
```

### Secciones

- **`## Pending`** — Tareas esperando ser tomadas
- **`## In Progress`** — Gestionada por el orchestrator
- **`## Completed`** — Tareas finalizadas, movidas automáticamente por el orchestrator

## Archivos opcionales

| Archivo                        | Propósito                                                                |
| ------------------------------ | ------------------------------------------------------------------------ |
| `agents/BACKEND.md`            | Instrucciones que se inyectan al prompt del agente Backend               |
| `agents/FRONTEND.md`           | Instrucciones que se inyectan al prompt del agente Frontend              |
| `AGENT-PROTOCOL.md`            | Reglas compartidas inyectadas a todos los agentes                        |
| `TASKS.md`                     | Especificaciones detalladas de tareas, usando encabezados `### TASK-NNN` |
| `briefs/TASK-001-BRIEF.md`     | Brief detallado para una tarea específica                                |
| `progress/PROGRESS-Backend.md` | Archivo de progreso del agente, actualizado por los agentes              |

## Características

- **Ejecución paralela** — Todos los agentes idle corren simultáneamente
- **Cadenas de dependencia** — `> after:TASK-NNN` bloquea hasta que la dependencia complete
- **Manejo de rate limits** — Detecta 429 y reintenta al momento del reset, hasta 10 veces
- **Auto-retry** — Las tareas fallidas reintentan hasta 2 veces, o 10 si fue rate limit
- **Salida en vivo** — Ves el stdout de cada agente en paneles divididos
- **Seguimiento de costo** — Acumula `total_cost_usd` desde el `stream-json` de Claude
- **Límite de presupuesto** — `--max-budget=N` detiene el proceso cuando el gasto supera `$N`
- **Recarga en caliente** — Presiona **R** para recargar `QUEUE.md` sin reiniciar
- **Estado persistente** — Las tareas completadas sobreviven al reinicio de la TUI
- **Detección de procesos muertos** — Heartbeat cada 15 segundos

## Opciones CLI

```
node orchestrator.js [options]

Options:
  --paused         Inicia en pausa (presiona S para arrancar)
  --max-budget=N   Se detiene después de gastar $N
  --help           Muestra la ayuda
```

## Variables de entorno

| Variable           | Default | Descripción                                                         |
| ------------------ | ------- | ------------------------------------------------------------------- |
| `SKIP_PERMISSIONS` | `false` | Si está en `true`, usa `--dangerously-skip-permissions` para Claude |

## Cómo funciona

1. Lee `QUEUE.md` para encontrar tareas pendientes
2. Para cada agente idle con una tarea compatible, genera un prompt o brief que incluye:
   - La descripción y el contexto de la tarea
   - Las instrucciones específicas del agente, desde `instructionsFile`
   - Las reglas del protocolo, desde `AGENT-PROTOCOL.md`
   - Un brief detallado, desde `briefs/TASK-NNN-BRIEF.md`
3. Lanza el CLI del agente con el prompt por stdin
4. Streamea la salida al panel de la TUI y al archivo de logs
5. Si el proceso sale con código 0, mueve la tarea a `Completed` y dispara la siguiente
6. Si falla, reintenta o la marca como fallida permanentemente
7. Revisa dependencias antes de lanzar tareas bloqueadas

## Logs

Toda la salida se guarda en `logs/`:

- `orchestrator-YYYY-MM-DD.log` — Eventos del orchestrator
- `TASK-NNN-AgentName-timestamp.log` — Salida completa del agente por tarea

## Licencia

CC BY-NC-SA 4.0 - Atribución, No Comercial, Compartir Igual
