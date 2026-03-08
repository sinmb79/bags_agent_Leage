import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { registerAgentRecord } from "@/lib/app-data";
import { errorResponse, successResponse } from "@/lib/response";

const registerAgentSchema = z.object({
  name: z.string().trim().min(2).max(60),
  wallet_address: z.string().trim().min(32).max(64),
  avatar_url: z.string().trim().url().optional()
});

function isValidSolanaAddress(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const payload = registerAgentSchema.parse(raw);

    if (!isValidSolanaAddress(payload.wallet_address)) {
      return errorResponse("wallet_address must be a valid Solana public key.", 400);
    }

    const agent = await registerAgentRecord({
      ...payload,
      avatar_url: payload.avatar_url ?? null
    });
    return successResponse(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message ?? "Invalid request payload.", 400);
    }

    return errorResponse(error instanceof Error ? error.message : "Failed to register agent.", 400);
  }
}
