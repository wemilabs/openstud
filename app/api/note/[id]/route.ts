import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";

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
      createdAt: true,
      updatedAt: true,
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

  // Generate PDF document from note content.
  const notePdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })
    //font
    .setFont("times", "normal")
    // date
    .setFontSize(9)
    .text(
      `Latest update: ${new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
      }).format(data.updatedAt)}`,
      20,
      10
    )
    // course
    .text(
      `Course: ${data.course?.name} ${
        data.course?.code ? `(${data.course?.code})` : ""
      }`,
      20,
      14
    )
    // title
    .setFont("times", "bold")
    .setFontSize(12)
    .text(data.title, 105, 40, { align: "center" })
    // content
    .setFont("times", "normal")
    .setFontSize(10)
    .text(data.content ?? "", 30, 50, {
      align: "justify",
      maxWidth: 150,
      lineHeightFactor: 1.5,
    });

  // Output the PDF document in buffer (it suits better for node.js)
  // And return it as a new response with custom headers.
  const notePdfBuffer = Buffer.from(notePdf.output("arraybuffer"));

  return new NextResponse(notePdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.title} - ${data.course?.name}.pdf"`,
    },
  });
}

// TODO: handle large content
