import { StorageCredentials, StorageParams, UploadFile } from '@human-protocol/sdk';
import * as Minio from 'minio';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { PassThrough, Readable } from 'stream';
import axios from 'axios';

/**
   * **Copy file from a URL to cloud storage**
   *
   * @param {string} url - URL of the source file
   * @param {string} destBucket - Destination bucket name
   * @param {StorageParams} clientParams - Configuration parameters for cloud storage
   * @param {StorageCredentials} [credentials] - Optional. Cloud storage access data. If credentials are not provided, use anonymous access to the bucket
   * @returns {Promise<UploadFile>} - Uploaded file with key/hash
   */
export async function copyFileFromURLToBucket(
    url: string,
    destBucket: string,
    clientParams: StorageParams,
    credentials?: StorageCredentials,
): Promise<UploadFile> {
    try {
        const client: Minio.Client = new Minio.Client({
            ...clientParams,
            accessKey: credentials?.accessKey ?? '',
            secretKey: credentials?.secretKey ?? '',
        });

        const { data } = await axios.get(url, { responseType: 'stream' });
        const stream = new PassThrough();
        data.pipe(stream);
        
        const hash = await hashStream(data);
        const key = `s3${hash}.zip`; 

        await new Promise((resolve, reject) => {
            client.putObject(destBucket, key, stream, (err, etag) => {
                if (err) reject(err);
                else resolve(etag);
            });
        });

        console.log(`File from ${url} copied to ${destBucket}/${key}`);

        return {
            key,
            url: `${clientParams.useSSL ? 'https' : 'http'}://${
              clientParams.endPoint
            }${
              clientParams.port ? `:${clientParams.port}` : ''
            }/${destBucket}/${key}`,
            hash,
          };
    } catch (error) {
        console.error('Error copying file:', error);
        throw new Error('File not uploaded');
    }
}

function hashStream(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha1');
        
        stream.on('data', (chunk) => {
            hash.update(chunk);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        stream.on('error', (error) => {
            reject(error);
        });
    });
}


type InputFile = {
    type: 'path',
    path: string,
} | {
    type: 'object',
    content: any,
};

// TODO: Can be used for future implementaton in SDK Storage module
/**
   * **Upload file to cloud storage**
   *
   * @param {File[]} files - Files to upload
   * @param {string} bucket - Bucket name
   * @param {StorageParams} params - Cloud storage params
   * @param {StorageCredentials} credentials - Optional. Cloud storage access data. If credentials is not provided - use an anonymous access to the bucket
   * @returns {Promise<UploadFile>} - Uploaded file with key/hash
   */
export async function uploadFiles(
    files: InputFile[],
    bucket: string,
    clientParams: StorageParams,
    credentials?: StorageCredentials,
): Promise<UploadFile[]> {
    const client: Minio.Client = new Minio.Client({
        ...clientParams,
        accessKey: credentials?.accessKey ?? '',
        secretKey: credentials?.secretKey ?? '',
    });

    const isBucketExists = await client.bucketExists(bucket);
    if (!isBucketExists) {
        throw new Error('Bucket not found');
    }

    return Promise.all(
        files.map(async (fileInput) => {
            let hash: crypto.Hash;
            let contentType;
            let contentLength;
            let stream;

            if (fileInput.type === 'path') {
                const filePath = fileInput.path;
                stream = fs.createReadStream(filePath);
                hash = crypto.createHash('sha1');
                stream.on('data', (data) => hash.update(data));

                // Setting a default content type (can be refined)
                contentType = filePath.endsWith('.zip') ? 'application/zip' : 'application/octet-stream';
                contentLength = fs.statSync(filePath).size;
            } else { // for in-memory objects
                const content = JSON.stringify(fileInput.content);
                stream = Buffer.from(content);
                hash = crypto.createHash('sha1').update(content);
                contentType = 'application/json';
                contentLength = Buffer.byteLength(content);
            }

            const fileHash = hash.digest('hex');
            const key = `s3${fileHash}.${contentType === 'application/zip' ? 'zip' : 'json'}`;

            try {
                await client.putObject(bucket, key, stream, {
                    'Content-Type': contentType,
                    'Content-Length': contentLength,
                });

                return {
                    key,
                    url: `${clientParams.useSSL ? 'https' : 'http'}://${
                        clientParams.endPoint
                    }${clientParams.port ? `:${clientParams.port}` : ''}/${bucket}/${key}`,
                    hash: fileHash,
                };
            } catch (e) {
                throw new Error('Error uploading file');
            }
        }),
    );
}