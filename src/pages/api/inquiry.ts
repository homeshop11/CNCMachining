import type { APIRoute } from 'astro';
import { inquirySchema } from '../../lib/validation';

export const prerender = false;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const result = inquirySchema.safeParse(raw);

    if (!result.success) {
      const fieldErrors = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
      );

      return jsonResponse(
        {
          status: 'error',
          code: 'validation_failed',
          message: 'Please correct the highlighted fields and try again.',
          fieldErrors,
        },
        400,
      );
    }

    const inquiry = result.data;

    if (inquiry.website) {
      return jsonResponse(
        {
          status: 'error',
          code: 'validation_failed',
          message: 'The submission could not be processed.',
        },
        400,
      );
    }

    const id = crypto.randomUUID();

    return jsonResponse({
      status: 'accepted',
      id,
      receivedAt: new Date().toISOString(),
    });
  } catch {
    return jsonResponse(
      {
        status: 'error',
        code: 'processing_failed',
        message: 'The inquiry could not be processed. Please try again.',
      },
      500,
    );
  }
};
