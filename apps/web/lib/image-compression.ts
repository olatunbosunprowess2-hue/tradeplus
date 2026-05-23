import imageCompression from 'browser-image-compression';

/**
 * Helper to get image dimensions.
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ width: 0, height: 0 });
        };
        img.src = url;
    });
}

/**
 * Compresses an image file before upload.
 * - Max width/height: 1920px
 * - Max size: 500KB (0.5MB)
 * - Output format: WebP
 *
 * If the file is already under 500KB and within 1920px dimensions, it passes through quickly.
 * Videos and non-image files are returned as-is.
 */
export async function compressImage(file: File): Promise<File> {
    // Skip non-image files (videos, etc.)
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Skip if already extremely small (under 500KB), is webp, AND is within 1920px dimensions
    if (file.size <= 0.5 * 1024 * 1024 && file.type === 'image/webp') {
        try {
            const dims = await getImageDimensions(file);
            if (dims.width > 0 && dims.width <= 1920 && dims.height <= 1920) {
                return file;
            }
        } catch (e) {
            console.warn('Failed to check image dimensions, proceeding with compression:', e);
        }
    }

    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        preserveExif: false,
        fileType: 'image/webp' as const,
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
