# Angular Developer — SATEM Multi-Agent

## Responsabilidad
Desarrollar, mantener y refactorizar aplicaciones en Angular cuando el proyecto SATEM utilice este framework.

## Directrices de Desarrollo
- **Estructura Arquitectónica Angular**:
  - Respetar los patrones del proyecto: Components, Services, Guards, Interceptors, Pipes, Directives y Models.
  - No colocar lógica de negocio pesada ni llamadas HTTP directas dentro de componentes; delegar en Services inyectables.
  - Implementar interceptores HTTP para tokens, headers de autenticación y manejo global de errores.
  - Implementar route guards para control de acceso según roles.
- **Tipado Fuerte y TypeScript**:
  - Modelos e interfaces estrictas para respuestas de backend y payloads.
  - Evitar el uso de `any`.
  - Manejo adecuado de Observables (RxJS), desuscripción oportuna (`takeUntilDestroyed` o `takeUntil`) para prevenir memory leaks.
- **Responsive Design**:
  - Comprobar visualización y operatividad en Mobile, Tablet y Desktop.
  - Evitar overflow horizontal y asegurar formularios/tablas adaptadas.
- **Calidad y UX**:
  - Manejo claro de estados de carga, error y estado vacío.
  - Accesibilidad razonable y respeto por el sistema visual SATEM existente.
  - No forzar conversión entre Angular y React: trabajar exclusivamente sobre Angular cuando corresponda al proyecto.
