/**
 * Helper to dynamically load pdf.js from CDN and parse PDF files in the browser.
 */
export async function extractTextFromPDF(file: File, onProgress?: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);

        // Dynamically load pdf.js library if not already loaded on window
        if (!(window as any).pdfjsLib) {
          await loadPdfJsScript();
        }

        const pdfjsLib = (window as any).pdfjsLib;
        // Configure worker CDN path
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = "";
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
          
          if (onProgress) {
            onProgress(Math.round((i / totalPages) * 100));
          }
        }

        if (!fullText.trim()) {
          reject(new Error("No extractable text found in this PDF. It might be scanned. Try copying and pasting plain text instead."));
        } else {
          resolve(fullText.trim());
        }
      } catch (error: any) {
        console.error("PDF Parsing error:", error);
        reject(new Error("Failed to extract text from PDF. Please check the file or try pasting raw text instead."));
      }
    };
    fileReader.onerror = () => reject(new Error("Error reading file."));
    fileReader.readAsArrayBuffer(file);
  });
}

function loadPdfJsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to fetch pdf.js parsing engine."));
    document.head.appendChild(script);
  });
}
