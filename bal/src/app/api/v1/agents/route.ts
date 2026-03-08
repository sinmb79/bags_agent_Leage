import { getAgentSummaries } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const agents = await getAgentSummaries();
    return successResponse(agents);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load agents.");
  }
}

