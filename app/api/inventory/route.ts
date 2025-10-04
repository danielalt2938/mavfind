import { NextRequest, NextResponse } from "next/server";
import { searchInventory } from "@/lib/search/algolia";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || undefined;
    const location = searchParams.get("location") || undefined;
    const page = parseInt(searchParams.get("page") || "0");
    const hitsPerPage = parseInt(searchParams.get("hitsPerPage") || "20");

    const results = await searchInventory({
      query,
      category,
      location,
      page,
      hitsPerPage,
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error searching inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
