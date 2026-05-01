# Orquestador Multiagente (agentflow-ai)

> by **LiriRaid**

**Sistema de Orquestación Multiagente para Desarrollo con IA**

Un workspace reutilizable que coordina **múltiples agentes de IA** (Claude, Codex, OpenCode, etc.) para trabajar **en paralelo** en proyectos reales, manteniendo el repositorio del proyecto **completamente limpio** de archivos del orquestador.

```text
workspace-proyecto/
  mi-proyecto/          # Proyecto real (permanece limpio)
  orchestrator-mi-proyecto/  # Workspace del orquestador (generado)
```

## 🎯 ¿Qué hace?

- **Coordina múltiples agentes de IA** (Claude, Codex, OpenCode, Gemini, Cursor, Abacus) para trabajar simultáneamente en tu proyecto.
- **Monitoreo en tiempo real** con una TUI moderna que muestra el estado en vivo de agentes, cola y progreso.
- **Delegación automática de tareas** según la especialización del agente (análisis, implementación, revisión de código).
- **Memoria persistente** con Engram para mantener el contexto entre sesiones.
- **Soporte para SDD (Spec-Driven Development)** con OpenSpec para cambios grandes y multifase.
- **Sistema de fallback automático** que reasigna tareas cuando un agente falla o alcanza límites de cuota.
- **Soporte multi-idioma** (español e inglés) para todas las plantillas y documentación.

## ✨ Características Clave

### 1. **Modelo de Workspace Sibling**
- El orquestador crea un **workspace separado** al lado de tu proyecto real.
- Tu repositorio del proyecto **permanece completamente limpio** (sin `QUEUE.md`, `logs/`, etc.).
- Los agentes trabajan en los archivos reales del proyecto mediante rutas absolutas configuradas en `orchestrator.config.json`.

### 2. **Coordinación Multiagente**
| Agente | Rol | Prioridad | Notas |
|--------|-----|----------|-------|
| **Claude-Orquestador** | Coordinador de sesión | - | Nunca implementa código directamente; delega a workers |
| **Codex** | Implementación primaria | 1ra opción | Tareas estructuradas, tests, docs |
| **OpenCode** | Análisis + Implementación | 2da opción | Usa Mistral Medium 3.5 128B para código |
| **Claude-Worker** (Backend/Frontend) | Fallback | 3ra opción | Toma el relevo si Codex/OpenCode fallan |
| **Gemini** | Revisión/auditoría | Opcional | Deshabilitado por defecto |
| **Cursor/Abacus** | Tareas mecánicas | Opcional | Deshabilitado por defecto |

### 3. **Operación en Tiempo Real**
- **fs.watch en QUEUE.md**: Detecta cambios en **~1-2 segundos** (Linux/macOS: monitoreo directo de archivo; Windows: fallback a monitoreo de directorio).
- **Actualizaciones en vivo de la TUI**: El dashboard se refresca automáticamente cuando se agragan, inician o completan tareas.
- **Notificaciones instantáneas**: Claude-Orquestador recibe alertas en `INBOX.md` y `NOTIFY.md` cuando las tareas finalizan.

### 4. **Delegación Inteligente de Tareas**
- **Tareas de análisis** → Siempre asignadas a **OpenCode**.
- **Tareas de implementación** → Asignadas a **Codex** (1ra) → **OpenCode** (2da, si usa Mistral Medium 3.5 128B) → **Claude-Worker** (3ra).
- **Cadena de fallback**: `Codex → OpenCode → Claude-Worker` (automático).

### 5. **Memoria Persistente y SDD**
- **Engram**: Almacena decisiones, bugs y hallazgos entre sesiones.
- **OpenSpec**: Soporta `proposal.md`, `spec.md`, `design.md`, `tasks.md`, y `verify-report.md` para cambios grandes.
- **Handoffs**: Resúmenes de sesión para continuidad.

## 🚀 Instalación

### CLI Global (Recomendado)
```bash
npm i -g @liriraid/agentflow-ai
```

### Desarrollo Local
```bash
git clone https://github.com/LiriRaid/agentflow-ai.git
cd agentflow-ai
npm install
```

## 🛠️ Inicio Rápido

### 1. Crear un Workspace del Orquestador
```bash
# Interactivo (pregunta el idioma)
agentflow init-workspace C:/code/mi-proyecto

# Directo (Inglés)
agentflow init-workspace C:/code/mi-proyecto --lang en

# Directo (Español)
agentflow init-workspace C:/code/mi-proyecto --lang es
```
Esto crea un workspace hermano (ej: `orchestrator-mi-proyecto/`) con todos los archivos de configuración.

### 2. Configurar Repositorios
Edita `orchestrator.config.json` en el workspace generado:
```json
{
  "repos": {
    "backend": "C:/code/mi-backend",
    "frontend": "C:/code/mi-frontend"
  }
}
```

### 3. Iniciar la TUI
```bash
cd orchestrator-mi-proyecto
agentflow ink --paused
```
**Controles:**
- `S`: Iniciar/Reanudar
- `P`: Pausar
- `R`: Recargar cola
- `Q`: Salir (detiene todos los agentes)

### 4. Abrir Claude Code
Abre una segunda terminal en el **workspace del orquestador** (no en el proyecto real):
```bash
cd orchestrator-mi-proyecto
claude
```
Luego ejecuta:
```
Lee ORCHESTRATOR.md y arranca.
```

### 5. Solicitar Trabajo
Ejemplos:
- `"Explora este proyecto"` → OpenCode analiza y reporta.
- `"Agrega autenticación JWT"` → OpenCode analiza, luego Codex/OpenCode implementan.
- `"Refactoriza la capa de API"` → OpenCode explora, luego los workers implementan en paralelo.

## 📁 Estructura del Workspace

El workspace generado incluye:

```text
orchestrator-mi-proyecto/
├── ORCHESTRATOR.md      # Reglas principales para la sesión del orquestador
├── CLAUDE.md            # Reglas de enrutamiento para Claude
├── QUEUE.md             # Cola de tareas activa (TASK-NNN | título | agente | ...)
├── ENGRAM.md            # Convenciones de memoria persistente
├── orchestrator.config.json  # Repos, agentes, modelos y perfiles
├── agents/              # Instrucciones específicas por agente
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── CODEX.md
│   └── OPENCODE.md
├── .claude/             # Skills y configuración local de Claude
│   └── skills/          # Skills del orquestador (init, explore, etc.)
├── .codex/              # Configuración de Codex
├── .opencode/           # Configuración de OpenCode
├── openspec/            # Artefactos SDD
│   ├── changes/
│   └── templates/
├── docs/                # Documentación
├── logs/                # Logs de ejecución
├── handoffs/            # Handoffs de sesión
└── progress/            # Reportes de progreso de agentes
```

## 🎛️ Configuración

### Configuración de Agentes (`orchestrator.config.json`)
```json
{
  "projectName": "Mi Proyecto",
  "workspaceLanguage": "es",
  "maxConcurrent": 5,
  "pollIntervalSeconds": 5,  // Polling de fallback (realtime usa fs.watch)
  "taskTimeoutMinutes": 30,
  "repos": {
    "backend": "C:/code/mi-backend",
    "frontend": "C:/code/mi-frontend"
  },
  "agentProfiles": {
    "claude": { "enabled": true, "localConfigDir": ".claude" },
    "codex": { "enabled": true, "localConfigDir": ".codex" },
    "opencode": { "enabled": true, "localConfigDir": ".opencode" }
  },
  "agents": {
    "Backend": { "cli": "claude", "defaultRepo": "backend", "model": "sonnet" },
    "Frontend": { "cli": "claude", "defaultRepo": "frontend", "model": "sonnet" },
    "Codex": { "cli": "codex", "defaultRepo": "backend", "model": "gpt-5.5" },
    "OpenCode": { "cli": "opencode", "defaultRepo": "frontend", "model": "auto" }
  }
}
```

### Selección de Modelo
- Usa `"model": "auto"` para que el agente use el modelo configurado por defecto en tu sistema (ej: Mistral Medium 3.5 128B para OpenCode).
- Especifica un modelo explícitamente (ej: `"model": "gpt-5.5"`) para sobrescribir.

## 🔄 Ejemplo de Flujo de Trabajo

1. **Solicitud del Usuario**: `"Agrega autenticación JWT al backend."`
2. **Claude-Orquestador**:
   - Crea `TASK-001` (OpenCode): `"Analizar sistema de autenticación actual"`
   - Espera el reporte de OpenCode en `progress/PROGRESS-OpenCode.md`
3. **OpenCode**:
   - Analiza el codebase.
   - Escribe los hallazgos en `progress/PROGRESS-OpenCode.md` y `INBOX.md`.
4. **Claude-Orquestador**:
   - Lee el reporte de OpenCode.
   - Crea `TASK-002` (Codex): `"Implementar autenticación JWT"` (depende de TASK-001).
5. **Codex**:
   - Implementa la funcionalidad.
   - Reporta la finalización en `progress/PROGRESS-Codex.md`.
6. **TUI**:
   - Muestra actualizaciones en tiempo real (estado de tareas, actividad de agentes, costos).

## 📊 Agentes Soportados y Modelos

| Agente | CLI | Modelo por Defecto | ¿Implementa? | Notas |
|--------|-----|---------------------|--------------|-------|
| Backend | `claude` | sonnet | ✅ Sí | Claude-Worker para tareas de backend |
| Frontend | `claude` | sonnet | ✅ Sí | Claude-Worker para tareas de frontend |
| Codex | `codex` | gpt-5.5 | ✅ Sí | Implementación primaria |
| OpenCode | `opencode` | auto | ✅ **Sí** (con Mistral Medium 3.5 128B) | Implementación secundaria |
| Gemini | `gemini` | auto | ❌ No | Solo auditorías/revisiones |
| Cursor | `cursor` | auto | ❌ No | Solo ediciones masivas |
| Abacus | `abacusai` | auto | ❌ No | Solo tareas pequeñas y enfocadas |

## 🛡️ Seguridad y Mejores Prácticas

- **Sin commits automáticos**: Los agentes nunca ejecutan `git commit` o `git push`.
- **Sin modo YOLO por defecto**: El modo seguro está activado a menos que se use `--yolo`.
- **Claude como revisor**: Claude-Orquestador valida todo el trabajo antes de la aprobación del usuario.
- **Repositorios limpios**: Los archivos del proyecto permanecen intactos; los archivos del orquestador viven en el workspace hermano.
- **Fallback seguro**: Las tareas se reasignan automáticamente si un agente falla.

## 📚 Documentación

- **Reglas Principales**: Ver `ORCHESTRATOR.md` en el workspace generado.
- **Enrutamiento de Agentes**: Ver `CLAUDE.md`.
- **Arquitectura**: Ver `docs/architecture.md`.
- **OpenSpec**: Ver `openspec/FLOW.md`.

## 🤝 Reconocimientos

Inspirado en [Orquestador-AI](https://github.com/ariellontero/Orquestador-AI) de Ariel Lontero (MIT). 
Construido desde cero con una arquitectura moderna: **TUI Ink + React, paquete npm, fs.watch en tiempo real, plantillas multi-idioma y coordinación multiagente**.

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

Ese es el modelo recomendado para usar el orquestador sin ensuciar el repo real del producto.

## Instalación desde npm

Nombre del paquete:

```bash
@liriraid/agentflow-ai
```

La página de npm puede mostrar el snippet genérico:

```bash
npm i @liriraid/agentflow-ai
```

pero **ese no es el flujo recomendado** para este proyecto.

### Instalación global recomendada

Instala el CLI una sola vez:

```bash
npm i -g @liriraid/agentflow-ai
```

Luego, para cada proyecto real, crea un workspace sibling del orquestador:

```bash
agentflow init-workspace C:/code/mi-proyecto
```

El installer preguntará si quieres generar el workspace en **EN** o **ES**. También puedes pasarlo directo:

```bash
agentflow init-workspace C:/code/mi-proyecto --lang en
agentflow init-workspace C:/code/mi-proyecto --lang es
```

Eso debería dejar algo así:

- proyecto real:
  - `C:/code/mi-proyecto`
- workspace del orquestador:
  - `C:/code/orchestrator-mi-proyecto`

### Alternativa sin instalación global

Si no quieres instalarlo globalmente, puedes usar `npx`:

```bash
npx @liriraid/agentflow-ai-ai init-workspace C:/code/mi-proyecto --lang es
```

Ese comando crea un workspace reusable del orquestador junto al proyecto real.

## Instalación desde el repo fuente

Si vas a modificar el orquestador mismo:

```bash
git clone https://github.com/LiriRaid/agentflow.git
cd agentflow
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
npm i -g @liriraid/agentflow-ai
```

### 2. Crear el workspace del orquestador

```bash
agentflow init-workspace C:/code/mi-proyecto --lang es
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
agentflow ink --paused
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
- **Claude-Worker** (`Backend` / `Frontend`) para tomar una tarea de código en paralelo cuando haya trabajo independiente suficiente o como fallback
- **OpenCode** para lectura, exploración, contexto e implementación cuando se le asigne
- **Codex** para implementación estructurada y apoyo técnico, incluyendo apoyo frontend acotado cuando la TASK lo indique
- cambios sensibles o resultados dudosos deben volver a **Claude** para validación

La idea es que los agentes trabajen, pero no autoacepten todo ciegamente. La sesión Claude-Orquestador coordina y revisa; los Claude-Workers ejecutan tareas asignadas por cola. El usuario conserva la aprobación final, con Claude como filtro principal de calidad.

## UIs disponibles

### Ink

Comandos:

```bash
agentflow ink
agentflow ink --paused
agentflow ink --yolo
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
agentflow ink --yolo
```

Ese modo no es el default y debe usarse solo cuando realmente lo decidas.

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
agentflow openspec:new -- add-mi-cambio
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
agentflow agent-config:init
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
      "model": "gpt-5.5",
      "instructionsFile": "agents/CODEX.md"
    },
    "OpenCode": {
      "cli": "opencode",
      "profile": "opencode",
      "defaultRepo": "backend",
      "model": "opencode/glm-5-free",
      "instructionsFile": "agents/OPENCODE.md"
    }
  }
}
```

## Controles de la TUI

| Tecla | Acción                |
| ----- | --------------------- |
| `S`   | iniciar / reanudar    |
| `P`   | pausar                |
| `R`   | recargar `QUEUE.md`   |
| `Q`   | salir y matar agentes |

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
