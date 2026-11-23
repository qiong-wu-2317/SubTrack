import { internalErrorResponse, validationErrorResponse } from "@/server/errors";
import { SummaryQuerySchema } from "@/server/schemas";
import { getSpendSummary } from "@/server/services/summary";

// Spend depends on today's date (BR-5), so never serve a cached result.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const parsed = SummaryQuerySchema.safeParse({ currency: params.get("currency") ?? undefined });
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const summaries = await getSpendSummary({ ...parsed.data, now: new Date() });
    return Response.json({ summaries });
  } catch (err) {
    return internalErrorResponse(err);
  }
}
