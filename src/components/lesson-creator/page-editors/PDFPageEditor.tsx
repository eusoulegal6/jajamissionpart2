import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PDFPageEditorProps {
  content: any;
  onChange: (updates: any) => void;
}

export const PDFPageEditor: React.FC<PDFPageEditorProps> = ({ content, onChange }) => {
  const handlePdfUrlChange = (value: string) => {
    onChange({ pdfUrl: value });
  };

  const handleTitleChange = (value: string) => {
    onChange({ title: value });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>PDF Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title (Optional)</Label>
            <Input
              id="title"
              value={content.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter page title..."
            />
          </div>
          
          <div>
            <Label htmlFor="pdfUrl">PDF URL *</Label>
            <Input
              id="pdfUrl"
              value={content.pdfUrl || ''}
              onChange={(e) => handlePdfUrlChange(e.target.value)}
              placeholder="https://example.com/document.pdf"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the URL of the PDF file to display. The PDF must be publicly accessible.
            </p>
          </div>
        </CardContent>
      </Card>

      {content.pdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>PDF URL: <span className="font-mono text-xs break-all">{content.pdfUrl}</span></p>
              <p className="mt-2">
                The PDF viewer will include zoom controls, page navigation, and rotation options.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
