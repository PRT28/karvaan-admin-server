import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
const getUuid = async () => {
  const { v4: uuidv4 } = await import("uuid");
  return uuidv4();
};




// Lazy initialization of S3 Client to ensure env vars are loaded
let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || '',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
};

export const getBucketName = (): string => {
  return process.env.AWS_S3_BUCKET_NAME || '';
};

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
  folder: string = ''
): Promise<UploadedDocument> => {
  const fileExtension = file.originalname.split('.').pop();
  const uniqueFileName = `${await getUuid()}.${fileExtension}`;

  const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
  const bucketName = getBucketName();
  const region = process.env.AWS_REGION || '';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Make the object publicly readable
    ACL: 'public-read',
  });

  await getS3Client().send(command);

  // Construct the public URL
  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

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
  folder: string = ''
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
    Bucket: getBucketName(),
    Key: key,
  });

  await getS3Client().send(command);
};

/**
 * Delete multiple files from S3
 * @param keys - Array of S3 object keys to delete
 */
export const deleteMultipleFromS3 = async (keys: string[]): Promise<void> => {
  const deletePromises = keys.map((key) => deleteFromS3(key));
  await Promise.all(deletePromises);
};

