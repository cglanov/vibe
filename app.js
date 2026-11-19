document.addEventListener("DOMContentLoaded", () => {
  const panels = document.querySelectorAll(".panel");
  const exportPdfBtn = document.getElementById("exportPdfBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");

  // Update line counter and support Tab indentation inside textareas
  panels.forEach((panel) => {
    const textarea = panel.querySelector("textarea");
    const lineCountEl = panel.querySelector(".line-count");
    const clearBtn = panel.querySelector(".clear-btn");

    const updateCount = () => {
      const val = textarea.value;
      const lines = val.length === 0 ? 0 : val.split("\n").length;
      lineCountEl.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
    };

    textarea.addEventListener("input", updateCount);

    // Insert 2 spaces when pressing Tab
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value =
          textarea.value.substring(0, start) +
          "  " +
          textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateCount();
      }
    });

    clearBtn.addEventListener("click", () => {
      textarea.value = "";
      updateCount();
    });
  });

  // Clear all panels
  clearAllBtn.addEventListener("click", () => {
    panels.forEach((panel) => {
      panel.querySelector("textarea").value = "";
      panel.querySelector(".line-count").textContent = "0 lines";
    });
  });

  // Generate and download the formatted PDF
  exportPdfBtn.addEventListener("click", () => {
    const populatedFiles = [];

    panels.forEach((panel) => {
      const fileName = panel.dataset.file;
      const content = panel.querySelector("textarea").value;
      if (content.trim().length > 0) {
        populatedFiles.push({ fileName, content });
      }
    });

    if (populatedFiles.length === 0) {
      alert("Please paste code into at least one panel before exporting.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const usableWidth = pageWidth - margin * 2;
    const lineHeight = 13;
    const codeFontSize = 9;
    let cursorY = margin;

    // Document Title Banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Project Source Code Export", margin, cursorY);
    cursorY += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const timestamp = new Date().toLocaleString();
    const fileSummary = populatedFiles.map((f) => f.fileName).join(", ");
    doc.text(`Generated: ${timestamp}  |  Files: ${fileSummary}`, margin, cursorY);
    cursorY += 24;

    // Render each populated file block
    populatedFiles.forEach((file, fileIndex) => {
      // Ensure enough space for header + at least 3 lines of code
      if (cursorY + 65 > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      } else if (fileIndex > 0) {
        cursorY += 14;
      }

      // Section Header Bar
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(margin, cursorY, usableWidth, 24, 3, 3, "F");

      doc.setFont("courier", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(file.fileName, margin + 10, cursorY + 16);

      const rawLines = file.content.replace(/\r\n/g, "\n").split("\n");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `${rawLines.length} lines`,
        pageWidth - margin - 10,
        cursorY + 16,
        { align: "right" }
      );

      cursorY += 36;

      // Code lines with line numbers and wrapping
      doc.setFont("courier", "normal");
      doc.setFontSize(codeFontSize);

      const gutterWidth = 30;
      const codeMaxWidth = usableWidth - gutterWidth - 8;

      rawLines.forEach((rawLine, idx) => {
        const lineNum = String(idx + 1).padStart(3, " ");
        // Replace tabs with 2 spaces so jsPDF renders indentation cleanly
        const normalizedLine = rawLine.replace(/\t/g, "  ");
        const wrappedLines = doc.splitTextToSize(
          normalizedLine.length === 0 ? " " : normalizedLine,
          codeMaxWidth
        );

        wrappedLines.forEach((segment, wrapIdx) => {
          if (cursorY + lineHeight > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }

          // Subtle alternating row shading for readability
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, cursorY - 9, usableWidth, lineHeight, "F");
          }

          // Print line number only on the first wrapped segment
          if (wrapIdx === 0) {
            doc.setTextColor(148, 163, 184);
            doc.text(lineNum, margin + 4, cursorY);
          }

          // Print code text
          doc.setTextColor(15, 23, 42);
          doc.text(segment, margin + gutterWidth, cursorY);

          cursorY += lineHeight;
        });
      });

      // Bottom divider line after each file
      cursorY += 6;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.75);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 10;
    });

    // Add "Page X of Y" footer to every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: "center" }
      );
    }

    doc.save("code-export.pdf");
  });
});
