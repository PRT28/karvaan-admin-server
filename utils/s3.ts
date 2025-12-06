import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAXGLE2RBDAPPUDPTE',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'cooncierge-docs';

export interface UploadedDocument {
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Upload a file to S3
 * @param file - The file buffer and metadata
 * @param folder - The folder path in S3 bucket
 * @returns The uploaded document details with public URL
 */
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'quotation-documents'
): Promise<UploadedDocument> => {
  const fileExtension = file.originalname.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const key = `${folder}/${uniqueFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Make the object publicly readable
    ACL: 'public-read',
  });

  await s3Client.send(command);

  // Construct the public URL
  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

  return {
    originalName: file.originalname,
    fileName: uniqueFileName,
    url,
    key,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
  };
};

/**
 * Upload multiple files to S3
 * @param files - Array of files to upload
 * @param folder - The folder path in S3 bucket
 * @returns Array of uploaded document details
 */
export const uploadMultipleToS3 = async (
  files: Express.Multer.File[],
  folder: string = 'quotation-documents'
): Promise<UploadedDocument[]> => {
  const uploadPromises = files.map((file) => uploadToS3(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete a file from S3
 * @param key - The S3 object key to delete
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Delete multiple files from S3
 * @param keys - Array of S3 object keys to delete
 */
export const deleteMultipleFromS3 = async (keys: string[]): Promise<void> => {
  const deletePromises = keys.map((key) => deleteFromS3(key));
  await Promise.all(deletePromises);
};

export { s3Client, BUCKET_NAME };

