import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before upload.
 * - Max width: 1200px
 * - Max size: 2MB
 * - Output format: JPEG/WebP (auto)
 *
 * If the file is already under 2MB and small enough, it passes through quickly.
 * Videos and non-image files are returned as-is.
 */
export async function compressImage(file: File): Promise<File> {
    // Skip non-image files (videos, etc.)
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Skip if already small enough (under 2MB)
    if (file.size <= 2 * 1024 * 1024) {
        return file;
    }

    const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        preserveExif: false,
        fileType: file.type as string,
    };

    try {
        const compressed = await imageCompression(file, options);
        // Return as a File object with the original name
        return new File([compressed], file.name, { type: compressed.type });
    } catch (error) {
        console.warn('Image compression failed, using original:', error);
        return file; // Fallback to original if compression fails
    }
}

/**
 * Compresses multiple image files in parallel.
 */
export async function compressImages(files: File[]): Promise<File[]> {
    return Promise.all(files.map(compressImage));
}
