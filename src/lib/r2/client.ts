import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// R2 uses S3-compatible API
const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'power-lunch-images'
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

export async function uploadImage(
    file: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    const key = `images/${Date.now()}-${filename}`

    await R2.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    }))

    return `${PUBLIC_URL}/${key}`
}

export async function deleteImage(url: string): Promise<void> {
    const key = url.replace(`${PUBLIC_URL}/`, '')

    await R2.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    }))
}

export { R2, BUCKET_NAME, PUBLIC_URL }
