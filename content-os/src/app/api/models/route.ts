import { NextResponse } from "next/server";
import { AVAILABLE_MODELS } from "@/lib/claude";

export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
