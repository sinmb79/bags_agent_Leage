import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, init);
}

export function errorResponse(error: string, status = 500) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error }, { status });
}

