// src/config/s3Config.ts

/**
 * S3 Bucket Configuration
 * Central configuration for all S3 file paths
 */

// S3 Base URL
export const S3_BASE_URL = 'https://sltouch-rdsbackup-bucket.s3.us-east-2.amazonaws.com';

// Upload docs base path
export const UPLOAD_DOCS_PATH = 'Upload+docs';

// Module-specific folder names
export const S3_FOLDERS = {
    CC_BUDGET_AMENDMENT: 'AmendCCBudgetPROD',
    PURCHASE_ORDER: 'PurchaseOrders',
    SUPPLIER_PO: 'SupplierPO',
    STAFF_DOCUMENTS: 'StaffDocuments',
    LEAVE_ATTACHMENTS: 'LeaveAttachments',
    // Add more folders as needed
} as const;

/**
 * Build complete S3 URL
 * @param folderName - Folder name from S3_FOLDERS
 * @param filePath - File path/name from API
 * @returns Complete S3 URL or null if no filePath
 */
export const buildS3Url = (folderName: string, filePath: string | null | undefined): string | null => {
    if (!filePath) return null;

    // If already a full URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

    // Construct: S3_BASE_URL + UPLOAD_DOCS_PATH + FOLDER + FILE_PATH
    return `${S3_BASE_URL}/${UPLOAD_DOCS_PATH}/${folderName}/${cleanPath}`;
};

/**
 * Module-specific helper functions
 */
export const buildCCBudgetAmendmentUrl = (filePath: string | null | undefined): string | null => {
    return buildS3Url(S3_FOLDERS.CC_BUDGET_AMENDMENT, filePath);
};

export const buildPurchaseOrderUrl = (filePath: string | null | undefined): string | null => {
    return buildS3Url(S3_FOLDERS.PURCHASE_ORDER, filePath);
};

export const buildSupplierPOUrl = (filePath: string | null | undefined): string | null => {
    return buildS3Url(S3_FOLDERS.SUPPLIER_PO, filePath);
};

export const buildStaffDocumentUrl = (filePath: string | null | undefined): string | null => {
    return buildS3Url(S3_FOLDERS.STAFF_DOCUMENTS, filePath);
};

export const buildLeaveAttachmentUrl = (filePath: string | null | undefined): string | null => {
    return buildS3Url(S3_FOLDERS.LEAVE_ATTACHMENTS, filePath);
};

/**
 * Get file name from path
 * @param filePath - Full or partial file path
 * @returns File name only
 */
export const getFileName = (filePath: string | null | undefined): string => {
    if (!filePath) return '';
    return filePath.split('/').pop() || '';
};

/**
 * Check if file is an image
 * @param filePath - File path or URL
 * @returns true if image file
 */
export const isImageFile = (filePath: string | null | undefined): boolean => {
    if (!filePath) return false;
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filePath);
};

/**
 * Check if file is a PDF
 * @param filePath - File path or URL
 * @returns true if PDF file
 */
export const isPdfFile = (filePath: string | null | undefined): boolean => {
    if (!filePath) return false;
    return /\.pdf$/i.test(filePath);
};

/**
 * Get file extension
 * @param filePath - File path or URL
 * @returns File extension (without dot)
 */
export const getFileExtension = (filePath: string | null | undefined): string => {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

/**
 * Check if file can be previewed in the app
 * @param filePath - File path or URL
 * @returns true if file can be previewed
 */
export const canPreviewFile = (filePath: string | null | undefined): boolean => {
    return isImageFile(filePath) || isPdfFile(filePath);
};

/**
 * Get MIME type from file path
 * @param filePath - File path or URL
 * @returns MIME type string
 */
export const getMimeType = (filePath: string | null | undefined): string => {
    const extension = getFileExtension(filePath);

    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'csv': 'text/csv',
    };

    return mimeTypes[extension] || 'application/octet-stream';
};

export default {
    S3_BASE_URL,
    UPLOAD_DOCS_PATH,
    S3_FOLDERS,
    buildS3Url,
    buildCCBudgetAmendmentUrl,
    buildPurchaseOrderUrl,
    buildSupplierPOUrl,
    buildStaffDocumentUrl,
    buildLeaveAttachmentUrl,
    getFileName,
    isImageFile,
    isPdfFile,
    getFileExtension,
    canPreviewFile,
    getMimeType,
};