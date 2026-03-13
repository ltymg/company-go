import { useEffect, useState } from 'react';
import api from '../lib/api';
import Button from './ui/Button';

export default function Documents({ companyId }: { companyId: number }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/companies/${companyId}/documents`);
      setDocs(data);
    } catch (error) {
      console.error('Failed to load documents', error);
    }
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('companyId', String(companyId));
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      await load();
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Documents</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-300 hover:file:bg-indigo-500/20"
          />
          <Button onClick={upload} disabled={!file || loading} size="sm" variant="secondary">
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        {docs.length === 0 ? (
          <p className="text-xs text-gray-500 pt-2">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2 pt-2">
            {docs.map((d) => (
              <li key={d.id} className="text-sm">
                <a className="text-indigo-400 hover:text-indigo-300 hover:underline truncate" href={`http://localhost:3000/uploads/${d.path}`} target="_blank" rel="noreferrer">
                  {d.path}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
