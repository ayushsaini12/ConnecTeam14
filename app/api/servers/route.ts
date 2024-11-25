import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { MemberRole } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, imageUrl, categoryIds } = await req.json();
    console.log(categoryIds); // For debugging: ensure categoryIds is received

    const profile = await currentProfile();

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    // Step 1: Create the server
    const server = await db.server.create({
      data: {
        profileId: profile.id,
        name,
        imageUrl,
        inviteCode: uuidv4(),
        channels: { create: [{ name: "general", profileId: profile.id }] },
        members: { create: [{ profileId: profile.id, role: MemberRole.ADMIN }] },
      },
    });

    // Step 2: Associate categories with the server
    if (categoryIds && Array.isArray(categoryIds)) {
      const categoryPromises = categoryIds.map((categoryId: number) =>
        db.joinCategoryServer.create({
          data: {
            serverId: server.id,
            categoryId: categoryId,
          },
        })
      );
      await Promise.all(categoryPromises);
    }

    return NextResponse.json(server);
  } catch (error) {
    console.error("[SERVERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

