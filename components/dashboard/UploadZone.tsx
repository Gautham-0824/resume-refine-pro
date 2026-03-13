"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, File as FileIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileScanned: (rawText: string, fileName: string) => void;
}

export function UploadZone({ onFileScanned }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    
    try {
      let rawText = "";
      if (file.type === "application/pdf") {
        const { parsePdf } = await import("@/lib/resumeParser");
        rawText = await parsePdf(file);
      } else {
        const { parseDocx } = await import("@/lib/resumeParser");
        rawText = await parseDocx(file);
      }
      
      // Artificial delay for scanning animation if parsing was too fast
      await new Promise(r => setTimeout(r, 2000));
      onFileScanned(rawText, file.name);
    } catch (error) {
      console.error(error);
      alert("Failed to read file.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {!isScanning ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6"
          >
            <div 
              {...getRootProps()} 
              className={`w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors cursor-pointer group
                \${isDragActive ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-amber-500/50 bg-black/50'}
              `}
            >
              <input {...getInputProps()} />
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-amber-500/10 transition-colors mb-4">
                <UploadCloud className={`w-8 h-8 \${isDragActive ? 'text-amber-500' : 'text-muted-foreground group-hover:text-amber-400'}`} />
              </div>
              <h3 className="text-xl font-medium mb-2 tracking-wide text-foreground">
                {isDragActive ? 'Drop resume here...' : 'Upload your resume'}
              </h3>
              <p className="text-sm font-light text-muted-foreground text-center max-w-sm">
                Drag and drop your PDF or DOCX file, or click to browse. Max file size 5MB.
              </p>
            </div>

            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-[0_0_20px_-10px_#f59e0b]"
              >
                <div className="flex items-center gap-3">
                  {file.type === "application/pdf" ? <FileText className="w-6 h-6 text-amber-500" /> : <FileIcon className="w-6 h-6 text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-light">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
                  onClick={(e) => { e.stopPropagation(); handleScan(); }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-medium tracking-wide shadow-[0_0_15px_-3px_#f59e0b]"
                >
                  Scan Resume →
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-80 rounded-2xl border border-amber-500/30 bg-black relative overflow-hidden flex flex-col items-center justify-center"
          >
            {/* Scanning Line */}
            <div className="absolute left-0 w-full h-32 bg-gradient-to-b from-transparent to-amber-500/20 -top-32 animate-scanning blur-sm pointer-events-none" />
            <div className="absolute left-0 w-full h-[1px] bg-amber-500 -top-0 animate-scanning shadow-[0_0_8px_#f59e0b] pointer-events-none" />
            
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-6" />
            <h3 className="text-2xl font-light tracking-tight text-white mb-2">Analyzing Resume...</h3>
            <p className="text-amber-500/70 text-sm font-medium tracking-widest uppercase">Extracting key data points</p>
            
            {/* Faint resume background structure */}
            <div className="absolute inset-0 z-[-1] opacity-5 pointer-events-none flex flex-col p-12 gap-4">
               <div className="w-1/3 h-6 bg-white rounded" />
               <div className="w-full h-4 bg-white rounded mt-4" />
               <div className="w-full h-4 bg-white rounded" />
               <div className="w-2/3 h-4 bg-white rounded" />
               <div className="w-1/4 h-6 bg-white rounded mt-8" />
               <div className="w-full h-4 bg-white rounded mt-4" />
               <div className="w-full h-4 bg-white rounded" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
