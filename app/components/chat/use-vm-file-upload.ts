import { toast } from "@/components/ui/toast"
import { processVMFiles, createVMOptimisticAttachments, VMAttachment } from "@/lib/vm-file-handling"
import { useCallback, useState } from "react"

export const useVMFileUpload = () => {
  const [files, setFiles] = useState<File[]>([])

  const handleFileUploads = async (
    machineId: string | null
  ): Promise<any[] | null> => {
    if (files.length === 0) return []
    
    if (!machineId || machineId === "none") {
      toast({ 
        title: "No VM selected", 
        description: "Please select a virtual machine to upload files",
        status: "error" 
      })
      return null
    }

    try {
      const processed = await processVMFiles(files, machineId)
      console.log('use-vm-file-upload - Processed files:', processed)
      setFiles([])
      // Include vmPath in the returned attachments so it can be added to the message
      const attachments = processed.map(att => ({
        name: att.name,
        type: att.type,
        size: att.size,
        url: att.url || att.vmPath || "",
        vmPath: att.vmPath, // Include vmPath for message construction
        // Don't include localFile or other internal fields
      }))
      console.log('use-vm-file-upload - Returning attachments:', attachments)
      return attachments
    } catch {
      toast({ title: "Failed to process files", status: "error" })
      return null
    }
  }

  const createOptimisticAttachments = (files: File[]) => {
    // Use the VM attachments creator that has the correct format
    const vmAttachments = createVMOptimisticAttachments(files)
    // Convert to the format expected by useChat
    return vmAttachments.map(att => ({
      name: att.name,
      type: att.type,
      size: att.size,
      url: att.url || ""
    }))
  }

  const cleanupOptimisticAttachments = (attachments?: Array<{ url?: string }>) => {
    if (!attachments) return
    attachments.forEach((attachment) => {
      if (attachment.url?.startsWith("blob:")) {
        URL.revokeObjectURL(attachment.url)
      }
    })
  }

  const handleFileUpload = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileRemove = useCallback((file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file))
  }, [])

  return {
    files,
    setFiles,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
    handleFileUpload,
    handleFileRemove,
  }
}