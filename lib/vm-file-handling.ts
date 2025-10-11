import { toast } from "@/components/ui/toast"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type VMAttachment = {
  name: string
  type: string  // Changed from contentType to match backend
  size: number  // Added size field required by backend
  url?: string  // Optional URL field
  vmPath?: string  // Keep vmPath for our reference
  localFile?: File
}

export async function uploadFileToVM(
  file: File,
  machineId: string
): Promise<string | null> {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        status: "error",
      })
      return null
    }

    // Read file content
    const content = await readFileContent(file)
    const encoding = file.type.startsWith('text/') ? 'utf-8' : 'base64'
    
    // Determine destination path on VM
    const vmPath = `/home/desktop/Desktop/${file.name}`
    
    // Upload via file API
    const response = await fetch('/api/files?op=upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machine_id: machineId,
        filepath: vmPath,
        content: content,
        encoding: encoding
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to upload ${file.name}`)
    }
    
    const result = await response.json()
    if (result.success) {
      return vmPath
    }
    
    return null
  } catch (error) {
    console.error(`Error uploading file to VM:`, error)
    toast({
      title: "Upload failed",
      description: error instanceof Error ? error.message : "Failed to upload file to VM",
      status: "error",
    })
    return null
  }
}

// Read file content as base64 or text
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (file.type.startsWith('text/')) {
        resolve(reader.result as string)
      } else {
        // Convert binary to base64
        const arrayBuffer = reader.result as ArrayBuffer
        const bytes = new Uint8Array(arrayBuffer)
        const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
        const base64 = btoa(binary)
        resolve(base64)
      }
    }
    
    reader.onerror = reject
    
    if (file.type.startsWith('text/')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

export async function processVMFiles(
  files: File[],
  machineId: string
): Promise<VMAttachment[]> {
  const attachments: VMAttachment[] = []

  for (const file of files) {
    try {
      const vmPath = await uploadFileToVM(file, machineId)
      
      if (vmPath) {
        attachments.push({
          name: file.name,
          type: file.type,  // Changed from contentType
          size: file.size,  // Added size field
          url: vmPath,      // Set URL to the VM path for backend compatibility
          vmPath: vmPath,   // Keep vmPath for reference
          localFile: file
        })
        
        toast({
          title: "File uploaded",
          description: `${file.name} uploaded to VM desktop`,
          status: "success",
        })
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error)
    }
  }

  return attachments
}

export function createVMOptimisticAttachments(files: File[]): VMAttachment[] {
  return files.map(file => {
    const vmPath = `/home/desktop/Desktop/${file.name}`
    return {
      name: file.name,
      type: file.type,  // Changed from contentType
      size: file.size,  // Added size field
      url: vmPath,      // Set URL to the VM path
      vmPath: vmPath,
      localFile: file
    }
  })
}