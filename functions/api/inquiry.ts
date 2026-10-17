import { inquirySchema, type InquiryPayload } from '../../src/lib/validation';

type Env = {
  RESEND_API_KEY?: string;
  INQUIRY_TO_EMAIL?: string;
  INQUIRY_FROM_EMAIL?: string;
  AIRTABLE_API_KEY?: string;
  AIRTABLE_BASE_ID?: string;
  AIRTABLE_TABLE_NAME?: string;
  TURNSTILE_SECRET_KEY?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const MAX_BODY_BYTES = 100 * 1024;

const PRODUCT_LINE_LABELS: Record<string, string> = {
  'cnc-machining': 'CNC Machining',
  'cnc-turning': 'CNC Turning',
  'cnc-milling': 'CNC Milling',
  '5-axis-machining': '5-Axis Machining',
  'sheet-metal': 'Sheet Metal Fabrication',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
): Response {
  return json(
    {
      status: 'error',
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    status,
  );
}

function isConfigured(value: string | undefined): value is string {
  return Boolean(value && value !== 'replace-me');
}

async function verifyTurnstile(token: string, env: Env, remoteIp: string): Promise<boolean> {
  if (!isConfigured(env.TURNSTILE_SECRET_KEY)) return true;
  if (!token) return false;

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: remoteIp,
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!response.ok) return false;

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}

function buildEmailText(inquiry: InquiryPayload): string {
  const lines = [
    'New inquiry from the Lancoprecision website',
    '',
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Company: ${inquiry.company}`,
    `Country: ${inquiry.country || '-'}`,
    `Product line: ${PRODUCT_LINE_LABELS[inquiry.productLine] ?? inquiry.productLine}`,
    '',
    'Project requirements:',
    inquiry.message,
  ];

  if (inquiry.attachments.length > 0) {
    lines.push('', 'Attachments declared by the sender:');
    for (const file of inquiry.attachments) {
      lines.push(`- ${file.name} (${file.mimeType}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }

  return lines.join('\n');
}

async function sendEmail(inquiry: InquiryPayload, env: Env): Promise<void> {
  if (!isConfigured(env.RESEND_API_KEY) || !isConfigured(env.INQUIRY_TO_EMAIL)) {
    // Local / preview runs without mail credentials: accept without sending.
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.INQUIRY_FROM_EMAIL ?? 'Lancoprecision Website <noreply@lancoprecision.com>',
      to: [env.INQUIRY_TO_EMAIL],
      reply_to: inquiry.email,
      subject: `New inquiry: ${PRODUCT_LINE_LABELS[inquiry.productLine] ?? inquiry.productLine} - ${inquiry.company}`,
      text: buildEmailText(inquiry),
    }),
  });

  if (!response.ok) {
    throw new Error(`resend_request_failed:${response.status}`);
  }
}

async function saveBackup(inquiry: InquiryPayload, env: Env, receivedAt: string): Promise<void> {
  if (!isConfigured(env.AIRTABLE_API_KEY) || !isConfigured(env.AIRTABLE_BASE_ID)) {
    return;
  }

  const table = env.AIRTABLE_TABLE_NAME ?? 'Inquiries';
  const response = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: inquiry.name,
              Email: inquiry.email,
              Company: inquiry.company,
              Country: inquiry.country,
              ProductLine: inquiry.productLine,
              Message: inquiry.message,
              Attachments: inquiry.attachments.map((file) => file.name).join(', '),
              ReceivedAt: receivedAt,
            },
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`airtable_request_failed:${response.status}`);
  }
}

export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return errorResponse(413, 'payload_too_large', 'The submitted payload is too large.');
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return errorResponse(400, 'validation_failed', 'The request body is not valid JSON.');
    }

    const result = inquirySchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return errorResponse(
        400,
        'validation_failed',
        'Please correct the highlighted fields and try again.',
        fieldErrors,
      );
    }

    const inquiry = result.data;

    const remoteIp = request.headers.get('cf-connecting-ip') ?? '';
    const turnstileOk = await verifyTurnstile(inquiry.turnstileToken, env, remoteIp);
    if (!turnstileOk) {
      return errorResponse(
        400,
        'validation_failed',
        'The submission could not be verified. Please try again.',
      );
    }

    const receivedAt = new Date().toISOString();
    await sendEmail(inquiry, env);

    try {
      await saveBackup(inquiry, env, receivedAt);
    } catch (backupError) {
      // Email already went out; a failed backup must not fail the inquiry.
      console.error(
        JSON.stringify({
          requestId,
          category: 'inquiry_backup_failed',
          durationMs: Date.now() - startedAt,
          detail: String(backupError),
        }),
      );
    }

    return json({ status: 'accepted', id: requestId, receivedAt });
  } catch (error) {
    console.error(
      JSON.stringify({
        requestId,
        category: 'inquiry_processing_failed',
        durationMs: Date.now() - startedAt,
        detail: String(error),
      }),
    );
    return errorResponse(
      500,
      'processing_failed',
      'The inquiry could not be processed. Please try again.',
    );
  }
};
