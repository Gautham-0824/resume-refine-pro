import mammoth from "mammoth";

export async function parsePdf(file: File): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues with pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist");
    
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
       pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract raw text
        const pageText = textContent.items
            // @ts-ignore
            .map((item) => item.str || "")
            .join(" ");
            
        text += pageText + "\n";
    }
    
    return text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF document.");
  }
}

export async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Mammoth extractRawText accepts arrayBuffer format directly in browser builds
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error("Failed to parse DOCX document.");
  }
}
