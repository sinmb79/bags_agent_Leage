import { getTreasurySummary } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const treasury = await getTreasurySummary();
    return successResponse(treasury);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load treasury status.");
  }
}
