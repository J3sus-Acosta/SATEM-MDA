# SATEM — Manual Multi-Agente + OpenSpec

## SATEM Soluciones Inteligentes SpA

Manual y guía permanente de desarrollo y operación para proyectos SATEM utilizando la combinación de **Antigravity + OpenSpec** y el ecosistema multi-agente especializado.

---

## 1. Arquitectura General

```text
                 SATEM
                   │
                   ▼
              Antigravity
                   │
                   ▼
               OpenSpec
                   │
          ┌────────┴────────┐
          │                 │
       Planning         Tasks
          │                 │
          └────────┬────────┘
                   ▼
              Orchestrator
                   │
       ┌───────────┼────────────┐
       │           │            │
   Backend      Frontend      Database
       │           │            │
       └───────────┼────────────┘
                   ▼
                 Tests
                   │
                   ▼
               Security
                   │
                   ▼
                Review
                   │
                   ▼
               Approved
                   │
                   ▼
             OpenSpec archive
```

---

## 2. Agentes Especializados

| Agente | Responsabilidad | Archivo de Instrucciones |
| --- | --- | --- |
| **orchestrator** | Coordina el ciclo completo de implementación | `.agents/subagents/orchestrator.md` |
| **requirements-analyst** | Analiza necesidades de negocio y requisitos técnicos | `.agents/subagents/requirements-analyst.md` |
| **solution-architect** | Diseña arquitectura técnica antes de codificar | `.agents/subagents/solution-architect.md` |
| **backend-node** | Desarrollo backend en Node.js / Express / TypeScript | `.agents/subagents/backend-node.md` |
| **frontend-react** | Desarrollo interfaces React | `.agents/subagents/frontend-react.md` |
| **frontend-angular** | Desarrollo interfaces Angular | `.agents/subagents/frontend-angular.md` |
| **database-prisma** | Gestión de Prisma schema, migraciones y queries | `.agents/subagents/database-prisma.md` |
| **api-architect** | Diseño y auditoría de contratos REST | `.agents/subagents/api-architect.md` |
| **tester** | Pruebas automatizadas y aseguramiento de calidad | `.agents/subagents/tester.md` |
| **debugger** | Diagnóstico y resolución de causa raíz de errores | `.agents/subagents/debugger.md` |
| **security-reviewer** | Auditoría integral de seguridad y secretos | `.agents/subagents/security-reviewer.md` |
| **code-reviewer** | Revisión de código, arquitectura y código sin uso | `.agents/subagents/code-reviewer.md` |
| **performance-reviewer** | Análisis de performance, N+1 queries y latencia | `.agents/subagents/performance-reviewer.md` |
| **devops** | Empaquetado Docker, VPS, EasyPanel y despliegues | `.agents/subagents/devops.md` |
| **documentation** | Documentación técnica, API y guías de uso | `.agents/subagents/documentation.md` |

---

## 3. Flujo Recomendado de Trabajo

### 3.1 Feature Pequeña o Corrección Rápida

```text
Usuario
   ↓
Antigravity
   ↓
Orchestrator
   ↓
Implementación (Backend / Frontend / Database)
   ↓
Tests
   ↓
Review
```

### 3.2 Feature Compleja / Cambio de Arquitectura

```text
1. OpenSpec proposal (proposal.md)
2. Requirements analysis (requirements-analyst)
3. Architecture design (solution-architect)
4. OpenSpec specification (specs/ y design.md)
5. Tasks breakdown (tasks.md)
6. Orchestrator asigna tareas ordenadas
7. Backend / Frontend / Database implementan
8. Tests automatizados (tester)
9. Security review (security-reviewer)
10. Code review (code-reviewer)
11. Performance review (performance-reviewer)
12. DevOps validation (devops)
13. Marcar tareas completadas en tasks.md
14. OpenSpec archive
```

---

## 4. Reglas Mandatorias para Todos los Agentes

1. **Leer antes de modificar**: Inspeccionar dependencias, contratos y consumidores antes de editar cualquier archivo.
2. **OpenSpec es la fuente de verdad**: No inventar requerimientos que contradigan las especificaciones.
3. **Respetar el stack existente**: No forzar cambios de framework (p. ej. React a Angular o viceversa) ni de base de datos (MySQL a PostgreSQL o viceversa).
4. **Evitar cambios fuera de alcance**: Cada tarea limita su alcance a los archivos autorizados.
5. **No introducir dependencias sin justificación**: Evaluar alternativas nativas y existentes.
6. **Cero secretos en código**: Prohibido hardcodear contraseñas, JWT secrets o API keys.
7. **No realizar cambios destructivos en producción**: Migraciones seguras y no destructivas.
8. **Pruebas obligatorias**: Cada nueva lógica debe contar con tests automatizados.
9. **Reportar siempre**: Cada agente debe emitir su reporte de trabajo y validación.

---

## 5. Detección de Código y Base de Datos sin Uso

El revisor y los agentes deben verificar sistemáticamente:
- Variables y tipos no utilizados.
- Imports no utilizados.
- Funciones, métodos o clases sin referencias.
- Endpoints en Express sin consumidores en frontend ni tests.
- Componentes o hooks de frontend huérfanos.
- Modelos o campos en `schema.prisma` sin referencias en el código.
- Dependencias no utilizadas en `package.json`.
- Variables de entorno declaradas pero nunca leídas.

*Regla*: Comprobar referencias indirectas (reflexión, imports dinámicos, scripts) antes de confirmar que un elemento está sin uso.

---

## 6. Detección de Inconsistencias

- Frontend esperando campos que el API no entrega.
- Backend esperando campos que el frontend no envía.
- Modelos Prisma discrepantes con los DTOs de TypeScript.
- Variables de entorno usadas en código pero ausentes en `.env.example`.
- Endpoints documentados pero inexistentes en el código.
- Roles de usuario definidos en frontend sin validación estricta en backend.
- Migraciones Prisma pendientes o no aplicadas.

---

## 7. Responsive Design

Toda aplicación web desarrollada para SATEM debe validar:
- **Mobile**: Menú adaptado, formularios apilados verticalmente, botones accesibles por tacto, sin scroll horizontal.
- **Tablet**: Layout fluido, tarjetas adaptadas, modales centrados.
- **Desktop**: Aprovechamiento adecuado de pantalla, barras laterales, tablas con paginación y filtros.

Puntos de control al modificar pantallas:
1. Vista Desktop.
2. Vista Tablet.
3. Vista Mobile.
4. Navegación y menús.
5. Tablas y listados.
6. Formularios y validaciones visuales.
7. Modales y diálogos.
8. Botones y llamadas a la acción.
9. Control riguroso de overflow horizontal (`overflow-x: hidden` / control de anchos).

---

## 8. Reglas de Base de Datos y Producción

### Protocolo de Modificación de Base de Datos
1. Leer `schema.prisma`.
2. Identificar relaciones y foreign keys.
3. Identificar servicios que consumen los modelos.
4. Revisar migraciones existentes.
5. Evaluar compatibilidad con datos existentes.
6. Crear migración no destructiva con `npx prisma migrate dev`.
7. Ejecutar tests de integración.
8. Validar consistencia.

### Operaciones Estrictamente Prohibidas en Producción
- `DROP DATABASE` o `DROP TABLE`.
- `TRUNCATE` o eliminación masiva de registros.
- `prisma db push` directo en producción.
- Migraciones que eliminen columnas con datos sin respaldo y autorización expresa.

---

## 9. Variables de Entorno y Secretos

- Nunca almacenar credenciales reales en Git, código fuente, README o tareas OpenSpec.
- Utilizar `.env` para desarrollo local (ignorado en `.gitignore`).
- Mantener `.env.example` actualizado con nombres de variables y valores dummy descriptivos.
- En EasyPanel / VPS, configurar las variables en los paneles de entorno protegidos.

---

## 10. Control de Versiones con Git

- Comprobar estado inicial con `git status` y `git branch`.
- Nunca sobrescribir trabajo no guardado del usuario.
- No ejecutar `git reset --hard` ni `git clean -fd` automáticamente.
- Realizar commits atómicos y descriptivos siguiendo Conventional Commits.

---

## 11. Reporte Individual de Agente

Todo agente debe emitir al finalizar su tarea:

```markdown
## Agent Report

### Objective
Objetivo de la tarea asignada.

### Files analyzed
Archivos leídos e inspeccionados.

### Files modified
Archivos modificados o creados.

### Changes
Descripción detallada de los cambios implementados.

### Validation
Comandos, pruebas o análisis ejecutados para validar.

### Problems
Dificultades o advertencias encontradas.

### Remaining work
Tareas pendientes o siguientes pasos recomendados.
```

---

## 12. Reporte Final del Orchestrator

Al concluir la implementación de un cambio:

```markdown
# SATEM Implementation Report

## Change
<nombre del cambio>

## Objective
<objetivo comercial y técnico>

## Tasks
<completadas>/<totales>

## Files modified
<lista de archivos modificados/creados>

## Database
<impacto en schema y migraciones>

## API
<impacto en contratos REST y endpoints>

## Frontend
<impacto en vistas y componentes>

## Security
PASS / FINDINGS

## Tests
PASS / FAIL

## Build
PASS / FAIL

## Code Review
APPROVED / NEEDS FIXES

## Performance
PASS / FINDINGS

## Deployment
PASS / NOT REQUIRED

## OpenSpec
COMPLETE / INCOMPLETE

## Remaining risks
<lista de riesgos o supuestos pendientes>

## Recommendation
<recomendación de merge, despliegue o acción requerida>
```

---

## 13. Comandos de Referencia

### Node.js y Dependencias
```bash
npm install
npm run build
npm test
npm run lint
npm run typecheck
```

### Prisma ORM
```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev --name <nombre>
npx prisma migrate status
```

### OpenSpec CLI
```bash
openspec list
openspec list --json
openspec validate
```
