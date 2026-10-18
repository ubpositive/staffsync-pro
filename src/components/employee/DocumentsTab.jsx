import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, FileText, UploadCloud, ExternalLink, Loader2, X } from 'lucide-react';
import { REQUIRED_DOCS } from '@/lib/hr-utils';

export default function DocumentsTab({ employee, isAdmin, onUpdated }) {
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);

  const docState = (key) => ({
    submitted: !!employee[`doc_${key}_submitted`],
    url: employee[`doc_${key}_url`],
  });

  const handleFile = async (key, file) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Employee.update(employee.id, {
        [`doc_${key}_url`]: file_url,
        [`doc_${key}_submitted`]: true,
      });
      onUpdated();
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  const toggleSubmitted = async (key, checked) => {
    setSaving(true);
    try {
      await base44.entities.Employee.update(employee.id, { [`doc_${key}_submitted`]: checked });
      onUpdated();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <Card className="border-slate-200 shadow-sm divide-y divide-slate-100">
        {REQUIRED_DOCS.map((d) => {
          const st = docState(d.key);
          return (
            <div key={d.key} className="flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${st.submitted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {st.submitted ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{d.label}</p>
                {st.url ? (
                  <a href={st.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" /> View file
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">{st.submitted ? 'Marked as submitted' : 'No file uploaded'}</p>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={st.submitted} disabled={saving} onCheckedChange={(c) => toggleSubmitted(d.key, c)} />
                    <span className="text-xs text-slate-500">Submitted</span>
                  </label>
                  {st.url ? (
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <a href={st.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
                      </a>
                    </Button>
                  ) : null}
                  <label className="cursor-pointer">
                    <Input type="file" className="hidden" onChange={(e) => handleFile(d.key, e.target.files?.[0])} />
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors">
                      {uploading[d.key] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      {uploading[d.key] ? 'Uploading…' : 'Upload'}
                    </span>
                  </label>
                </div>
              )}
              {!isAdmin && (
                <div className="text-sm">
                  {st.submitted ? (
                    <span className="text-emerald-600">✓ Submitted</span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Pending</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
      {!isAdmin && (
        <p className="text-xs text-slate-400 mt-3">Only admins can upload or update documents.</p>
      )}
    </div>
  );
}