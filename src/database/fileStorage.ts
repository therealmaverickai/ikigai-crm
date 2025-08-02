// Local file storage implementation using File System Access API
import type { 
  Company, 
  Contact, 
  Deal, 
  Project,
  TimeEntry,
} from '../types/crm';

export interface CRMData {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
  timeEntries: TimeEntry[];
  exportedAt: string;
  version: string;
}

class LocalFileStorage {
  private fileHandle: FileSystemFileHandle | null = null;
  private readonly fileName = 'ikigai-crm-data.json';
  
  // Check if File System Access API is supported
  private get isFileSystemAccessSupported(): boolean {
    return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
  }

  // Initialize and set up the data file
  async initialize(): Promise<void> {
    if (!this.isFileSystemAccessSupported) {
      console.log('📁 File System Access API not supported, using download/upload fallback');
      return;
    }

    try {
      // Try to get permission to access the file
      const existingHandle = await this.getExistingFileHandle();
      if (existingHandle) {
        this.fileHandle = existingHandle;
        console.log('📁 Connected to existing CRM data file');
      }
    } catch (error) {
      console.log('📁 No existing file handle found, will create new file on first save');
    }
  }

  // Get existing file handle from storage
  private async getExistingFileHandle(): Promise<FileSystemFileHandle | null> {
    try {
      // Check if we have a stored file handle (requires user permission)
      const handles = await (navigator as any).storage?.getDirectory?.();
      if (handles) {
        return await handles.getFileHandle(this.fileName);
      }
      return null;
    } catch {
      return null;
    }
  }

  // Save data to local file
  async saveToFile(data: CRMData): Promise<boolean> {
    try {
      if (this.isFileSystemAccessSupported) {
        return await this.saveWithFileSystemAPI(data);
      } else {
        return await this.saveWithDownload(data);
      }
    } catch (error) {
      console.error('Failed to save data to file:', error);
      return false;
    }
  }

  // Save using File System Access API
  private async saveWithFileSystemAPI(data: CRMData): Promise<boolean> {
    try {
      // If no file handle, prompt user to select/create file
      if (!this.fileHandle) {
        this.fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: this.fileName,
          types: [{
            description: 'Ikigai CRM Data',
            accept: { 'application/json': ['.json'] }
          }]
        });
      }

      // Write data to file
      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      console.log('✅ Data saved to local file successfully');
      return true;
    } catch (error) {
      console.error('Failed to save with File System API:', error);
      return false;
    }
  }

  // Fallback: Save by downloading file
  private async saveWithDownload(data: CRMData): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('📥 Data downloaded as file');
      return true;
    } catch (error) {
      console.error('Failed to download file:', error);
      return false;
    }
  }

  // Load data from local file
  async loadFromFile(): Promise<CRMData | null> {
    try {
      if (this.isFileSystemAccessSupported) {
        return await this.loadWithFileSystemAPI();
      } else {
        return await this.loadWithUpload();
      }
    } catch (error) {
      console.error('Failed to load data from file:', error);
      return null;
    }
  }

  // Load using File System Access API
  private async loadWithFileSystemAPI(): Promise<CRMData | null> {
    try {
      // If no file handle, prompt user to select file
      if (!this.fileHandle) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Ikigai CRM Data',
            accept: { 'application/json': ['.json'] }
          }]
        });
        this.fileHandle = fileHandle;
      }

      // Read file content
      const file = await this.fileHandle.getFile();
      const text = await file.text();
      const data = JSON.parse(text) as CRMData;

      console.log('✅ Data loaded from local file successfully');
      return data;
    } catch (error) {
      console.error('Failed to load with File System API:', error);
      return null;
    }
  }

  // Fallback: Load by file upload
  private async loadWithUpload(): Promise<CRMData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text) as CRMData;
          console.log('📤 Data uploaded from file');
          resolve(data);
        } catch (error) {
          console.error('Failed to parse uploaded file:', error);
          resolve(null);
        }
      };

      input.click();
    });
  }

  // Auto-save data at regular intervals
  private autoSaveInterval: NodeJS.Timeout | null = null;
  
  startAutoSave(getData: () => CRMData, intervalMinutes: number = 5): void {
    this.stopAutoSave(); // Clear any existing interval
    
    this.autoSaveInterval = setInterval(async () => {
      const data = getData();
      const saved = await this.saveToFile(data);
      if (saved) {
        console.log('🔄 Auto-saved data to file');
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Auto-save enabled (every ${intervalMinutes} minutes)`);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏸️ Auto-save disabled');
    }
  }

  // Check if file is connected
  get isFileConnected(): boolean {
    return this.fileHandle !== null;
  }

  // Get file name
  get connectedFileName(): string | null {
    return this.fileHandle?.name || null;
  }
}

export const localFileStorage = new LocalFileStorage();