import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { helpdeskSocketServer } from './infrastructure/websocket/socketServer';
import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import { slaMonitorJob } from './jobs/slaMonitorJob';
import { eventBus } from './infrastructure/events/eventBus';

// Montar rutas API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tickets', ticketRoutes);

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Conectar WebSockets con soporte de colisiones
helpdeskSocketServer.attach(server, process.env.CORS_ORIGIN || '*');

// Conectar monitor de SLAs al EventBus
slaMonitorJob.setEventEmitter({
  emit: (event, payload) => {
    (eventBus as any).emit(event, payload);
  },
});
slaMonitorJob.start(60000); // Monitoreo cada 1 minuto

if (process.env.NODE_ENV !== 'test') {
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [ERROR] El puerto ${PORT} ya está en uso.`);
      console.error(`💡 Causa habitual: El contenedor Docker 'satem-helpdesk-api' u otro proceso ya está ocupando el puerto ${PORT}.`);
      console.error(`👉 Si deseas ejecutar en local con ts-node: detén el contenedor de la API con 'docker compose stop helpdesk-api' (dejando la BD activa).`);
      console.error(`👉 O bien, define otro puerto en tu archivo .env (ejemplo: PORT=4001).\n`);
      process.exit(1);
    } else {
      console.error('Error al iniciar el servidor:', err);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`[SATEM Helpdesk] Servidor activo en puerto ${PORT}`);
    console.log(`[SATEM Helpdesk] Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

export { server, app };
