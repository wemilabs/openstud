import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const data = await prisma.note.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      course: { select: { id: true, code: true, name: true } },
    },
  });

  if (!data) {
    return NextResponse.json(
      {
        error: "Note not found",
      },
      { status: 404 }
    );
  }

  // TODO: Add either jsPDF or React PDF to generate the PDF document from the note content.

  return NextResponse.json(data);
}
