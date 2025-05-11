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
  });

  // Set document properties
  notePdf.setFont("times", "normal");

  // Define page dimensions and margins
  const pageWidth = notePdf.internal.pageSize.getWidth();
  const pageHeight = notePdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Add header information on first page
  notePdf.setFontSize(9);
  notePdf.text(
    `Latest update: ${new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
    }).format(data.updatedAt)}`,
    margin,
    10
  );

  notePdf.text(
    `Course: ${data.course?.name} ${
      data.course?.code ? `(${data.course?.code})` : ""
    }`,
    margin,
    14
  );

  // Add title
  notePdf.setFont("times", "bold");
  notePdf.setFontSize(12);
  notePdf.text(data.title, pageWidth / 2, 40, { align: "center" });

  // Prepare content for multi-page layout
  notePdf.setFont("times", "normal");
  notePdf.setFontSize(10);

  // Starting position for content
  let yPosition = 50;
  let currentPage = 1;

  // Split content into lines that fit within the content width
  const contentLines = notePdf.splitTextToSize(
    data.content ?? "",
    contentWidth
  );

  // Calculate line height
  const lineHeight = notePdf.getTextDimensions("Test").h * 1.5;

  // Function to add page number at the bottom of each page
  const addPageNumber = (pageNum: number) => {
    notePdf.setFont("times");
    notePdf.setFontSize(10);
    notePdf.text(`${pageNum}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
    notePdf.setFont("times");
    notePdf.setFontSize(10);
  };

  // Process each line of content
  for (let i = 0; i < contentLines.length; i++) {
    // Check if we need a new page
    if (yPosition + lineHeight > pageHeight - 20) {
      // Add page number to current page
      addPageNumber(currentPage);

      // Add a new page
      notePdf.addPage();
      currentPage++;

      // Reset Y position for new page
      yPosition = margin + 10;
    }

    // Add the line to the document
    notePdf.text(contentLines[i], margin, yPosition);

    // Move to next line
    yPosition += lineHeight;
  }

  // Add page number to the last page
  addPageNumber(currentPage);

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
