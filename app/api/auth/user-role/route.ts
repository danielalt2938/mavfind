import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ role: user.role, uid: user.uid }, { status: 200 });
  } catch (error) {
    console.error("Error getting user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
