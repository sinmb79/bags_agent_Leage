import { createNewEpoch, finalizeEpoch, getActiveEpoch } from "@/lib/epoch";
import { errorResponse, successResponse } from "@/lib/response";
import { createServerClient } from "@/lib/supabase/server";

function isAuthorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = createServerClient();
    if (!supabase) {
      return errorResponse("Supabase environment is not configured.", 500);
    }

    const activeEpoch = await getActiveEpoch(supabase);
    let finalized = false;

    if (activeEpoch && new Date(activeEpoch.week_end).getTime() <= Date.now()) {
      await finalizeEpoch(supabase, activeEpoch.id);
      finalized = true;
    }

    const nextEpoch = await createNewEpoch(supabase);
    return successResponse({
      finalized,
      activeEpochId: nextEpoch.id
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to check epoch.");
  }
}
