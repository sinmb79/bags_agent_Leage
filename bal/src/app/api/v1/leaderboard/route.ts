import { getLeaderboard } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const epochId = searchParams.get("epochId") ?? undefined;
    const leaderboard = await getLeaderboard(epochId);
    return successResponse(leaderboard);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load leaderboard.");
  }
}

