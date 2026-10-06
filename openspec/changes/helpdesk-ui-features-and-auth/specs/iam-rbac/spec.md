# Spec Delta: iam-rbac

## ADDED Requirements

### Requirement: Web User Login and Session Experience
The system MUST (El sistema DEBE) presentar una vista de inicio de sesión empresarial en el navegador que solicite credenciales al usuario, valide la respuesta con el endpoint `/api/v1/auth/login`, preserve la sesión autenticada con token JWT y redirija automáticamente al módulo correspondiente de acuerdo al rol del usuario.

#### Scenario: User successfully logs in via web form
- **WHEN** un usuario introduce su correo y contraseña válidos y presiona "Iniciar Sesión"
- **THEN** el sistema autentica contra el backend, guarda el token en memoria/cliente, establece la cookie de refresh token y redirige a la vista correspondiente a su perfil

#### Scenario: Role-based view access routing
- **WHEN** un usuario con rol `Requester` inicia sesión en la plataforma
- **THEN** la aplicación lo redirige exclusivamente al Portal del Solicitante, ocultando el Workbench de Agente y la Consola de Administración

#### Scenario: Quick demo login switch
- **WHEN** un evaluador o desarrollador utiliza los accesos directos de login demostrativo en la pantalla de acceso
- **THEN** los campos de correo y contraseña se auto-completan con las credenciales precargadas del rol seleccionado (Administrador, Agente o Cliente) para facilitar la prueba
