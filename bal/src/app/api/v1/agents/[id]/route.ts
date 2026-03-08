import { getAgentProfile } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getAgentProfile(params.id);
    if (!profile) {
      return errorResponse("Agent not found.", 404);
    }

    return successResponse(profile);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load agent.");
  }
}

