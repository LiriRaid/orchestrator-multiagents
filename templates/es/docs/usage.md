# Uso

## Flujo recomendado

### 1. Instalar el CLI globalmente

```bash
npm i -g @liriraid/orchestrator-multiagents
```

### 2. Crear un workspace hermano para un proyecto

```bash
orchestrator-multiagents init-workspace C:/code/mi-proyecto
```

Si no pasas idioma, el CLI preguntará si quieres `EN` o `ES`. También puedes elegirlo directo:

```bash
orchestrator-multiagents init-workspace C:/code/mi-proyecto --lang en
orchestrator-multiagents init-workspace C:/code/mi-proyecto --lang es
```

### 3. Abrir el workspace del orquestador

Usa dos terminales:

- una para la TUI
- otra para Claude Code

### 4. Iniciar la TUI

```bash
orchestrator-multiagents ink --paused
```

### 5. Iniciar Claude en el workspace del orquestador

Luego dile:

```text
Lee ORCHESTRATOR.md, asume el rol de orquestador y arranca.
```

### 6. Pedir trabajo

Ejemplos:

- `explora esta carpeta de componentes`
- `analiza este flujo`
- `prepara proposal, spec y tasks`
- `verifica que la implementación cumpla la spec`

Claude debe rutear naturalmente a las skills locales correctas del orquestador y reflejar ese flujo en la TUI.
