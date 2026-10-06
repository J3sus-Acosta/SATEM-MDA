export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  inReplyTo?: string;
  references?: string[];
}

export interface EmailSenderTransport {
  send(message: EmailMessage): Promise<{ messageId: string; success: boolean }>;
}

export class MockEmailTransport implements EmailSenderTransport {
  public sentMessages: EmailMessage[] = [];

  async send(message: EmailMessage) {
    this.sentMessages.push(message);
    return { messageId: `<mock-${Date.now()}@satem.cl>`, success: true };
  }
}

export class EmailOutboundService {
  private transport: EmailSenderTransport;

  constructor(transport?: EmailSenderTransport) {
    this.transport = transport || new MockEmailTransport();
  }

  setTransport(transport: EmailSenderTransport) {
    this.transport = transport;
  }

  renderCustomerTicketCreated(data: {
    ticketCode: string;
    title: string;
    requesterName: string;
    portalUrl: string;
  }): { subject: string; html: string; text: string } {
    const subject = `[${data.ticketCode}] Solicitud de soporte recibida: ${data.title}`;
    const text = `Hola ${data.requesterName},\n\nHemos recibido tu solicitud con código [${data.ticketCode}].\nTítulo: ${data.title}\n\nPuedes consultar el estado en: ${data.portalUrl}\n\nEquipo de Soporte SATEM`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
    .header { border-bottom: 2px solid #0052cc; padding-bottom: 12px; margin-bottom: 16px; }
    .badge { background: #0052cc; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 13px; }
    .btn { display: inline-block; background: #0052cc; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 4px; margin-top: 16px; font-weight: 500; }
    .footer { font-size: 12px; color: #6b778c; margin-top: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">${data.ticketCode}</span>
      <h2>Solicitud de soporte recibida</h2>
    </div>
    <p>Hola <strong>${data.requesterName}</strong>,</p>
    <p>Hemos registrado correctamente tu solicitud: <em>${data.title}</em>.</p>
    <p>Uno de nuestros agentes revisará los antecedentes y responderá a la brevedad dentro de los plazos de nuestro nivel de servicio.</p>
    <a href="${data.portalUrl}" class="btn">Ver estado en Portal</a>
    <div class="footer">
      Mesa de Ayuda SATEM — Soporte Tecnológico Inteligente
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, html, text };
  }

  async sendTicketCreatedNotification(
    to: string,
    data: { ticketCode: string; title: string; requesterName: string; portalUrl: string }
  ) {
    const rendered = this.renderCustomerTicketCreated(data);
    return this.transport.send({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }
}

export const emailOutboundService = new EmailOutboundService();
