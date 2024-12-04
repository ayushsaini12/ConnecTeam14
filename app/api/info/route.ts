import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const servers = await db.server.findMany({
      select: {
        profile: {
          select: {
            userId: true,
            name: true,
          },
        },
        id: true,
        name: true,
        imageUrl: true,
        inviteCode: true,
        rating: true,
        createdAt: true,
        JoinCategoryServer: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    const formattedResult = servers.map((server) => ({
      user_id: server.profile.userId,
      user_name: server.profile.name,
      server_id: server.id,
      server_name: server.name,
      rating: server.rating,
      server_category: JSON.stringify(server.JoinCategoryServer.map((jc) => jc.categoryId)), 
      server_image: server.imageUrl,
      server_invite: server.inviteCode,
    }));

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error("[SERVER_LIST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
