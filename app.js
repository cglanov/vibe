document.addEventListener("DOMContentLoaded", () => {
  const panels = document.querySelectorAll(".panel");
  const exportTxtBtn = document.getElementById("exportTxtBtn");
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

  // Generate and download the formatted .txt file
  exportTxtBtn.addEventListener("click", () => {
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

    const divider = "=".repeat(70);
    const subDivider = "-".repeat(70);
    const timestamp = new Date().toLocaleString();
    const fileSummary = populatedFiles.map((f) => f.fileName).join(", ");

    let output = [];
    output.push(divider);
    output.push("PROJECT SOURCE CODE EXPORT");
    output.push(`Generated: ${timestamp}`);
    output.push(`Included Files: ${fileSummary}`);
    output.push(divider);
    output.push("");

    populatedFiles.forEach((file) => {
      const normalizedContent = file.content.replace(/\r\n/g, "\n").trimEnd();
      const lineCount = normalizedContent.split("\n").length;

      output.push(divider);
      output.push(`FILE: ${file.fileName} (${lineCount} ${lineCount === 1 ? "line" : "lines"})`);
      output.push(subDivider);
      output.push(normalizedContent);
      output.push(divider);
      output.push("");
      output.push("");
    });

    const blob = new Blob([output.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "code-export.txt";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
});
