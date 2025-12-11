import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Interface for bulk upload result
export interface BulkUploadResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  createdCustomers: any[];
}

// Helper function to parse CSV data
export const parseCSVData = (buffer: Buffer): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Helper function to parse XLSX data
export const parseXLSXData = (buffer: Buffer): any[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};