import multer from 'multer';
import path from 'path';
import fs from 'fs';

const BASE_UPLOAD_DIR = path.join(__dirname, '../../../../uploads');

export const createUploadMiddleware = (subDir: string, limitMb: number = 5) => {
  const uploadDir = path.join(BASE_UPLOAD_DIR, subDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP are allowed.'));
    }
  };

  return multer({ 
    storage,
    limits: { fileSize: limitMb * 1024 * 1024 },
    fileFilter 
  });
};

// Default upload middleware for backward compatibility (avatars)
export const upload = createUploadMiddleware('avatars');

