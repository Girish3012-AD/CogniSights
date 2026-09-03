import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface QueryInputProps {
  onSubmitQuery: (formData: FormData) => void;
  isLoading: boolean;
}

export const QueryInput: React.FC<QueryInputProps> = ({ onSubmitQuery, isLoading }) => {
  const [nlQuery, setNlQuery] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intercept drag actions safely over visual window layout bounds
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(Array.from(e.target.files));
    }
  };

  const processIncomingFiles = (files: File[]) => {
    // Filter array to strictly bound uploads within ISRO framework constraints
    const validExtensions = ['.tif', '.tiff', '.png', '.jpg', '.jpeg'];
    const filtered = files.filter(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(ext);
    });

    // Enforce max structural limits (up to 2 files for bi-temporal/cross-modal processing)
    setSelectedFiles(prev => [...prev, ...filtered].slice(0, 2));
  };

  const removeFileFromBatch = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const executeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    // Convert standard JSON context payload execution into binary multi-part form tensors
    const dataTunnel = new FormData();
    dataTunnel.append('nlQuery', nlQuery);
    
    // Append the user's localized Area of Interest bounding constraints if globally initialized
    dataTunnel.append('aoi', JSON.stringify({ source: 'ui_viewport_boundaries' }));

    selectedFiles.forEach((file) => {
      dataTunnel.append('satellite_images', file);
    });

    onSubmitQuery(dataTunnel);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <form onSubmit={executeSubmission} className="space-y-4">
        
        {/* Dynamic Drag-and-Drop Dropzone Matrix */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-emerald-500 bg-slate-800/50' 
              : 'border-slate-700 hover:border-slate-600 bg-slate-950'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".tif,.tiff,.png,.jpg,.jpeg"
            className="hidden"
          />
          <div className="text-slate-400 text-sm">
            <span className="text-emerald-400 font-medium">Click to upload</span> or drag and drop satellite files
          </div>
          <p className="text-slate-500 text-xs mt-1">Accepts GeoTIFF (.tif) or standard image templates (Max 2 files)</p>
        </div>

        {/* Selected Image Metadata Preview Badges */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-md text-xs text-slate-300"
              >
                <span className="truncate max-w-[180px] font-mono">{file.name}</span>
                <span className="text-slate-500">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFileFromBatch(idx); }}
                  className="text-slate-500 hover:text-rose-400 font-bold ml-1 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Core Query String Input Area */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask SatQuery AI about the scene (e.g., 'Detect changes between these dates')..."
            className="w-full bg-transparent focus:outline-none text-slate-100 text-sm placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !nlQuery.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 text-xs font-semibold px-4 py-2 rounded transition-colors shadow-lg shadow-emerald-500/10"
          >
            {isLoading ? 'Processing...' : 'Run DAG'}
          </button>
        </div>
      </form>
    </div>
  );
};
