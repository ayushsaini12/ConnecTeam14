import { NextResponse } from "next/server";
import { CategoryTypeServer } from "@prisma/client";

import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories: CategoryTypeServer[] = await db.categoryTypeServer.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
