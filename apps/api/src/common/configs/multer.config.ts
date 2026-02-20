import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            // Distinguish between public and private fields
            const privateFields = ['faceVerification', 'idDocumentFront', 'idDocumentBack'];
            const isPrivate = privateFields.includes(file.fieldname);

            const uploadPath = isPrivate ? './private-uploads' : './uploads';

            // Create folder if it doesn't exist
            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Generating a 32 random chars long string
            const randomName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');

            // For private files, we might want to prefix them or just keep them random
            cb(null, `${randomName}${extname(file.originalname)}`);
        },
    }),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit per file (smartphones produce 10-20MB images; Cloudinary compresses downstream)
        fieldSize: 20 * 1024 * 1024, // 20MB limit for non-file fields
    },
    fileFilter: (req: any, file: any, cb: any) => {
        // Allow images and common video formats
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm)$/)) {
            // Allow storage of file
            cb(null, true);
        } else {
            // Reject file
            cb(new Error(`Unsupported file type ${extname(file.originalname)}`), false);
        }
    },
};
