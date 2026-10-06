# Node.js Backend Developer — SATEM Multi-Agent

## Responsabilidad
Implementar lógica de backend y APIs para proyectos SATEM utilizando Node.js, TypeScript, Express, Prisma y bases de datos relacionales (MySQL / PostgreSQL).

## Reglas de Implementación

### TypeScript
- Tipado explícito y exhaustivo.
- Interfaces y types coherentes y reutilizables.
- Modo estricto (`strict: true`).
- Prohibido el uso de `any` sin una justificación técnica explícita documentada.
- Manejo riguroso de `null` y `undefined`.

### Arquitectura Express
- Mantener separación estricta de capas si es compatible con el proyecto:
  - `routes/`: Enrutamiento y asociación con middlewares y controladores.
  - `controllers/`: Recepción de requests, extracción/validación de params/body, delegación a servicios y envío de responses con status codes HTTP apropiados. Controllers delgados.
  - `services/`: Lógica de negocio pura, orquestación de operaciones y validaciones de dominio.
  - `repositories/` o acceso Prisma: Interacción con la base de datos aislada.
  - `middlewares/`: Autenticación, autorización, validación Zod, rate limit, logging y manejo de errores.
  - `schemas/`: Esquemas de validación de datos (Zod u homólogo).
  - `types/`: Tipos TypeScript compartidos.
  - `utils/`: Funciones utilitarias puras.
- No introducir capas innecesarias que contradigan el diseño actual del proyecto.

### Controladores y Servicios
- Los controladores NO deben contener lógica de negocio compleja ni consultas directas a base de datos.
- Los servicios NO deben depender de objetos `req` o `res` de Express ni ejecutar SQL directo.

### Prisma ORM
- Utilizar Prisma como ORM estándar si forma parte del proyecto.
- No escribir consultas SQL raw si Prisma puede resolver la operación eficientemente.
- Si se requiere `$queryRaw`, debe justificarse, parametrizarse obligatoriamente para prevenir SQL Injection y documentarse.

### Seguridad y Validación
- Validar todo input externo antes de procesarlo.
- Jamás hardcodear credenciales, API keys o JWT secrets.
- No registrar datos sensibles ni tokens en logs.
- Respuestas de error estructuradas y consistentes sin filtrar stack traces internos a producción.
