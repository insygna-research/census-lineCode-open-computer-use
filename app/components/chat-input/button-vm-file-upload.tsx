import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from "@/components/prompt-kit/file-upload"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { FileArrowUp, Paperclip } from "@phosphor-icons/react"
import React from "react"

type ButtonVMFileUploadProps = {
  onFileUpload: (files: File[]) => void
  isUserAuthenticated: boolean
  vmName?: string
}

export function ButtonVMFileUpload({
  onFileUpload,
  isUserAuthenticated,
  vmName,
}: ButtonVMFileUploadProps) {
  return (
    <FileUpload
      onFilesAdded={onFileUpload}
      multiple
      disabled={!isUserAuthenticated}
      accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.go,.rs,.php,.rb,.swift,.kt,.m,.mm,.sh,.bat,.ps1,.yml,.yaml,.toml,.ini,.cfg,.conf,.log,image/jpeg,image/png,image/gif,image/webp,image/svg,image/heic,image/heif"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <FileUploadTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className={cn(
                "border-border dark:bg-secondary size-9 rounded-full border bg-transparent",
                !isUserAuthenticated && "opacity-50"
              )}
              type="button"
              disabled={!isUserAuthenticated}
              aria-label="Upload files to VM"
            >
              <Paperclip className="size-4" />
            </Button>
          </FileUploadTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">Upload files to VM</div>
            <div className="text-muted-foreground">Files will be saved to Desktop</div>
            {vmName && <div className="text-muted-foreground">VM: {vmName}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
      <FileUploadContent>
        <div className="border-input bg-background flex flex-col items-center rounded-lg border border-dashed p-8">
          <FileArrowUp className="text-muted-foreground size-8" />
          <span className="mt-4 mb-1 text-lg font-medium">Drop files here</span>
          <span className="text-muted-foreground text-sm">
            Files will be uploaded to the VM's Desktop folder
          </span>
          <span className="text-muted-foreground text-xs mt-2">
            Path: /home/desktop/Desktop/
          </span>
        </div>
      </FileUploadContent>
    </FileUpload>
  )
}