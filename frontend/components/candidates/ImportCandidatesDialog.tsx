import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/ui/drawer';

interface CandidateData {
  name: string;
  email: string;
  resumeUrl?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateCandidateData = (data: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const emails = new Set<string>();

  if (data.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors };
  }

  // Check required headers
  const requiredHeaders = ['name', 'email'];
  const headers = Object.keys(data[0]);
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    return { isValid: false, errors };
  }

  data.forEach((row, index) => {
    // Check required fields
    if (!row.name?.trim()) {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    if (!row.email?.trim()) {
      errors.push(`Row ${index + 1}: Email is required`);
    } else {
      const email = row.email.trim().toLowerCase();
      if (!validateEmail(email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
      }
      if (emails.has(email)) {
        errors.push(`Row ${index + 1}: Duplicate email address`);
      }
      emails.add(email);
    }

    // Validate resumeUrl if provided
    if (row.resumeUrl && typeof row.resumeUrl === 'string') {
      try {
        new URL(row.resumeUrl);
      } catch {
        errors.push(`Row ${index + 1}: Invalid resume URL`);
      }
    }
  });

  return { isValid: errors.length === 0, errors };
};

import { useOrganization } from '@/providers/OrganizationProvider';

export default function ImportCandidatesDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { currentOrg } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<CandidateData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<CandidateData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setErrors([]);
    setPreviewData([]);
    setShowPreview(false);
    setCsvData([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { isValid, errors } = validateCandidateData(results.data);
        if (!isValid) {
          setErrors(errors);
          return;
        }

        const validData = results.data.map((row: any) => ({
          name: row.name.trim(),
          email: row.email.trim().toLowerCase(),
          resumeUrl: row.resumeUrl?.trim()
        }));

        setCsvData(validData);
        setPreviewData(validData.slice(0, 5)); // Show first 5 rows in preview
        setShowPreview(true);
      },
      error: (error) => {
        setErrors(['Error parsing CSV file: ' + error.message]);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsLoading(true);

    try {
      // Transform CSV data to match candidate structure
      if (csvData.length === 0) {
        alert('Please upload a valid CSV file first');
        return;
      }

      const candidates = csvData.map(row => ({
        name: row.name,
        email: row.email,
        resumeUrl: row.resumeUrl
      }));

      const response = await fetch('/api/candidates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates,
          organizationId: currentOrg.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to import candidates');
      }

      const data = await response.json();
      const message = data.count === 1
        ? 'Successfully imported 1 candidate'
        : `Successfully imported ${data.count} candidates`;

      setErrors([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error importing candidates:', error);
      setErrors(['Failed to import candidates. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>Import Candidates</DrawerTitle>
          <DrawerClose onClick={onClose} />
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-4 overflow-auto">
            {errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload CSV File</label>
              <p className="mt-1 text-sm text-gray-500">
                File should contain columns: name, email, resumeUrl (optional)
              </p>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark"
              />
            </div>

            {showPreview && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview ({csvData.length} candidates)</h3>
                <div className="max-h-64 overflow-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resume URL</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((candidate, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{candidate.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{candidate.email}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {candidate.resumeUrl ? (
                              <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark">
                                View Resume
                              </a>
                            ) : (
                              <span className="text-gray-400">Not provided</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <div className="p-4 text-sm text-gray-500 border-t border-gray-200 bg-gray-50">
                      ... and {csvData.length - 5} more candidates
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DrawerFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || csvData.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Importing...' : 'Import Candidates'}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
