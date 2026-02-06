import { AnimatePresence, motion } from "framer-motion";
import { FileIcon, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  className?: string;
  maxSize?: number; // bytes
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg"],
    "application/pdf": [".pdf"],
  },
  className,
  maxSize = 5 * 1024 * 1024, // 5MB default
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
  });

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed border-border/50 bg-muted/20 p-8 transition-all hover:bg-muted/40",
          isDragActive && "border-primary bg-primary/5 ring-2 ring-primary/20"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="rounded-full bg-background p-3 shadow-sm ring-1 ring-border/50">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm font-medium">
            {isDragActive ? (
              <span className="text-primary">Solte os arquivos aqui</span>
            ) : (
              <span>
                Arraste arquivos ou{" "}
                <span className="text-primary underline">clique para selecionar</span>
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            PDFs ou Imagens até {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid gap-2">
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              layout
              className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {file.type.includes("image") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <FileIcon className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
