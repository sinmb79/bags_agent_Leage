import { getTokenMarket } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const tokens = await getTokenMarket();
    return successResponse(tokens, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=30"
      }
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load token market.");
  }
}

