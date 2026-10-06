---
name: satem-code-review
description: Realiza una revisión integral del código y arquitectura de un proyecto SATEM (backend, frontend, base de datos, seguridad, testing, DevOps y código sin uso).
---

# SATEM Code Review

Realiza una revisión integral del proyecto SATEM.

## 1. Arquitectura

Revisar:

- separación de responsabilidades
- duplicación
- acoplamiento
- dependencias
- código muerto

## 2. Backend

Revisar:

- Node.js
- TypeScript
- Express
- controllers
- services
- middleware
- validaciones
- errores
- APIs

## 3. Database

Revisar:

- Prisma
- modelos
- relaciones
- índices
- migraciones
- campos sin uso
- queries innecesarias

## 4. Frontend

Si existe React:

- componentes
- hooks
- estado
- responsive
- accesibilidad

Si existe Angular:

- components
- services
- guards
- interceptors
- state
- responsive
- accesibilidad

## 5. Seguridad

Revisar:

- autenticación
- autorización
- JWT
- cookies
- secretos
- CORS
- CSRF
- injection
- IDOR
- validación

## 6. Testing

Revisar:

- cobertura
- happy path
- errores
- edge cases
- regresiones
- tests de API

## 7. Infraestructura

Revisar:

- Docker
- EasyPanel
- variables de entorno
- health checks
- logs
- migrations
- producción

## 8. Base de datos y código sin uso

Buscar:

- campos sin uso
- variables sin uso
- funciones sin uso
- endpoints sin consumidores
- componentes sin consumidores
- modelos sin referencias
- tablas potencialmente obsoletas
- imports sin uso

## Clasificación de Hallazgos

### CRITICAL

Problemas que pueden provocar:

- vulnerabilidad de seguridad
- pérdida de datos
- corrupción de datos
- caída del sistema
- incumplimiento de reglas fundamentales SATEM

### HIGH

Problemas importantes que deberían corregirse antes del merge o despliegue.

### MEDIUM

Problemas de arquitectura, mantenibilidad o calidad del código.

### LOW

Mejoras menores y estilo.

### SUGGESTIONS

Mejoras opcionales u optimizaciones futuras.

## Regla de Ejecución

Nunca modificar código durante una revisión salvo que el usuario lo solicite explícitamente.
Presentar el reporte estructurado con severidades, archivos, líneas y sugerencia concreta de corrección.
