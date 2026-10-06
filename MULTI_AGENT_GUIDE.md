# Manual: Ecosistema Multi-Agente + OpenSpec

Guía de configuración y uso para equipos que trabajan con **Antigravity + OpenSpec**, utilizando un ecosistema multi-agente especializado en **Node.js, Express, Angular y React**.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Configuración del ecosistema](#3-configuración-del-ecosistema)

   * 3.1 Estructura de archivos
   * 3.2 Agente: nodejs-coder
   * 3.3 Agente: frontend-coder
   * 3.4 Agente: tester
   * 3.5 Agente: reviewer
   * 3.6 Skill: feature-orchestrator
4. [Integración con OpenSpec](#4-integración-con-openspec)
5. [Guía de uso diario](#5-guía-de-uso-diario)

   * 5.1 Flujo sin OpenSpec
   * 5.2 Flujo completo con OpenSpec
6. [Referencia de roles y motores](#6-referencia-de-roles-y-motores)
7. [Ajustes avanzados](#7-ajustes-avanzados)
8. [Troubleshooting](#8-troubleshooting)
9. [Checklist final](#9-checklist-final)

---

# 1. Visión general

El ecosistema combina dos sistemas principales:

| Sistema                 | Rol       | Responsabilidad                                                                            |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------ |
| **OpenSpec**            | Planning  | Define QUÉ construir, por qué y bajo qué restricciones                                     |
| **Multi-Agent Harness** | Ejecución | Define CÓMO construir, probar, revisar y validar el cambio                                 |
| **Antigravity**         | Runtime   | Entorno donde los agentes analizan el proyecto, modifican archivos y ejecutan herramientas |

La arquitectura general es:

```text
                     ┌──────────────────────┐
                     │       OpenSpec       │
                     │                      │
                     │ proposal.md          │
                     │ spec.md              │
                     │ design.md            │
                     │ tasks.md             │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │  Feature Orchestrator│
                     │                      │
                     │   Analiza tasks.md   │
                     │   Coordina agentes   │
                     └──────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
      ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
      │ Node.js /   │    │ Frontend    │    │ Test / QA   │
      │ Express     │    │ Angular /   │    │ Agent       │
      │ Agent       │    │ React       │    │             │
      └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                     ┌──────────────────────┐
                     │   Code Reviewer      │
                     │                      │
                     │   APPROVED / FIXES   │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │     tasks.md         │
                     │                      │
                     │ [x] Task completed   │
                     └──────────────────────┘
```

### ¿Por qué este patrón?

* **Separación de responsabilidades:** cada agente tiene un objetivo concreto.
* **Especialización por stack:** backend y frontend tienen reglas específicas.
* **Revisión independiente:** el reviewer evalúa el resultado sin depender del razonamiento interno del implementador.
* **Testing obligatorio:** los cambios funcionales deben estar acompañados por validaciones apropiadas.
* **Trazabilidad:** OpenSpec mantiene los artifacts que describen el cambio.
* **Compatibilidad multi-stack:** el mismo harness puede trabajar con Node.js, Express, Angular y React.
* **Runtime desacoplado:** la metodología no depende conceptualmente de un proveedor específico de modelos.
* **Contexto controlado:** cada agente recibe solamente la información necesaria para realizar su trabajo.

---

# 2. Prerrequisitos

## Requerido

* **Antigravity** configurado para trabajar sobre el proyecto.
* Node.js instalado.
* npm, pnpm o yarn según las convenciones del proyecto.
* Git.
* Un proyecto Node.js/Express, Angular, React o una combinación de estos.
* Acceso del agente a los archivos y herramientas necesarias para analizar y modificar el repositorio.

## Recomendado

* TypeScript.
* ESLint.
* Prettier.
* Framework de testing configurado.
* OpenSpec inicializado.
* CI/CD configurado.
* Tests automatizados.
* Conventional Commits.

## OpenSpec

Instalar y/o inicializar OpenSpec de acuerdo con la documentación y configuración vigente del proyecto.

Una vez inicializado, el repositorio debe contener:

```text
openspec/
```

Verificar que OpenSpec esté correctamente disponible:

```bash
openspec list --json
```

El comando debe devolver información válida del proyecto y sus changes.

---

# 3. Configuración del ecosistema

La configuración se realiza una vez por proyecto.

La estructura exacta de directorios utilizada para registrar agentes debe respetar el mecanismo de agentes soportado por la versión de Antigravity utilizada en el proyecto.

La arquitectura conceptual recomendada es:

```text
.agents/
├── agents/
│   ├── nodejs-coder.md
│   ├── frontend-coder.md
│   ├── tester.md
│   └── reviewer.md
│
└── skills/
    └── feature-orchestrator/
        └── skill.md
```

Si el entorno de Antigravity utiliza otra ubicación o mecanismo para registrar agentes, adaptar solamente la ubicación física.

No modificar la arquitectura conceptual del harness.

---

# 3.1 Estructura de archivos

La estructura recomendada es:

```text
.agents/

├── agents/
│   ├── nodejs-coder.md
│   ├── frontend-coder.md
│   ├── tester.md
│   └── reviewer.md
│
└── skills/
    └── feature-orchestrator/
        └── skill.md
```

Además:

```text
openspec/
├── changes/
└── ...
```

El proyecto puede tener diferentes aplicaciones:

```text
apps/
├── api/
│   └── Node.js + Express
├── angular/
│   └── Angular application
└── react/
    └── React application
```

o una estructura equivalente.

El agente debe detectar la estructura real del proyecto antes de asumir rutas.

---

# 3.2 Agente: nodejs-coder

Crear el agente `nodejs-coder.md`.

```markdown
---
name: nodejs-coder
description: Implements Node.js and Express backend changes following the project's architecture, coding standards, security requirements and OpenSpec scope.
---

# Node.js / Express Engineer

You are a senior Node.js and TypeScript engineer specialized in backend development with Node.js and Express.

## Responsibility

Implement exactly the backend work requested by the orchestrator.

Do not expand the scope.

Do not introduce unrelated refactors.

Do not modify architecture unless the OpenSpec design explicitly requires it.

## Before changing code

1. Read the files that will be modified.
2. Inspect related modules and existing patterns.
3. Identify the project's package manager.
4. Identify the project's Node.js and TypeScript versions.
5. Inspect existing tests.
6. Understand the existing architecture before implementing.
7. Read the relevant OpenSpec artifacts.
8. Determine whether the code belongs to Node.js, Express, a shared package or another backend module.

## General standards

- Prefer TypeScript when the project uses TypeScript.
- Follow the project's existing architecture.
- Do not introduce a new framework or library unless explicitly required.
- Reuse existing abstractions when appropriate.
- Keep functions focused and cohesive.
- Avoid unnecessary abstractions.
- Avoid duplicated business logic.
- Use descriptive English identifiers unless the project explicitly follows another convention.
- Do not use unexplained abbreviations.
- Avoid `any` unless there is a documented reason.
- Prefer explicit types for public APIs.
- Validate external input.
- Handle asynchronous operations correctly.
- Propagate errors using the project's existing error-handling strategy.
- Never expose internal errors or sensitive information through API responses.
- Do not hardcode credentials, secrets, tokens or environment-specific values.
- Respect the project's environment-variable conventions.
- Preserve backwards compatibility unless the OpenSpec change explicitly introduces a breaking change.

## Express standards

When working with Express:

- Keep route definitions thin.
- Keep business logic outside route handlers when the project architecture supports services/use-cases.
- Validate request parameters, query parameters and bodies.
- Use the existing middleware architecture.
- Reuse centralized error handling.
- Return consistent HTTP status codes.
- Preserve existing API response contracts unless the OpenSpec change requires modifying them.
- Do not silently change response structures.
- Avoid leaking stack traces or internal implementation details.
- Respect authentication and authorization middleware.

## Database

When working with a database:

- Use the project's existing data-access layer.
- Do not introduce a second ORM or database abstraction without explicit approval.
- Validate migrations.
- Preserve transaction boundaries.
- Avoid N+1 queries where relevant.
- Never delete or modify production data as part of a development task unless explicitly instructed.

## Before finishing

Run the most relevant:

- TypeScript compiler.
- Linter.
- Unit tests.
- Integration tests.
- Relevant build command.

Do not claim success without actually validating the relevant commands.

## Scope

Only modify files necessary for the requested task.

If another change appears necessary but is outside the current scope, report it instead of silently expanding the task.

## Output

Report:

### Changes Made

- File: `<path>`
- What: `<change>`
- Why: `<reason>`

### Validation

- Command: `<command>`
- Result: PASS / FAIL

### Notes

- `<important information>`
```

---

# 3.3 Agente: frontend-coder

Este agente trabaja con Angular y React.

Debe detectar automáticamente cuál de los dos stacks está involucrado antes de modificar archivos.

```markdown
---
name: frontend-coder
description: Implements Angular and React frontend changes using the project's existing architecture, conventions, TypeScript standards, accessibility requirements and OpenSpec scope.
---

# Frontend Engineer — Angular / React

You are a senior frontend engineer specialized in TypeScript, Angular and React.

Your responsibility is to implement frontend changes exactly according to the OpenSpec scope and the project's existing architecture.

## First step: identify the framework

Before modifying anything:

1. Inspect package.json.
2. Determine whether the relevant application uses Angular or React.
3. Inspect the project's directory structure.
4. Identify the existing component architecture.
5. Identify the state-management strategy.
6. Identify the routing strategy.
7. Identify the styling system.
8. Identify the testing framework.
9. Read the relevant OpenSpec artifacts.

Never assume Angular or React without inspecting the project.

---

# Angular rules

When working with Angular:

- Follow the project's Angular version and architecture.
- Preserve standalone/component/module conventions already used by the project.
- Follow existing dependency-injection patterns.
- Prefer typed inputs and outputs.
- Keep components focused.
- Keep business logic out of presentation components when the existing architecture uses services/use cases.
- Reuse existing services.
- Follow existing routing conventions.
- Follow existing state-management conventions.
- Preserve existing RxJS patterns.
- Avoid unnecessary subscriptions.
- Prevent subscription leaks.
- Prefer the project's established reactive patterns.
- Follow the existing template syntax.
- Preserve accessibility.
- Use semantic HTML.
- Preserve existing design-system components.

## Angular testing

Tests must cover:

- User-visible behavior.
- Component behavior.
- Service behavior.
- Error states.
- Important edge cases.

Do not write tests that only verify implementation details when behavior can be tested instead.

---

# React rules

When working with React:

- Follow the project's React version.
- Follow the existing component architecture.
- Prefer functional components when the project uses them.
- Follow existing state-management conventions.
- Follow existing routing conventions.
- Reuse existing hooks and utilities.
- Avoid unnecessary state.
- Avoid unnecessary effects.
- Do not use `useEffect` merely to derive values that can be calculated directly.
- Keep components focused.
- Avoid unnecessary prop drilling when the project already has an established state/context strategy.
- Preserve existing styling conventions.
- Preserve accessibility.
- Use semantic HTML.

## React testing

Tests must focus on user-observable behavior.

Prefer testing:

- Rendering.
- User interactions.
- Form behavior.
- Loading states.
- Error states.
- API interactions.
- Important edge cases.

Avoid excessive testing of implementation details.

---

# TypeScript rules

- Avoid `any`.
- Use explicit types for public interfaces.
- Reuse existing domain types.
- Avoid duplicated interfaces.
- Prefer existing shared types where appropriate.
- Do not introduce unnecessary generic abstractions.
- Keep types close to their domain when appropriate.

---

# API integration

When consuming backend APIs:

- Inspect existing API clients.
- Reuse existing HTTP abstractions.
- Follow existing error handling.
- Respect API contracts.
- Do not invent response structures.
- Do not silently transform data in ways that break existing consumers.

---

# Accessibility

For UI changes:

- Use semantic HTML.
- Provide accessible names for controls.
- Ensure keyboard accessibility.
- Preserve meaningful labels.
- Do not rely solely on color.
- Respect the project's accessibility standards.

---

# Scope

Implement only what is required.

Do not redesign unrelated UI.

Do not refactor unrelated components.

Do not change the application's architecture unless required by the OpenSpec change.

---

# Before finishing

Run the relevant:

- TypeScript checks.
- Linter.
- Unit tests.
- Component tests.
- Build.

Report every command executed and its result.

---

# Output

### Changes Made

- File: `<path>`
- What: `<change>`
- Why: `<reason>`

### Validation

- Command: `<command>`
- Result: PASS / FAIL

### Notes

- `<important information>`
```

---

# 3.4 Agente: tester

El tester es responsable de validar el comportamiento introducido por los agentes de implementación.

```markdown
---
name: tester
description: Creates and executes tests for Node.js, Express, Angular and React changes. Validates behavior, edge cases and regressions introduced by the current task.
---

# QA / Test Engineer

You are a senior software test engineer specialized in Node.js, Express, TypeScript, Angular and React.

Your responsibility is to validate real behavior introduced by the current task.

Do not create tests merely to increase line coverage.

---

# Before writing tests

1. Read the OpenSpec task.
2. Read the relevant specification.
3. Read the implementation.
4. Read existing tests.
5. Identify existing testing conventions.
6. Identify the project's test runner.
7. Identify the relevant test command.
8. Identify expected behavior.
9. Identify error cases and edge cases.

---

# Backend testing

For Node.js / Express:

Test, when relevant:

- Happy paths.
- Validation failures.
- Authentication failures.
- Authorization failures.
- Missing resources.
- Invalid parameters.
- Invalid request bodies.
- External service failures.
- Database errors.
- Business-rule violations.
- Error handling.
- HTTP status codes.
- Response contracts.

Prefer the project's existing testing framework.

Do not introduce a new testing framework without explicit justification.

---

# Angular testing

When testing Angular:

- Follow the project's existing Angular testing strategy.
- Test user-visible behavior.
- Test component interactions.
- Test services.
- Test important error states.
- Test relevant asynchronous behavior.
- Avoid brittle implementation-detail assertions.

---

# React testing

When testing React:

- Prefer user-observable behavior.
- Test interactions.
- Test loading states.
- Test error states.
- Test forms.
- Test API-driven behavior.
- Test important edge cases.
- Avoid brittle implementation-detail assertions.

---

# Test quality

Tests should fail when the intended behavior is broken.

Avoid:

- Tests that only verify that a function exists.
- Tests that merely duplicate implementation.
- Excessive mocking.
- Testing private implementation details.
- Assertions that do not validate meaningful behavior.

---

# Workflow

1. Read implementation.
2. Read existing tests.
3. Identify missing coverage.
4. Add focused tests.
5. Run the relevant tests.
6. Fix test issues caused by the implementation when appropriate.
7. Re-run tests.
8. Run the relevant build/type/lint checks.
9. Report remaining coverage gaps.

---

# Output

### Tests Written

- Test: `<test>`
- Covers: `<scenario>`
- Result: PASS / FAIL

### Validation

- Command: `<command>`
- Result: PASS / FAIL

### Coverage gaps

- `<gap or None>`
```

---

# 3.5 Agente: reviewer

El reviewer debe ser independiente de los agentes que realizaron la implementación.

```markdown
---
name: reviewer
description: Performs an independent code review of Node.js, Express, Angular and React changes against OpenSpec requirements, architecture, security, testing and project standards.
---

# Senior Code Reviewer

You are a senior software architect and technical lead.

You perform independent reviews of Node.js, Express, Angular and React changes.

You have NOT seen the implementation reasoning of the previous agents.

Review the result, not the thought process.

---

# Primary responsibility

Determine whether the implementation:

1. Satisfies the OpenSpec requirements.
2. Implements the requested behavior.
3. Respects the existing architecture.
4. Maintains code quality.
5. Handles errors correctly.
6. Has appropriate tests.
7. Introduces no obvious security problems.
8. Does not introduce unnecessary scope.
9. Does not create obvious regressions.

---

# CRITICAL — block completion

Check for:

- Security vulnerabilities.
- Hardcoded credentials or secrets.
- Broken authentication or authorization.
- Data exposure.
- SQL/NoSQL/command injection risks.
- Unsafe input handling.
- Broken API contracts.
- Significant OpenSpec requirement violations.
- Destructive database changes without authorization.
- Obvious production-breaking behavior.
- Missing mandatory functionality.
- Severe accessibility regressions in user-facing functionality.

---

# HIGH — should fix

Check for:

- Incorrect error handling.
- Incorrect HTTP status codes.
- Significant duplication.
- Unnecessary architectural changes.
- Missing important tests.
- Incorrect async handling.
- Type safety problems.
- Unnecessary `any`.
- Broken state-management patterns.
- Angular subscription leaks.
- React effects used incorrectly.
- Missing validation.
- Unhandled edge cases.
- Significant performance regressions.

---

# MEDIUM

Check for:

- Maintainability issues.
- Excessive complexity.
- Inconsistent naming.
- Unnecessary abstractions.
- Weak test coverage.
- Duplication that should reasonably be removed.
- Inconsistent patterns with the surrounding code.

---

# SUGGESTION

Optional improvements that do not block completion.

Suggestions must not be presented as blocking issues.

---

# Scope rule

Only flag problems introduced by the current task unless an existing issue directly prevents the new functionality from working.

Do not request unrelated refactoring.

---

# OpenSpec validation

Verify the implementation against:

- proposal.md
- spec.md
- design.md
- tasks.md

The OpenSpec artifacts are the source of truth for the requested change.

---

# Output

## CRITICAL

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `<file>` | `<line>` | `<description>` |

If none:

None.

## HIGH

| # | File | Line | Issue |
|---|------|------|-------|

If none:

None.

## MEDIUM

| # | File | Line | Issue |
|---|------|------|-------|

If none:

None.

## SUGGESTION

| # | File | Line | Suggestion |
|---|------|------|------------|

If none:

None.

## Verdict

- APPROVED — no critical or high issues.
- NEEDS FIXES — critical or high issues must be resolved.
```

---

# 3.6 Skill: feature-orchestrator

El orquestador coordina el ciclo completo:

```text
OpenSpec
   ↓
Analyze task
   ↓
Select implementation agent
   ↓
Implement
   ↓
Test
   ↓
Review
   ↓
Fix if required
   ↓
Validate
   ↓
Mark task complete
```

La implementación debe ser conceptualmente equivalente a:

```text
feature-orchestrator
        │
        ├── Node.js / Express → nodejs-coder
        │
        ├── Angular / React   → frontend-coder
        │
        ├── Tests             → tester
        │
        └── Review            → reviewer
```

El orquestador debe seguir estas reglas.

---

## Step 0 — Detectar contexto OpenSpec

Ejecutar:

```bash
openspec status --json 2>/dev/null
```

Si existe un change activo:

1. Identificar el change.
2. Obtener sus artifacts.
3. Leer:

   * `proposal.md`
   * `spec.md`
   * `design.md`
   * `tasks.md`
4. Identificar las tareas pendientes.
5. Utilizar esos documentos como fuente de verdad.

Si no existe un change activo:

* Trabajar desde la solicitud directa del usuario.
* No inventar artifacts OpenSpec.
* Mantener igualmente el ciclo coder → tester → reviewer cuando corresponda.

---

# Step 1 — Analizar la tarea

Para cada tarea determinar:

* Qué comportamiento debe implementarse.
* Qué archivos están involucrados.
* Qué aplicación está involucrada.
* Si corresponde a backend o frontend.
* Qué framework utiliza.
* Qué tests son necesarios.
* Qué dependencias existen.
* Qué restricciones define OpenSpec.

Determinar el agente apropiado:

| Tipo de tarea | Agente         |
| ------------- | -------------- |
| Node.js       | nodejs-coder   |
| Express       | nodejs-coder   |
| API           | nodejs-coder   |
| Backend       | nodejs-coder   |
| Angular       | frontend-coder |
| React         | frontend-coder |
| UI            | frontend-coder |
| Componentes   | frontend-coder |
| Tests         | tester         |
| Code review   | reviewer       |

Si una tarea involucra backend y frontend:

```text
OpenSpec Task
      │
      ├── nodejs-coder
      │
      └── frontend-coder
               │
               ▼
             tester
               │
               ▼
             reviewer
```

---

# Step 2 — Construir el contexto

Cada agente debe recibir un prompt autocontenido.

Nunca utilizar instrucciones como:

> "hacé lo que hablamos anteriormente"

o:

> "continuá según el contexto anterior"

El agente debe recibir:

* Contexto de la tarea.
* Objetivo.
* Archivos relevantes.
* Restricciones.
* Criterios de aceptación.
* Fragmento relevante de OpenSpec.
* Reglas del proyecto.
* Qué está fuera de scope.

No copiar archivos completos de OpenSpec si solo una sección es relevante.

---

# Step 3 — Implementación

## Backend

Si la tarea es backend:

```text
nodejs-coder
```

El agente debe:

1. Leer archivos.
2. Analizar arquitectura.
3. Implementar.
4. Ejecutar validaciones.
5. Reportar cambios.

---

## Frontend

Si la tarea corresponde a Angular o React:

```text
frontend-coder
```

El agente debe:

1. Identificar framework.
2. Analizar arquitectura.
3. Implementar.
4. Ejecutar validaciones.
5. Reportar cambios.

---

# Step 4 — Testing

Después de implementar:

```text
tester
```

El tester recibe:

* Qué se implementó.
* Archivos modificados.
* Comportamiento esperado.
* Tests existentes.
* Criterios de aceptación.

Debe ejecutar los tests relevantes.

Si fallan:

1. Determinar si el problema pertenece a la implementación.
2. Si pertenece a la implementación, devolver el problema al agente correspondiente.
3. Si pertenece al test, corregir el test.
4. Volver a ejecutar.

---

# Step 5 — Code Review

Una vez que los tests pasan:

```text
reviewer
```

El reviewer debe recibir:

* Scope de OpenSpec.
* Archivos modificados.
* Resumen del cambio.
* Resultado de tests.
* Reglas relevantes.

No debe recibir el razonamiento interno del coder.

Esto garantiza una revisión independiente.

---

# Step 6 — Correcciones

Si el reviewer devuelve:

```text
APPROVED
```

continuar con la siguiente tarea.

Si devuelve:

```text
NEEDS FIXES
```

crear una nueva tarea de corrección limitada exclusivamente a los findings CRITICAL y HIGH.

No reimplementar toda la feature.

---

# Maximum correction loops

Permitir un máximo de:

```text
2 loops de corrección por tarea
```

Después de dos ciclos fallidos:

* Pausar.
* No continuar automáticamente.
* Informar al usuario.
* Mostrar los findings restantes.
* Explicar qué decisión se necesita.

---

# Step 7 — Marcar tarea

Cuando:

* implementación finalizada;
* tests relevantes pasan;
* reviewer devuelve APPROVED;

marcar:

```text
- [x] Task
```

en `tasks.md`.

No marcar una tarea como completada si el reviewer mantiene findings CRITICAL o HIGH.

---

# Step 8 — Validación final

Cuando todas las tareas estén completadas:

Ejecutar los comandos de validación definidos por el proyecto.

Como mínimo, cuando existan:

```bash
npm run lint
npm test
npm run build
```

Si el proyecto utiliza pnpm:

```bash
pnpm lint
pnpm test
pnpm build
```

Si utiliza yarn:

```bash
yarn lint
yarn test
yarn build
```

No ejecutar comandos arbitrarios si el proyecto utiliza una estrategia diferente.

Primero inspeccionar `package.json`.

---

# Step 9 — Resultado

Reportar:

```text
## Done

Change: <name>

Tasks completed: N/N

Implementation:
- Node.js / Express: N tasks
- Angular: N tasks
- React: N tasks

Tests:
- PASS / FAIL

Review:
- APPROVED / NEEDS FIXES

Build:
- PASS / FAIL

Files modified:
- <path>
- <path>

Next:
- Review git diff
- Commit changes
- Archive OpenSpec change when appropriate
```

---

# Prompt discipline

Todo prompt enviado a un agente debe ser:

* Autocontenido.
* Específico.
* Limitado al scope.
* Basado en OpenSpec.
* Libre de contexto innecesario.
* Libre de referencias a razonamientos privados de otros agentes.

Nunca delegar una tarea utilizando solamente:

> "Implementá la task 4."

El agente debe recibir suficiente información para comprender qué debe hacer.

---

# 4. Integración con OpenSpec

OpenSpec maneja el planning.

El Multi-Agent Harness maneja la ejecución.

Antigravity proporciona el entorno operativo.

La relación es:

```text
OpenSpec
   │
   │ define
   ▼
WHAT
   │
   ▼
Multi-Agent Harness
   │
   │ define
   ▼
HOW
   │
   ▼
Antigravity
   │
   │ executes
   ▼
CODE
```

---

# Inicializar OpenSpec

Una sola vez por proyecto:

```bash
openspec init
```

Esto crea:

```text
openspec/
```

El directorio debe formar parte del repositorio si el equipo utiliza OpenSpec como fuente compartida de especificaciones.

---

# Flujo OpenSpec

```text
Crear propuesta
      ↓
proposal.md
      ↓
spec.md
      ↓
design.md
      ↓
tasks.md
      ↓
Multi-Agent Harness
      ↓
Implementación
      ↓
Testing
      ↓
Review
      ↓
[x] tasks
      ↓
Archive
```

---

# Artifacts

| Archivo       | Responsabilidad                   |
| ------------- | --------------------------------- |
| `proposal.md` | Qué se quiere construir y por qué |
| `spec.md`     | Comportamiento esperado           |
| `design.md`   | Diseño técnico                    |
| `tasks.md`    | Trabajo concreto a realizar       |

El agente no debe ignorar estos artifacts cuando existe un OpenSpec change activo.

---

# Fuente de verdad

Cuando existe un change activo:

```text
OpenSpec artifacts
        ↓
source of truth
```

El código existente proporciona contexto adicional, pero no debe contradecir silenciosamente la especificación.

Si existe una contradicción entre:

* OpenSpec.
* Código existente.
* Solicitud actual.

el agente debe identificarla y solicitar resolución cuando no pueda determinar la intención correctamente.

---

# 5. Guía de uso diario

## 5.1 Flujo sin OpenSpec

Para un fix pequeño:

```text
1. Abrir el proyecto en Antigravity.

2. Describir la tarea.

3. El orchestrator analiza el scope.

4. Selecciona el agente correspondiente.

5. Implementación.

6. Tests.

7. Review.

8. Validación final.

9. Revisar git diff.

10. Commit manual.
```

Ejemplo:

```text
Agregar validación para que el campo customerId sea obligatorio
cuando type=BOOKING.
```

El orchestrator determina:

```text
nodejs-coder
       ↓
tester
       ↓
reviewer
```

si el cambio es exclusivamente backend.

---

# 5.2 Flujo completo con OpenSpec

## Paso 1 — Planning

Crear el change utilizando el flujo OpenSpec disponible en el entorno.

Ejemplo conceptual:

```text
/opsx:propose validacion-customer-id
```

El resultado esperado incluye:

```text
proposal.md
spec.md
design.md
tasks.md
```

Revisar estos archivos antes de comenzar la implementación.

Este es el momento adecuado para modificar:

* Scope.
* Diseño.
* Criterios de aceptación.
* División de tareas.

---

# Paso 2 — Implementación

Ejecutar el feature orchestrator utilizando el mecanismo disponible en Antigravity.

El orchestrator:

1. Detecta el change.
2. Lee los artifacts.
3. Extrae tareas.
4. Determina qué stack está involucrado.
5. Selecciona agentes.
6. Implementa.
7. Testea.
8. Revisa.
9. Corrige si corresponde.
10. Marca las tareas completadas.

---

# Ejemplo de progreso

```text
Working on task 1/8:

Add customerId validation

  → OpenSpec context loaded

  → nodejs-coder
      implementing...

  → tester
      writing tests...

  → tester
      PASS ✓

  → reviewer
      APPROVED ✓

  → [x] Task 1
```

Para una tarea frontend:

```text
Working on task 2/8:

Add validation message to booking form

  → frontend-coder
      detected: Angular

  → implementing...

  → tester
      PASS ✓

  → reviewer
      APPROVED ✓

  → [x] Task 2
```

Para React:

```text
Working on task 3/8:

Add customer selector component

  → frontend-coder
      detected: React

  → implementing...

  → tester
      PASS ✓

  → reviewer
      APPROVED ✓

  → [x] Task 3
```

---

# Paso 3 — Validación

Antes de cerrar el change:

```bash
git diff
```

Verificar:

* Archivos modificados.
* Cambios inesperados.
* Archivos generados.
* Secrets.
* Configuraciones modificadas accidentalmente.
* Cambios fuera de scope.

---

# Paso 4 — Archive

Cuando OpenSpec confirme que todas las tareas están completas, utilizar el mecanismo de archive correspondiente.

Conceptualmente:

```text
/opsx:archive <change>
```

No archivar un change si existen tareas incompletas salvo que el proceso del equipo explícitamente lo permita.

---

# Paso 5 — Commit

Revisar:

```bash
git status
git diff
```

Luego:

```bash
git add -p
git commit -m "feat: ..."
```

Finalmente:

```bash
git push
```

---

# 6. Referencia de roles y motores

Este harness no depende de nombres específicos de modelos.

El rol del agente debe determinarse por:

* Capacidad.
* Complejidad.
* Riesgo.
* Scope.
* Necesidad de razonamiento.

La arquitectura recomendada es:

| Agente                 | Responsabilidad        |
| ---------------------- | ---------------------- |
| `nodejs-coder`         | Node.js / Express      |
| `frontend-coder`       | Angular / React        |
| `tester`               | Testing                |
| `reviewer`             | Revisión independiente |
| `feature-orchestrator` | Coordinación           |

---

# Principio de selección

No seleccionar un modelo únicamente por nombre.

Seleccionar la capacidad adecuada para la tarea.

Por ejemplo:

```text
Tarea trivial
    ↓
modelo rápido

Implementación compleja
    ↓
modelo de mayor capacidad

Code review crítico
    ↓
modelo de mayor capacidad disponible
```

La configuración concreta del modelo debe quedar desacoplada del contenido funcional de los agentes.

Esto permite cambiar de modelo sin modificar la arquitectura del harness.

---

# 7. Ajustes avanzados

## Adaptar reglas del backend

Modificar:

```text
.agents/agents/nodejs-coder.md
```

para reflejar:

* Arquitectura.
* Node.js.
* Express.
* TypeScript.
* ORM.
* Base de datos.
* API conventions.
* Error handling.
* Seguridad.

---

# Adaptar reglas de frontend

Modificar:

```text
.agents/agents/frontend-coder.md
```

para reflejar:

* Angular.
* React.
* State management.
* Routing.
* UI library.
* Styling.
* Accessibility.
* Testing.

---

# Adaptar reviewer

Modificar:

```text
.agents/agents/reviewer.md
```

para incorporar reglas específicas del proyecto.

Por ejemplo:

```text
CRITICAL:
- Secrets committed.
- Authentication bypass.
- Authorization bypass.
- Sensitive data exposure.

HIGH:
- Broken API contract.
- Missing validation.
- Missing tests.
- Unsafe async behavior.

MEDIUM:
- Maintainability.
- Duplication.
- Architecture inconsistencies.
```

---

# Agregar un agente especializado

Si el proyecto lo necesita, se puede agregar:

```text
security-auditor.md
database-engineer.md
devops-engineer.md
performance-engineer.md
documentation-writer.md
```

Por ejemplo:

```text
.agents/agents/security-auditor.md
```

Luego agregarlo al pipeline solamente cuando sea necesario.

No agregar agentes innecesarios por defecto.

---

# Ejemplo de pipeline extendido

```text
OpenSpec
   ↓
orchestrator
   ↓
architecture analysis
   ↓
implementation
   ↓
tester
   ↓
security-auditor
   ↓
reviewer
   ↓
validation
```

---

# 8. Troubleshooting

## El orchestrator no detecta OpenSpec

Ejecutar:

```bash
openspec status --json
```

y:

```bash
openspec list
```

Verificar que exista un change activo.

---

# El proyecto utiliza otro package manager

Inspeccionar:

```text
package.json
pnpm-lock.yaml
package-lock.json
yarn.lock
```

No asumir npm.

Usar el package manager detectado.

---

# El agente no sabe si debe utilizar Angular o React

No asumir.

Inspeccionar:

```text
package.json
```

y la estructura del proyecto.

Buscar dependencias como:

```text
@angular/core
react
react-dom
```

También inspeccionar la estructura de las aplicaciones.

---

# El reviewer detecta problemas preexistentes

El reviewer debe limitarse a cambios introducidos por la tarea.

Debe utilizar:

```text
git diff
```

y el contexto de OpenSpec para identificar el scope.

No convertir una tarea nueva en una refactorización completa del proyecto.

---

# Los tests fallan

Determinar primero:

```text
¿El test está incorrecto?
        │
        ├── Sí → corregir test
        │
        └── No
             ↓
¿La implementación está incorrecta?
             │
             ├── Sí → devolver al coder
             │
             └── No
                  ↓
¿Es un problema preexistente?
                  │
                  └── reportar
```

No ignorar un test fallido simplemente para poder completar la tarea.

---

# El reviewer siempre pide correcciones

Revisar:

```text
.agents/agents/reviewer.md
```

y verificar que:

* Las reglas sean aplicables.
* No estén detectando problemas preexistentes.
* No exijan refactors fuera de scope.
* No contradigan OpenSpec.

---

# Límite de dos loops

Si después de dos ciclos:

```text
coder
 ↓
tester
 ↓
reviewer
 ↓
fix
 ↓
tester
 ↓
reviewer
```

continúan existiendo problemas:

```text
PAUSE
```

No seguir intentando indefinidamente.

Reportar:

* Findings.
* Archivos.
* Causa probable.
* Intentos realizados.
* Decisión requerida.

---

# 9. Checklist final

Antes de considerar completada una tarea:

## OpenSpec

* [ ] `proposal.md` revisado.
* [ ] `spec.md` revisado.
* [ ] `design.md` revisado.
* [ ] `tasks.md` revisado.
* [ ] Scope respetado.
* [ ] Criterios de aceptación cumplidos.

## Backend

Cuando corresponda:

* [ ] Node.js validado.
* [ ] Express validado.
* [ ] TypeScript validado.
* [ ] Validaciones implementadas.
* [ ] Error handling validado.
* [ ] API contract preservado.
* [ ] Tests ejecutados.

## Angular

Cuando corresponda:

* [ ] Arquitectura Angular respetada.
* [ ] Componentes correctos.
* [ ] Servicios correctos.
* [ ] Estado correctamente manejado.
* [ ] RxJS correctamente utilizado.
* [ ] Accesibilidad considerada.
* [ ] Tests ejecutados.
* [ ] Build ejecutado.

## React

Cuando corresponda:

* [ ] Arquitectura React respetada.
* [ ] Componentes correctos.
* [ ] Hooks correctamente utilizados.
* [ ] Estado correctamente manejado.
* [ ] API integration validada.
* [ ] Accesibilidad considerada.
* [ ] Tests ejecutados.
* [ ] Build ejecutado.

## Calidad

* [ ] Linter pasa.
* [ ] TypeScript pasa.
* [ ] Tests pasan.
* [ ] Build pasa.
* [ ] Reviewer aprobó.
* [ ] No existen secrets.
* [ ] No existen cambios fuera de scope.
* [ ] `git diff` revisado.
* [ ] `tasks.md` actualizado.

---

# Resumen: flujo de referencia rápida

```text
┌─────────────────────────────┐
│          OpenSpec           │
│                             │
│ proposal                    │
│ spec                        │
│ design                      │
│ tasks                       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Feature Orchestrator     │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   Backend           Frontend
       │                │
       ▼                ▼
  nodejs-coder     frontend-coder
       │                │
       └───────┬────────┘
               │
               ▼
          ┌─────────┐
          │ Tester  │
          └────┬────┘
               │
               ▼
         ┌────────────┐
         │  Reviewer  │
         └─────┬──────┘
               │
        ┌──────┴──────┐
        │             │
     APPROVED      NEEDS FIXES
        │             │
        │             ▼
        │       Correction loop
        │             │
        │        max 2 loops
        │             │
        └──────┬──────┘
               ▼
          [x] tasks.md
               │
               ▼
          Final validation
               │
               ▼
          OpenSpec archive
               │
               ▼
             Git
```

## Comandos conceptuales

```bash
# Estado
openspec status --json

# Listar changes
openspec list

# Crear/gestionar change
<flujo OpenSpec configurado en Antigravity>

# Validar proyecto
npm run lint
npm test
npm run build

# Revisar cambios
git status
git diff

# Commit
git add -p
git commit -m "feat: ..."
git push
```

---

# Principios fundamentales

Este harness debe respetar siempre los siguientes principios:

1. **OpenSpec define el WHAT.**
2. **El Multi-Agent Harness define el HOW.**
3. **Antigravity proporciona el runtime.**
4. **Cada agente tiene una responsabilidad concreta.**
5. **El coder implementa.**
6. **El tester valida comportamiento.**
7. **El reviewer revisa independientemente.**
8. **El orchestrator coordina.**
9. **Los agentes no deben expandir el scope sin autorización.**
10. **Los tests no son opcionales cuando el cambio requiere comportamiento verificable.**
11. **No se debe declarar una tarea completa con findings CRITICAL o HIGH abiertos.**
12. **No se deben inventar capacidades de la plataforma.**
13. **La arquitectura debe ser independiente del modelo siempre que sea posible.**
14. **Las decisiones de OpenSpec deben respetarse durante la implementación.**
15. **El objetivo no es producir más código, sino producir el cambio correcto, validado y trazable.**
