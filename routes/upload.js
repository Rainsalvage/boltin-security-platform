const express = require('express');
const { Router } = require('express');
const router = Router();
const { devicesDB } = require('../utils/database');
const { authenticateToken } = require('../utils/middleware');
const { 
    upload, 
    handleMulterError, 
    asyncHandler, 
    sendSuccess, 
    sendError,
    cleanupFiles 
} = require('../utils/middleware');
const { idValidationRules, handleValidationErrors } = require('../utils/validators');
const fs = require('fs').promises;
const path = require('path');

// POST /api/upload/device-images/:deviceId - Upload images for a device
router.post('/device-images/:deviceId',
    authenticateToken,
    idValidationRules(),
    handleValidationErrors,
    upload.array('deviceImages', 10),
    handleMulterError,
    asyncHandler(async (req, res) => {
        const deviceId = req.params.deviceId;
        
        if (!req.files || req.files.length === 0) {
            return sendError(res, 'No images uploaded', 400);
        }

        // Check if device exists
        const device = await devicesDB.findById(deviceId);
        if (!device) {
            // Clean up uploaded files if device doesn't exist
            await cleanupFiles(req.files);
            return sendError(res, 'Device not found', 404);
        }

        // Process uploaded files
        const imageUrls = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: `/uploads/images/${file.filename}`,
            size: file.size,
            uploadedAt: new Date().toISOString()
        }));

        // Update device with image information
        const currentImages = device.images || [];
        const updatedImages = [...currentImages, ...imageUrls];

        const updatedDevice = await devicesDB.update(deviceId, {
            images: updatedImages
        });

        sendSuccess(res, {
            device: updatedDevice,
            uploadedImages: imageUrls,
            totalImages: updatedImages.length
        }, `${imageUrls.length} image(s) uploaded successfully`);
    })
);

// DELETE /api/upload/device-images/:deviceId/:filename - Delete a specific image
router.delete('/device-images/:deviceId/:filename',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { deviceId, filename } = req.params;
        
        // Check if device exists
        const device = await devicesDB.findById(deviceId);
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        // Find and remove the image from device record
        const currentImages = device.images || [];
        const imageIndex = currentImages.findIndex(img => img.filename === filename);
        
        if (imageIndex === -1) {
            return sendError(res, 'Image not found in device record', 404);
        }

        // Remove image from array
        const updatedImages = currentImages.filter(img => img.filename !== filename);
        
        // Update device record
        const updatedDevice = await devicesDB.update(deviceId, {
            images: updatedImages
        });

        // Delete physical file
        try {
            const filePath = path.join('uploads', 'images', filename);
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting physical file:', error);
            // Continue even if file deletion fails
        }

        sendSuccess(res, {
            device: updatedDevice,
            deletedImage: filename,
            remainingImages: updatedImages.length
        }, 'Image deleted successfully');
    })
);

// GET /api/upload/device-images/:deviceId - Get all images for a device
router.get('/device-images/:deviceId',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const deviceId = req.params.deviceId;
        
        const device = await devicesDB.findById(deviceId);
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        const images = device.images || [];
        
        sendSuccess(res, {
            deviceId,
            images,
            count: images.length
        });
    })
);

// POST /api/upload/bulk-device-images - Upload images before device registration
router.post('/bulk-device-images',
    upload.array('deviceImages', 10),
    handleMulterError,
    asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return sendError(res, 'No images uploaded', 400);
        }

        // Process uploaded files
        const imageUrls = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: `/uploads/images/${file.filename}`,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            temporary: true // Mark as temporary until associated with a device
        }));

        sendSuccess(res, {
            uploadedImages: imageUrls,
            count: imageUrls.length,
            note: 'Images uploaded successfully. Remember to associate them with a device during registration.'
        }, `${imageUrls.length} image(s) uploaded successfully`);
    })
);

// POST /api/upload/associate-images/:deviceId - Associate temporary images with a device
router.post('/associate-images/:deviceId',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const deviceId = req.params.deviceId;
        const { imageFilenames } = req.body;
        
        if (!imageFilenames || !Array.isArray(imageFilenames)) {
            return sendError(res, 'Image filenames array is required', 400);
        }

        // Check if device exists
        const device = await devicesDB.findById(deviceId);
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        // Verify all image files exist
        const imageUrls = [];
        for (const filename of imageFilenames) {
            try {
                const filePath = path.join('uploads', 'images', filename);
                await fs.access(filePath);
                
                // Get file stats
                const stats = await fs.stat(filePath);
                
                imageUrls.push({
                    filename,
                    path: `/uploads/images/${filename}`,
                    size: stats.size,
                    associatedAt: new Date().toISOString(),
                    temporary: false
                });
            } catch (error) {
                return sendError(res, `Image file ${filename} not found`, 404);
            }
        }

        // Update device with associated images
        const currentImages = device.images || [];
        const updatedImages = [...currentImages, ...imageUrls];

        const updatedDevice = await devicesDB.update(deviceId, {
            images: updatedImages
        });

        sendSuccess(res, {
            device: updatedDevice,
            associatedImages: imageUrls,
            totalImages: updatedImages.length
        }, `${imageUrls.length} image(s) associated with device successfully`);
    })
);

// GET /api/upload/cleanup-temp - Clean up temporary/orphaned images
router.get('/cleanup-temp', asyncHandler(async (req, res) => {
    const uploadsDir = path.join('uploads', 'images');
    
    try {
        // Get all files in uploads directory
        const files = await fs.readdir(uploadsDir);
        
        // Get all devices and their images
        const devices = await devicesDB.read();
        const usedImages = new Set();
        
        devices.forEach(device => {
            if (device.images) {
                device.images.forEach(img => usedImages.add(img.filename));
            }
        });
        
        // Find orphaned files (older than 24 hours and not associated with any device)
        const orphanedFiles = [];
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const file of files) {
            if (!usedImages.has(file)) {
                const filePath = path.join(uploadsDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < oneDayAgo) {
                    orphanedFiles.push(file);
                }
            }
        }
        
        sendSuccess(res, {
            totalFiles: files.length,
            usedImages: usedImages.size,
            orphanedFiles: orphanedFiles.length,
            orphanedFilesList: orphanedFiles
        });
        
    } catch (error) {
        sendError(res, 'Error accessing uploads directory', 500);
    }
}));

// DELETE /api/upload/cleanup-temp - Actually delete temporary/orphaned images
router.delete('/cleanup-temp', asyncHandler(async (req, res) => {
    const uploadsDir = path.join('uploads', 'images');
    const { force } = req.query; // Add ?force=true to actually delete
    
    if (!force) {
        return sendError(res, 'Add ?force=true parameter to confirm deletion', 400);
    }
    
    try {
        // Get all files in uploads directory
        const files = await fs.readdir(uploadsDir);
        
        // Get all devices and their images
        const devices = await devicesDB.read();
        const usedImages = new Set();
        
        devices.forEach(device => {
            if (device.images) {
                device.images.forEach(img => usedImages.add(img.filename));
            }
        });
        
        // Find and delete orphaned files
        const deletedFiles = [];
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const file of files) {
            if (!usedImages.has(file)) {
                const filePath = path.join(uploadsDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < oneDayAgo) {
                    try {
                        await fs.unlink(filePath);
                        deletedFiles.push(file);
                    } catch (deleteError) {
                        console.error(`Error deleting file ${file}:`, deleteError);
                    }
                }
            }
        }
        
        sendSuccess(res, {
            deletedFiles: deletedFiles.length,
            deletedFilesList: deletedFiles
        }, `${deletedFiles.length} orphaned file(s) deleted successfully`);
        
    } catch (error) {
        sendError(res, 'Error during cleanup operation', 500);
    }
}));

// POST /api/upload/camera-signature/:deviceId - Upload camera signature for a device
router.post('/camera-signature/:deviceId',
    authenticateToken,
    idValidationRules(),
    handleValidationErrors,
    upload.single('cameraSignature'),
    handleMulterError,
    asyncHandler(async (req, res) => {
        const deviceId = req.params.deviceId;
        
        if (!req.file) {
            return sendError(res, 'No camera signature uploaded', 400);
        }

        // Check if device exists
        const device = await devicesDB.findById(deviceId);
        if (!device) {
            // Clean up uploaded file if device doesn't exist
            await cleanupFiles([req.file]);
            return sendError(res, 'Device not found', 404);
        }

        // Process uploaded signature file
        const signatureData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: `/uploads/images/${req.file.filename}`,
            size: req.file.size,
            uploadedAt: new Date().toISOString(),
            type: 'camera_signature'
        };

        // Update device with camera signature
        const updatedDevice = await devicesDB.update(deviceId, {
            cameraSignature: signatureData
        });

        sendSuccess(res, {
            device: updatedDevice,
            cameraSignature: signatureData
        }, 'Camera signature uploaded successfully');
    })
);

// DELETE /api/upload/camera-signature/:deviceId - Delete camera signature
router.delete('/camera-signature/:deviceId',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const deviceId = req.params.deviceId;
        
        // Check if device exists
        const device = await devicesDB.findById(deviceId);
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        if (!device.cameraSignature) {
            return sendError(res, 'No camera signature found for this device', 404);
        }

        const signatureFilename = device.cameraSignature.filename;
        
        // Update device record to remove camera signature
        const updatedDevice = await devicesDB.update(deviceId, {
            cameraSignature: null
        });

        // Delete physical file
        try {
            const filePath = path.join('uploads', 'images', signatureFilename);
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting camera signature file:', error);
            // Continue even if file deletion fails
        }

        sendSuccess(res, {
            device: updatedDevice,
            deletedSignature: signatureFilename
        }, 'Camera signature deleted successfully');
    })
);

module.exports = router;