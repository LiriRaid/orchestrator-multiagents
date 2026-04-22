# Orquestador Multiagente

Dashboard TUI que despacha tareas en paralelo a múltiples agentes de IA (Claude Code, Codex, Gemini CLI, Cursor, OpenCode, Abacus AI) sobre tu propio código. Definís tareas en un `QUEUE.md` con formato pipe-separated y el orquestador las asigna al agente correspondiente, monitorea su output, maneja rate limits y dependencias, y deja logs detallados.

Actualmente hay dos capas de UI:

- `orchestrator.js` — TUI estable actual basada en `blessed`
- `src/ink/*` — migración experimental a `Ink` para una UI terminal más moderna y mantenible

También ya existe una base local para skills del proyecto:

- `./.claude/skills/*` — skills propias del orquestador
- `./.atl/skill-registry.md` — registry generado localmente
- `ENGRAM.md` — convención local para memoria persistente

La regla de diseño es: **priorizar skills del repo y no depender de las globales** instaladas por terceros.

---

## Qué es

Una herramienta local, sin servidor, que corre como un proceso Node.js en tu máquina. Lanza los CLIs oficiales de cada agente (no usa APIs directas), les pasa un brief generado a partir de tus archivos de instrucciones, y muestra el progreso en paneles divididos tipo `htop`.

No es:

- Un proxy de API
- Un servicio hospedado
- Un wrapper que te cobra tokens aparte

Sí es:

- Un runner local que hace `spawn('claude', [...])`, `spawn('codex', [...])`, etc.
- Un dispatcher de tareas con dependencias y retries
- Un visor en tiempo real del trabajo de cada agente

---

## Qué hace

1. **Lee `QUEUE.md`** — lista de tareas con formato pipe:

   ```
   TASK-001 | Fix login bug | Backend | P1 | backend | Corregir 401 en /auth/login
   ```

2. **Para cada tarea pendiente**, genera un brief automático que incluye:
   - Descripción de la tarea
   - Instrucciones específicas del agente (`agents/BACKEND.md`, etc.)
   - Reglas del protocolo compartido (`AGENT-PROTOCOL.md`)
   - Brief detallado opcional (`briefs/TASK-NNN-BRIEF.md`)
   - Entrada larga del `TASKS.md` si existe

3. **Lanza el CLI del agente** (`claude`, `codex`, `gemini`, `cursor`, `opencode`, `abacusai`) apuntando al repo correcto, con el brief via stdin.

4. **Streamea el output** a un panel dedicado de ese agente en la TUI. Parsea eventos `stream-json` para Claude/Abacus, JSON de OpenCode, y texto plano para los demás.

5. **Al terminar** (exit code 0):
   - Mueve la tarea a `## Completed` en `QUEUE.md`
   - Registra duración y costo (si Claude reporta `total_cost_usd`)
   - Lanza la siguiente tarea disponible para ese agente

6. **Al fallar**:
   - Detecta rate limits (`429`, `RESOURCE_EXHAUSTED`, `resets 3pm`, etc.) y reintenta al tiempo exacto de reset (hasta 10 veces)
   - Fallos no-rate-limit reintentan 2 veces con 15s de espera
   - Tras agotar retries, marca la tarea como permanentemente fallida

7. **Maneja dependencias**: `TASK-003 | ... > after:TASK-001` bloquea TASK-003 hasta que TASK-001 esté en `## Completed`.

---

## Arquitectura interna

```
┌─────────────────────────────────────────────────────────────┐
│                    orchestrator.js                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   parser     │  │  scheduler   │  │  TUI render  │       │
│  │  QUEUE.md →  │  │ idle agents  │  │   blessed    │       │
│  │    tasks[]   │  │ × tasks[] →  │  │  dashboard   │       │
│  │              │  │  launch      │  │  + panels    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────▲───────┘       │
│         │                 │                 │               │
│         │                 ▼                 │               │
│         │          ┌─────────────┐          │               │
│         │          │ spawn(cli)  │──stdout──┘               │
│         │          │   per task  │                          │
│         │          └──────┬──────┘                          │
│         │                 │                                 │
│         │                 ▼                                 │
│         │          ┌─────────────┐                          │
│         │          │ logs/*.log  │                          │
│         │          └─────────────┘                          │
│         │                                                   │
│         └──── on complete: update QUEUE.md ◄────────────────│
└─────────────────────────────────────────────────────────────┘
```

**Ciclo de vida de una tarea:**

```
pending ──► running ──► completed ✓
             │
             └──► failed ──► pending (retry)
                    │
                    └──► failed permanente (tras N retries)
```

---

## Instalación

```bash
git clone https://github.com/LiriRaid/orchestrator-multiagents.git
cd orchestrator-multiagents
npm install
```

Requiere Node.js ≥ 18 y los CLIs de los agentes que vas a usar, ya instalados y en el `PATH`:

| Agente      | Instalación                                      |
| ----------- | ------------------------------------------------ |
| Claude Code | `npm install -g @anthropic-ai/claude-code`       |
| Codex       | `npm install -g @openai/codex`                   |
| Gemini CLI  | `npm install -g @google/gemini-cli`              |
| Cursor      | Viene con Cursor IDE (`agent` binary)            |
| OpenCode    | `curl -fsSL https://opencode.ai/install \| bash` |
| Abacus AI   | Ver docs de Abacus                               |

---

## Configuración paso a paso

### 1. Generá el config template

```bash
node orchestrator.js --init
```

Esto crea `orchestrator.config.json` con un ejemplo mínimo.

### 2. Editá `orchestrator.config.json`

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

  "agents": {
    "Backend": {
      "cli": "claude",
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

| Campo                 | Requerido | Descripción                                                          |
| --------------------- | --------- | -------------------------------------------------------------------- |
| `projectName`         | No        | Nombre en el header de la TUI                                        |
| `maxConcurrent`       | No        | Máximo de agentes corriendo en paralelo. Default = número de agentes |
| `pollIntervalSeconds` | No        | Cada cuánto relee QUEUE.md. Default 30s                              |
| `taskTimeoutMinutes`  | No        | Máximo por tarea antes de `SIGTERM`. Default 30min                   |
| `repos`               | Sí        | Map de `alias → path absoluto` a repos reales                        |
| `agents`              | Sí        | Map de `nombre → config del agente`                                  |

**Config por agente:**

| Campo              | Requerido | Descripción                                                            |
| ------------------ | --------- | ---------------------------------------------------------------------- |
| `cli`              | Sí        | `claude`, `codex`, `gemini`, `cursor`, `opencode`, `abacusai` o custom |
| `defaultRepo`      | Sí        | Key del map `repos` donde trabaja por defecto                          |
| `model`            | No        | Override de modelo (solo Claude) — `sonnet`, `opus`, etc.              |
| `instructionsFile` | No        | Markdown inyectado al prompt del agente                                |
| `command`          | No        | Override total del comando (para CLIs custom)                          |
| `args`             | No        | Array de args para CLIs genéricas                                      |

### 3. (Opcional) Creá instrucciones por agente

`agents/BACKEND.md`:

```markdown
Sos el agente Backend. Trabajás exclusivamente en el repo API.

- Lenguaje: Laravel + PHP 8.3
- Nunca toques el frontend
- Siempre corré tests antes de dar una tarea por terminada
```

### 4. (Opcional) Creá `AGENT-PROTOCOL.md`

Reglas compartidas por todos los agentes. El orquestador busca una sección `## N. Rules` (o `## N. Reglas`) y la inyecta al brief.

### 5. (Opcional) Dejá el plan del proyecto

Si tenés un documento con el plan general (roadmap, objetivos, arquitectura), guardalo en el workspace como `<projectName>-plan.md` (ej: `autolote-plan.md`) o `PLAN.md`. El orquestador lo detecta automáticamente y lo inyecta al brief de cada agente en cada tarea, para que todos trabajen con el contexto completo sin tener que repetirlo.

Convención de búsqueda (primera que exista gana):

1. `<projectName-en-minúsculas-con-guiones>-plan.md`
2. `PLAN.md`
3. `plan.md`

### 6. Llená `QUEUE.md`

```markdown
## Pending

TASK-001 | Corregir login backend | Backend | P1 | backend | Corregir 401 en /auth/login cuando password tiene caracteres unicode
TASK-002 | Crear landing page | Frontend | P2 | frontend | Implementar layout responsive de la página principal
TASK-003 | Documentación de API | Codex | P2 | backend | Documentar endpoints REST en docs/api-reference.md > after:TASK-001
TASK-004 | Auditar flujo actual | OpenCode | P2 | backend | Revisar el flujo actual y entregar hallazgos en markdown

## In Progress

## Completed
```

---

## Cómo ejecutarlo

**Arranque normal:**

```bash
node orchestrator.js
```

**Arrancar en pausa (no lanza nada hasta apretar `S`):**

```bash
node orchestrator.js --paused
```

**Con presupuesto máximo en USD:**

```bash
node orchestrator.js --max-budget=5
```

**Help:**

```bash
node orchestrator.js --help
```

### Atajos de teclado

| Tecla | Acción                                   |
| ----- | ---------------------------------------- |
| `S`   | Start / Resume                           |
| `P`   | Pause / Resume                           |
| `R`   | Recargar QUEUE.md sin reiniciar          |
| `Q`   | Salir (mata todos los agentes corriendo) |

### Permisos de Claude

Por defecto usa `--permission-mode acceptEdits`. Para saltarlos completamente:

```bash
SKIP_PERMISSIONS=true node orchestrator.js
```

---

## Ejemplo completo

```bash
# 1. Clonar e instalar
git clone https://github.com/LiriRaid/orchestrator-multiagents.git
cd orchestrator-multiagents
npm install

# 2. Crear config
node orchestrator.js --init

# 3. Editar orchestrator.config.json (apuntar a tus repos reales)
#    - Agregar entradas en "repos"
#    - Agregar agentes en "agents"

# 4. Escribir tareas
cat > QUEUE.md <<'EOF'
## Pending

TASK-001 | Agregar endpoint health | Backend | P1 | backend | GET /health que retorne {status:"ok"}
TASK-002 | Tests del endpoint health | Codex | P2 | backend | Tests para GET /health > after:TASK-001

## In Progress

## Completed
EOF

# 5. Arrancar
node orchestrator.js
```

Al lanzar:

- Si `Backend` está idle, TASK-001 se lanza inmediatamente (Codex queda esperando por la dependencia).
- Cuando TASK-001 completa, TASK-002 se despacha automáticamente a Codex.
- Mientras tanto la TUI muestra el stdout de cada agente en su panel.

---

## Archivos del proyecto

| Archivo                               | Gestión                                 | Propósito                                                                                                                                         |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orchestrator.js`                      | tú no lo editás                         | El ejecutable principal                                                                                                                           |
| `orchestrator.config.json`             | vos                                     | Repos + agentes                                                                                                                                   |
| `QUEUE.md`                            | vos (+ orquestador mueve a `Completed`) | Cola de tareas                                                                                                                                    |
| `TASKS.md`                            | opcional                                | Specs detalladas por TASK-ID (`### TASK-001`)                                                                                                     |
| `AGENT-PROTOCOL.md`                   | opcional                                | Reglas compartidas por todos los agentes                                                                                                          |
| `<projectName>-plan.md` (o `PLAN.md`) | opcional                                | Plan de alto nivel del proyecto — el orquestador lo inyecta como contexto en el brief de CADA tarea, así todos los agentes ven la visión completa |
| `agents/*.md`                         | opcional                                | Instrucciones específicas por agente                                                                                                              |
| `briefs/TASK-NNN-BRIEF.md`            | opcional                                | Brief largo para una tarea puntual                                                                                                                |
| `progress/PROGRESS-*.md`              | agentes                                 | Estado por agente (se les pide que lo actualicen)                                                                                                 |
| `logs/orchestrator-YYYY-MM-DD.log`     | orquestador                             | Eventos del orquestador                                                                                                                           |
| `logs/TASK-NNN-Agent-*.log`           | orquestador                             | Full stdout/stderr de cada tarea                                                                                                                  |
| `logs/orchestrator.lock`               | orquestador                             | PID lock (auto-limpia al salir)                                                                                                                   |

---

## Features

- **Paralelismo real** — cada agente idle toma tarea al mismo tiempo
- **Dependencias** — `> after:TASK-NNN` bloquea hasta que el dep esté completo
- **Rate limit handling** — detecta 429 / `resets 3pm` / `RESOURCE_EXHAUSTED` y reintenta al tiempo exacto (hasta 10×)
- **Auto-retry** — fallos normales reintentan 2 veces
- **Cost tracking** — Claude expone `total_cost_usd` y se acumula
- **Budget cap** — `--max-budget=N` detiene al pasar el límite
- **Hot reload** — `R` recarga QUEUE.md sin reiniciar el proceso
- **Persistencia** — el estado de completadas se lee desde QUEUE.md al reiniciar
- **Dead-process detection** — cada 15s revisa heartbeat de cada agente
- **Lock file** — evita doble instancia del orquestador
- **Tolerancia a TUI crashes** — errores del parser de blessed no matan el proceso
- **Template init** — `--init` genera `orchestrator.config.json` de arranque

---

## Variables de entorno

| Variable           | Default | Descripción                                               |
| ------------------ | ------- | --------------------------------------------------------- |
| `SKIP_PERMISSIONS` | `false` | Si `true`, usa `--dangerously-skip-permissions` en Claude |

---

## Troubleshooting

**La TUI se cierra con `TypeError: Cannot read properties of null (reading 'slice')`**
Output de un agente contenía tags blessed malformados. Ya hay `try/catch`; si aún ves esto, revisá versión de `blessed` (`npm install blessed@latest`).

**`Orchestrator already running (PID X)`**
Instancia previa no se cerró limpio. Borrá `logs/orchestrator.lock` o `kill PID`.

**Un agente quedó `BUSY` para siempre**
Probablemente el proceso murió silencioso. El watchdog (`setInterval` cada 15s) lo detecta y marca como fallido. Si no, apretá `Q` y rearrancá.

**`Repo not found: X`**
La key `X` no está en `repos` de tu config, o el path no existe. Verificá `orchestrator.config.json`.

**`Unknown agent in QUEUE: "Y"`**
La tarea en QUEUE referencia un agente que no está en `agents` del config. Arreglá el nombre o agregá el agente.

**Rate limit infinito con Gemini**
Gemini free tier tiene cuotas bajas. El orquestador reintenta hasta 10 veces; si excedés, queda permanentemente fallido. Esperá al día siguiente o pagá tier.

**Claude no aparece costo**
Solo se captura desde eventos `result` con `total_cost_usd`. Si usás modo `--output-format text` en vez de `stream-json`, no va a haber tracking.

---

## Limitaciones conocidas

- **Windows only shell quoting** — Abacus usa `cmd /c type ... | abacusai ...`. Si tu `WORKSPACE` tiene caracteres raros puede fallar.
- **No autoriza commits, PRs ni pushes** — solo ejecuta agentes. Todo control de git queda manualmente en manos del usuario.
- **Single machine** — no hay distribución de tareas entre hosts.
- **Stdin-only prompting** — si el CLI de un agente no acepta prompt via stdin, hay que configurar `command`/`args` custom.

---

## Contribuir

PRs bienvenidos. Áreas prioritarias:

- Más CLIs (Aider, Continue, etc.)
- Backend de render web (para reemplazar blessed)
- IPC server para integrar con editores (VSCode, etc.)
- Templates de `agents/*.md` para stacks comunes

## Licencia

MIT
