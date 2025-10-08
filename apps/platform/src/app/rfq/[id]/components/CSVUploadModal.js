/**
 * Component: CSV Upload Modal
 * Purpose: Allow bulk import of partner contacts via CSV file
 * Features: File upload, CSV parsing with Papa Parse, validation, preview
 * Format: email,company_name,contact_person
 */

import { useState } from 'react';
import Papa from 'papaparse';
import { Card, Button } from '@sanctuari/ui';
import './csv-upload-modal.css';

export default function CSVUploadModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedContacts, setParsedContacts] = useState([]);
  const [errors, setErrors] = useState([]);
  const [validContacts, setValidContacts] = useState([]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    setParsing(true);
    setErrors([]);
    setParsedContacts([]);
    setValidContacts([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const contacts = [];
        const errorList = [];
        const validList = [];

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because CSV has header row and 0-indexed
          const email = row.email?.trim().toLowerCase();
          const company = row.company_name?.trim() || row.company?.trim();
          const person = row.contact_person?.trim() || row.person?.trim() || '';

          // Validate email
          if (!email) {
            errorList.push({ row: rowNumber, message: 'Missing email address' });
            return;
          }

          if (!validateEmail(email)) {
            errorList.push({ row: rowNumber, email, message: 'Invalid email format' });
            return;
          }

          // Validate company
          if (!company) {
            errorList.push({ row: rowNumber, email, message: 'Missing company name' });
            return;
          }

          // Check for duplicates within CSV
          if (contacts.find(c => c.email === email)) {
            errorList.push({ row: rowNumber, email, message: 'Duplicate email in CSV' });
            return;
          }

          const contact = {
            email,
            company,
            contactPerson: person,
            row: rowNumber
          };

          contacts.push(contact);
          validList.push(contact);
        });

        setParsedContacts(results.data);
        setErrors(errorList);
        setValidContacts(validList);
        setParsing(false);
      },
      error: (error) => {
        alert(`Failed to parse CSV: ${error.message}`);
        setParsing(false);
      }
    });
  };

  const handleImport = () => {
    if (validContacts.length === 0) {
      alert('No valid contacts to import');
      return;
    }

    onImport(validContacts);
    onClose();
  };

  const handleDownloadTemplate = () => {
    const template = 'email,company_name,contact_person\njohn@insurance.com,ABC Insurance,John Doe\njane@broker.com,XYZ Brokers,Jane Smith';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="csv-upload-modal-overlay" onClick={onClose}>
      <div className="csv-upload-modal" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="csv-modal-header">
            <h3>Import Contacts from CSV</h3>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="csv-modal-content">
            {!file && (
              <>
                <div className="csv-format-info">
                  <h4>CSV Format</h4>
                  <p>Your CSV file should have these columns:</p>
                  <div className="csv-format-example">
                    <code>email,company_name,contact_person</code>
                  </div>
                  <Button variant="secondary" size="small" onClick={handleDownloadTemplate}>
                    Download Template
                  </Button>
                </div>

                <div className="csv-upload-area">
                  <input
                    type="file"
                    accept=".csv"
                    id="csv-file-input"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file-input" className="csv-upload-label">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Click to upload CSV file</span>
                    <span className="upload-hint">or drag and drop</span>
                  </label>
                </div>
              </>
            )}

            {parsing && (
              <div className="csv-parsing">
                <div className="loading-spinner"></div>
                <p>Parsing CSV file...</p>
              </div>
            )}

            {file && !parsing && (
              <div className="csv-preview">
                <div className="csv-preview-header">
                  <div className="csv-file-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>{file.name}</span>
                  </div>
                  <button className="change-file-btn" onClick={() => setFile(null)}>
                    Change File
                  </button>
                </div>

                <div className="csv-stats">
                  <div className="stat-item stat-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{validContacts.length} valid contacts</span>
                  </div>
                  {errors.length > 0 && (
                    <div className="stat-item stat-error">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{errors.length} errors</span>
                    </div>
                  )}
                </div>

                {errors.length > 0 && (
                  <div className="csv-errors">
                    <h4>Errors Found:</h4>
                    <div className="error-list">
                      {errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="error-item">
                          <span className="error-row">Row {error.row}</span>
                          {error.email && <span className="error-email">{error.email}</span>}
                          <span className="error-message">{error.message}</span>
                        </div>
                      ))}
                      {errors.length > 10 && (
                        <p className="error-overflow">+ {errors.length - 10} more errors</p>
                      )}
                    </div>
                  </div>
                )}

                {validContacts.length > 0 && (
                  <div className="csv-valid-contacts">
                    <h4>Valid Contacts Preview:</h4>
                    <div className="contacts-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Contact Person</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validContacts.slice(0, 5).map((contact, index) => (
                            <tr key={index}>
                              <td>{contact.email}</td>
                              <td>{contact.company}</td>
                              <td>{contact.contactPerson || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validContacts.length > 5 && (
                        <p className="contacts-overflow">+ {validContacts.length - 5} more contacts</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="csv-modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {validContacts.length > 0 && (
              <Button onClick={handleImport}>
                Import {validContacts.length} Contact{validContacts.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
