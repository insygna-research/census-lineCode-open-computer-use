"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  Download, 
  Folder, 
  File, 
  FileText, 
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  Loader2,
  RefreshCw,
  Search,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FileTransferProps {
  machineId: string;
  connectionInfo: any;
}

interface RemoteFile {
  filename: string;
  path: string;
  relative_path: string;
  size: number;
  modified: string;
  downloadable: boolean;
}

export function FileTransfer({ machineId, connectionInfo }: FileTransferProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [listing, setListing] = useState(false);
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState("/home/desktop/Desktop");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Initial load of files
    listFiles();
  }, []);

  // Get file icon based on extension
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'md':
      case 'doc':
      case 'docx':
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <FileImage className="h-4 w-4" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return <FileVideo className="h-4 w-4" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'ogg':
        return <FileAudio className="h-4 w-4" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'h':
      case 'css':
      case 'html':
      case 'json':
      case 'xml':
        return <FileCode className="h-4 w-4" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
      case '7z':
        return <FileArchive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // List files in current directory
  const listFiles = async (path?: string) => {
    setListing(true);
    const targetPath = path || currentPath;
    
    try {
      const response = await fetch('/api/files?op=list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          path: targetPath,
          recursive: false,
          max_files: 200
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list files');
      }
      
      const data = await response.json();
      if (data.success && data.files) {
        setRemoteFiles(data.files);
        setCurrentPath(targetPath);
      }
    } catch (error) {
      console.error('List files error:', error);
      toast.error('Failed to list files');
    } finally {
      setListing(false);
    }
  };

  // Upload files
  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    const totalFiles = files.length;
    let completed = 0;
    
    for (const file of Array.from(files)) {
      try {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        
        // Read file content
        const content = await readFileContent(file);
        const encoding = file.type.startsWith('text/') ? 'utf-8' : 'base64';
        
        // Upload via file API
        const response = await fetch('/api/files?op=upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machine_id: machineId,
            filepath: file.name,
            content: content,
            encoding: encoding
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to upload ${file.name}`);
        }
        
        const result = await response.json();
        if (result.success) {
          completed++;
          setUploadProgress((completed / totalFiles) * 100);
          toast.success(`Uploaded ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    // Refresh file list
    await listFiles();
    setUploading(false);
    setUploadProgress(0);
  };

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (file.type.startsWith('text/')) {
          resolve(reader.result as string);
        } else {
          // Convert binary to base64
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), '');
          const base64 = btoa(binary);
          resolve(base64);
        }
      };
      
      reader.onerror = reject;
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Download selected files
  const handleDownload = async () => {
    const filesToDownload = Array.from(selectedFiles);
    if (filesToDownload.length === 0) {
      toast.error('No files selected');
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const totalFiles = filesToDownload.length;
    let completed = 0;
    
    for (const filepath of filesToDownload) {
      try {
        const response = await fetch('/api/files?op=download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machine_id: machineId,
            filepath: filepath,
            encoding: 'auto'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to download ${filepath}`);
        }
        
        const result = await response.json();
        if (result.success) {
          // Create download link
          let blob: Blob;
          if (result.encoding === 'base64') {
            // Binary file
            const binaryString = atob(result.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes]);
          } else {
            // Text file
            blob = new Blob([result.content], { type: 'text/plain' });
          }
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          completed++;
          setDownloadProgress((completed / totalFiles) * 100);
          toast.success(`Downloaded ${result.filename}`);
        }
      } catch (error) {
        console.error(`Error downloading ${filepath}:`, error);
        toast.error(`Failed to download ${filepath}`);
      }
    }
    
    setDownloading(false);
    setDownloadProgress(0);
    setSelectedFiles(new Set());
  };

  // Toggle file selection
  const toggleFileSelection = (filepath: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filepath)) {
      newSelection.delete(filepath);
    } else {
      newSelection.add(filepath);
    }
    setSelectedFiles(newSelection);
  };

  // Select all files
  const selectAll = () => {
    const downloadableFiles = remoteFiles
      .filter(f => f.downloadable)
      .map(f => f.path);
    setSelectedFiles(new Set(downloadableFiles));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // Filter files by search query
  const filteredFiles = remoteFiles.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          File Transfer
        </CardTitle>
        <CardDescription>
          Upload files to or download files from the virtual machine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="download">Download</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Files
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maximum file size: 10MB
              </p>
            </div>
            
            {uploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="download" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => listFiles()}
                  disabled={listing}
                >
                  {listing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFiles.size} of {filteredFiles.length} files selected
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedFiles.size === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {listing ? 'Loading files...' : 'No files found'}
                    </div>
                  ) : (
                    filteredFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Checkbox
                          checked={selectedFiles.has(file.path)}
                          onCheckedChange={() => toggleFileSelection(file.path)}
                          disabled={!file.downloadable}
                        />
                        {getFileIcon(file.filename)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {file.filename}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.modified}
                          </div>
                        </div>
                        {!file.downloadable && (
                          <div className="text-xs text-orange-500">
                            Too large
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <Button
                className="w-full"
                onClick={handleDownload}
                disabled={selectedFiles.size === 0 || downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Selected Files
                  </>
                )}
              </Button>
              
              {downloading && downloadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Downloading files...</span>
                    <span>{downloadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={downloadProgress} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Files are uploaded to and downloaded from /home/desktop/Desktop by default.
            Binary files are automatically encoded/decoded using base64.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}