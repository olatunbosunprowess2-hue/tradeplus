import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = './uploads';
            // Create folder if it doesn't exist
            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath);
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Generating a 32 random chars long string
            const randomName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');
            // Calling the callback passing the random name generated with the original extension name
            cb(null, `${randomName}${extname(file.originalname)}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            // Allow storage of file
            cb(null, true);
        } else {
            // Reject file
            cb(new Error(`Unsupported file type ${extname(file.originalname)}`), false);
        }
    },
};
