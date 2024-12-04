import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
      return new NextResponse(JSON.stringify([]), { status: 200 });
    }

    const servers = await db.server.findMany({
        where: {
          name: {
            contains: query, 
            mode: "insensitive", 
          },
        },
        take: 5, 
        select: {
          id: true,
          name: true,
          imageUrl: true,
          inviteCode: true, 
        },
      });
    console.log("[SERVERS_SEARCH]", servers);

    return NextResponse.json(servers);
  } catch (error) {
    console.error("[SERVERS_SEARCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
