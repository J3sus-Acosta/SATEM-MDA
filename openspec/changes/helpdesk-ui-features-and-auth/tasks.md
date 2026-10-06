# Tasks: Helpdesk UI Features and User Authentication

## 1. Módulo de Autenticación y Sesión de Usuario

- [x] 1.1 Crear el contexto de autenticación global en `frontend/src/context/AuthContext.tsx` con soporte para login, logout, refresh de token, persistencia de sesión y tipado de roles (`OrgAdmin`, `SupportAgent`, `Requester`).
- [x] 1.2 Implementar el componente visual de inicio de sesión en `frontend/src/features/auth/LoginView.tsx` con formulario corporativo, validación de credenciales contra `/api/v1/auth/login` y botones de acceso rápido para cuentas demo (`admin@satem.cl`, `agente`, `cliente`).
- [x] 1.3 Integrar el `AuthContext` y la vista de login en `frontend/src/App.tsx`, implementando redirección automática por rol (agentes/admins al Workbench, clientes al Portal) y menú de usuario en la barra superior con opción de cerrar sesión.
- [x] 1.4 Crear prueba unitaria en `tests/unit/authUiFlow.test.ts` validando el guardado de sesión, selección rápida de usuarios demo y manejo de errores de credenciales inválidas.

## 2. Funcionalidad del Menú Lateral Izquierdo (Vistas ITSM)

- [x] 2.1 Implementar el motor de filtrado por vistas en `frontend/src/features/agent-workbench/TicketWorkbench.tsx` para soportar: "Mis Asignados", "Tickets Sin Asignar", "Tickets Abiertos", "En Espera (Pending)", "Resueltos (Solved)", "Cerrados" y "Todos los Tickets".
- [x] 2.2 Agregar contadores numéricos dinámicos al lado de cada ítem del menú lateral que reflejen la cantidad de tickets en cada categoría en tiempo real.
- [x] 2.3 Añadir filtros por grupo de soporte (ej. Nivel 1, Nivel 2, Infraestructura) en la sección inferior del menú lateral izquierdo.
- [x] 2.4 Crear prueba unitaria en `tests/unit/sidebarViewFiltering.test.ts` verificando que la selección de cada vista filtra correctamente el conjunto de tickets presentado.

## 3. Acciones Rápidas y Modal de Nuevo Ticket para Agentes

- [x] 3.1 Implementar el modal de creación de ticket para agentes en `frontend/src/features/agent-workbench/NewTicketModal.tsx`, permitiendo ingresar solicitante, título, descripción, prioridad y grupo.
- [x] 3.2 Conectar el botón "+ Nuevo Ticket" en la cabecera del Workbench de Agente para disparar el modal e insertar el ticket en la lista de trabajo activa.
- [x] 3.3 Habilitar la edición interactiva de atributos en la barra lateral derecha del ticket activo: selector de estado (`NEW`, `OPEN`, `PENDING`, `SOLVED`, `CLOSED`), selector de prioridad y asignación de agente/grupo.
- [x] 3.4 Agregar selector de macros preconfiguradas en el compositor de respuestas para insertar respuestas automáticas y cambiar el estado en un solo clic.
- [x] 3.5 Crear prueba unitaria en `tests/unit/agentTicketActions.test.ts` validando la creación de tickets desde el modal y la mutación interactiva de atributos.

## 4. Integración con API Backend y Fallback Resiliente

- [x] 4.1 Crear el adaptador de servicios de tickets en `frontend/src/services/ticketClientService.ts` que consuma `GET /api/v1/tickets` y `POST /api/v1/tickets`, implementando fallback transparente a memoria/localStorage si la API no está disponible.
- [x] 4.2 Agregar indicador visual de conectividad en la barra superior (`API En Línea` vs `Modo Local / Demo`) que informe el origen de los datos al usuario.
- [x] 4.3 Sincronizar el envío de respuestas públicas y notas internas desde el Workbench con el backend a través de la capa cliente.

## 5. Compilación, Verificación Integral y Pruebas

- [x] 5.1 Ejecutar la suite completa de pruebas unitarias (`npm test`) asegurando que tanto los tests preexistentes como los nuevos pasen al 100%.
- [x] 5.2 Compilar el bundle de producción del frontend mediante `npm run build:ui` (`npx vite build`) y verificar que no existan errores de tipado o empaquetado.
