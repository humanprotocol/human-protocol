import { StorageCredentials, StorageParams, UploadFile } from '@human-protocol/sdk';
import * as Minio from 'minio';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { PassThrough, Readable } from 'stream';
import axios from 'axios';
import { Logger } from '@nestjs/common';

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

        Logger.log(`File from ${url} copied to ${destBucket}/${key}`)

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
        Logger.error('Error copying file:', error);
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