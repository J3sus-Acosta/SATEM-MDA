import crypto from 'crypto';

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: number;
  tenantId: string;
  data: unknown;
}

export class WebhookDispatcher {
  createSignature(secretKey: string, payloadString: string, timestamp: number): string {
    const signaturePayload = `${timestamp}.${payloadString}`;
    const hmac = crypto.createHmac('sha256', secretKey).update(signaturePayload).digest('hex');
    return `t=${timestamp},v1=${hmac}`;
  }

  verifySignature(
    secretKey: string,
    payloadString: string,
    headerSignature: string,
    toleranceSeconds: number = 300
  ): boolean {
    const parts = headerSignature.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !sigPart) return false;

    const timestamp = parseInt(timestampPart.replace('t=', ''), 10);
    const receivedHash = sigPart.replace('v1=', '');

    // Verificar tolerancia de tiempo para mitigar replay attacks
    const nowSecs = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSecs - timestamp) > toleranceSeconds) {
      return false;
    }

    const expectedSig = this.createSignature(secretKey, payloadString, timestamp);
    const expectedHash = expectedSig.split('v1=')[1];

    return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
  }

  async dispatch(
    targetUrl: string,
    secretKey: string,
    payload: WebhookPayload,
    fetchFn: typeof fetch = fetch,
    maxRetries: number = 3
  ): Promise<{ success: boolean; attempts: number; statusCode?: number }> {
    const bodyStr = JSON.stringify(payload);
    const signature = this.createSignature(secretKey, bodyStr, payload.timestamp);

    let attempts = 0;
    let delayMs = 100;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const response = await fetchFn(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Signature-SHA256': signature,
            'User-Agent': 'SATEM-Webhook-Dispatcher/1.0',
          },
          body: bodyStr,
        });

        if (response.ok) {
          return { success: true, attempts, statusCode: response.status };
        }
      } catch {
        // Fallo de red temporal
      }

      if (attempts < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2; // Backoff exponencial
      }
    }

    return { success: false, attempts };
  }
}

export const webhookDispatcher = new WebhookDispatcher();
