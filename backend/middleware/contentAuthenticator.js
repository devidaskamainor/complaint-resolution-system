// ==========================================
// AI-GENERATED CONTENT DETECTION MIDDLEWARE
// Validates authenticity of uploaded media
// ==========================================

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ContentAuthenticator {
    
    // ==========================================
    // IMAGE AUTHENTICATION
    // ==========================================
    
    static async analyzeImage(filePath) {
        try {
            const imageAnalysis = {
                isAuthentic: true,
                confidence: 100,
                warnings: [],
                metadata: {}
            };

            // Get image metadata
            const metadata = await sharp(filePath).metadata();
            imageAnalysis.metadata = {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                size: metadata.size,
                hasExif: !!metadata.exif,
                orientation: metadata.orientation
            };

            // Check for common AI generation indicators
            
            // 1. Check if EXIF data is missing (AI generators often strip EXIF)
            if (!metadata.exif && metadata.format === 'jpeg') {
                imageAnalysis.warnings.push('Missing EXIF data - common in AI-generated images');
                imageAnalysis.confidence -= 20;
            }

            // 2. Check for unusual dimensions (AI often generates perfect squares or specific sizes)
            if (metadata.width === metadata.height && metadata.width > 1000) {
                imageAnalysis.warnings.push('Perfect square dimensions - may be AI-generated');
                imageAnalysis.confidence -= 15;
            }

            // 3. Check for AI generator signatures in metadata
            if (metadata.exif) {
                const exifString = metadata.exif.toString();
                const aiSignatures = [
                    'DALL-E', 'Midjourney', 'Stable Diffusion', 'AI Generator',
                    'DeepFake', 'GAN', 'Neural', 'Synthetic'
                ];
                
                for (const signature of aiSignatures) {
                    if (exifString.includes(signature)) {
                        imageAnalysis.isAuthentic = false;
                        imageAnalysis.confidence = 0;
                        imageAnalysis.warnings.push(`AI signature detected: ${signature}`);
                        break;
                    }
                }
            }

            // 4. Analyze image complexity (AI images often have unusual patterns)
            const imageBuffer = fs.readFileSync(filePath);
            const imageStats = await sharp(imageBuffer).stats();
            
            // Check for unnatural color distribution
            const channelAverages = imageStats.channels.map(c => c.mean);
            const avgVariation = Math.max(...channelAverages) - Math.min(...channelAverages);
            
            if (avgVariation < 10) {
                imageAnalysis.warnings.push('Unusual color uniformity - may be AI-generated');
                imageAnalysis.confidence -= 10;
            }

            // 5. Check for excessive smoothing (AI images are often too perfect)
            const entropy = await this.calculateImageEntropy(filePath);
            if (entropy < 5) {
                imageAnalysis.warnings.push('Low image entropy - possible AI generation');
                imageAnalysis.confidence -= 15;
            }

            // Set authenticity based on confidence
            if (imageAnalysis.confidence < 50) {
                imageAnalysis.isAuthentic = false;
            }

            return imageAnalysis;
        } catch (error) {
            console.error('Image analysis error:', error);
            return {
                isAuthentic: true,
                confidence: 80,
                warnings: ['Could not fully analyze image'],
                error: error.message
            };
        }
    }

    // Calculate image entropy (measure of randomness/complexity)
    static async calculateImageEntropy(filePath) {
        try {
            const { data, info } = await sharp(filePath)
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Calculate histogram
            const histogram = new Array(256).fill(0);
            for (let i = 0; i < data.length; i++) {
                histogram[data[i]]++;
            }

            // Calculate entropy
            const totalPixels = info.width * info.height;
            let entropy = 0;
            for (let i = 0; i < 256; i++) {
                if (histogram[i] > 0) {
                    const probability = histogram[i] / totalPixels;
                    entropy -= probability * Math.log2(probability);
                }
            }

            return entropy;
        } catch (error) {
            return 7; // Default medium entropy
        }
    }

    // ==========================================
    // VOICE/AUDIO AUTHENTICATION
    // ==========================================
    
    static async analyzeVoice(filePath) {
        try {
            const voiceAnalysis = {
                isAuthentic: true,
                confidence: 100,
                warnings: [],
                metadata: {}
            };

            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            // Get file duration (basic estimation based on file size)
            // For WebM audio, approximately 15-20 KB per second
            const estimatedDuration = fileSize / 17500; // ~17.5 KB/sec average
            
            voiceAnalysis.metadata = {
                fileSize: fileSize,
                estimatedDuration: Math.round(estimatedDuration),
                format: path.extname(filePath).substring(1)
            };

            // Check for AI voice indicators
            
            // 1. Very short recordings (less than 1 second) - likely fake
            if (estimatedDuration < 1) {
                voiceAnalysis.isAuthentic = false;
                voiceAnalysis.confidence = 0;
                voiceAnalysis.warnings.push('Recording too short - likely artificial');
                return voiceAnalysis;
            }

            // 2. Unusually perfect audio (no background noise)
            // This is a simplified check - in production, you'd use audio analysis libraries
            const fileBuffer = fs.readFileSync(filePath);
            
            // Check for silent periods (real recordings have some ambient noise)
            const hasSilence = this.detectSilentPeriods(fileBuffer);
            if (!hasSilence) {
                voiceAnalysis.warnings.push('No ambient noise detected - may be synthetic');
                voiceAnalysis.confidence -= 20;
            }

            // 3. Check file size patterns (AI-generated audio often has consistent patterns)
            // Real voice recordings have variable bit rates
            if (fileSize % 1000 === 0) {
                voiceAnalysis.warnings.push('Unusual file size pattern - may be generated');
                voiceAnalysis.confidence -= 10;
            }

            // 4. Minimum duration requirement for complaints
            if (estimatedDuration < 2) {
                voiceAnalysis.warnings.push('Recording too brief for valid complaint');
                voiceAnalysis.confidence -= 30;
            }

            // Set authenticity based on confidence
            if (voiceAnalysis.confidence < 50) {
                voiceAnalysis.isAuthentic = false;
            }

            return voiceAnalysis;
        } catch (error) {
            console.error('Voice analysis error:', error);
            return {
                isAuthentic: true,
                confidence: 80,
                warnings: ['Could not fully analyze voice recording'],
                error: error.message
            };
        }
    }

    // Detect if audio has silent periods (real recordings have ambient noise)
    static detectSilentPeriods(buffer) {
        // Simplified check - look for variation in the buffer
        let sum = 0;
        let prevValue = 0;
        const sampleSize = Math.min(buffer.length, 10000);
        
        for (let i = 0; i < sampleSize; i++) {
            const value = buffer[i];
            sum += Math.abs(value - prevValue);
            prevValue = value;
        }
        
        const averageVariation = sum / sampleSize;
        return averageVariation > 5; // Threshold for "real" audio
    }

    // ==========================================
    // VALIDATION HELPER
    // ==========================================
    
    static validateContent(analysis, type) {
        const result = {
            isValid: true,
            confidence: analysis.confidence,
            warnings: analysis.warnings,
            message: ''
        };

        if (!analysis.isAuthentic) {
            result.isValid = false;
            result.message = `Suspicious ${type} detected. AI-generated or fake content is not allowed.`;
        } else if (analysis.confidence < 70) {
            result.isValid = false;
            result.message = `${type} authenticity check failed. Please upload original content.`;
        } else if (analysis.warnings.length > 0) {
            result.message = `${type} uploaded with warnings: ${analysis.warnings.join(', ')}`;
        }

        return result;
    }
}

module.exports = ContentAuthenticator;
