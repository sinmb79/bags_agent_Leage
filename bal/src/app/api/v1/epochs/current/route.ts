import { getCurrentEpoch } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  try {
    const epoch = await getCurrentEpoch();
    return successResponse(epoch);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load current epoch.");
  }
}

