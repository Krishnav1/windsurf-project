/**
 * OCR Service for Document Extraction
 * Extracts data from Aadhaar, PAN, and other documents
 */

export interface AadhaarData {
  aadhaarNumber: string;
  name: string;
  address: string;
  dob: string;
  gender: string;
  confidence: number;
}

export interface PANData {
  panNumber: string;
  name: string;
  fatherName: string;
  dob: string;
  confidence: number;
}

export interface OCRValidationResult {
  isValid: boolean;
  mismatches: string[];
  confidence: number;
  suggestions: string[];
}

export class OCRService {
  
  /**
   * Extract data from Aadhaar card (Client-side using Tesseract.js)
   * This is a placeholder - actual OCR happens client-side
   */
  static async extractAadhaarData(imageUrl: string): Promise<AadhaarData> {
    // This would be called from client-side with Tesseract.js
    // Server-side placeholder
    return {
      aadhaarNumber: '',
      name: '',
      address: '',
      dob: '',
      gender: '',
      confidence: 0
    };
  }
  
  /**
   * Extract data from PAN card
   */
  static async extractPANData(imageUrl: string): Promise<PANData> {
    return {
      panNumber: '',
      name: '',
      fatherName: '',
      dob: '',
      confidence: 0
    };
  }
  
  /**
   * Validate extracted data against user input
   */
  static validateExtractedData(
    extracted: Partial<AadhaarData | PANData>,
    userInput: any
  ): OCRValidationResult {
    
    const mismatches: string[] = [];
    const suggestions: string[] = [];
    
    // Validate name
    if (extracted.name && userInput.name) {
      const similarity = this.calculateStringSimilarity(
        extracted.name.toLowerCase().trim(),
        userInput.name.toLowerCase().trim()
      );
      
      if (similarity < 0.8) {
        mismatches.push(`Name mismatch: OCR="${extracted.name}" vs Input="${userInput.name}"`);
        suggestions.push('Verify name spelling matches document exactly');
      }
    }
    
    // Validate DOB
    if (extracted.dob && userInput.dob) {
      const extractedDate = this.normalizeDate(extracted.dob);
      const inputDate = this.normalizeDate(userInput.dob);
      
      if (extractedDate !== inputDate) {
        mismatches.push(`DOB mismatch: OCR="${extracted.dob}" vs Input="${userInput.dob}"`);
        suggestions.push('Check date format (DD/MM/YYYY)');
      }
    }
    
    // Validate Aadhaar number
    if ('aadhaarNumber' in extracted && extracted.aadhaarNumber && userInput.aadhaarNumber) {
      const cleanExtracted = extracted.aadhaarNumber.replace(/\s/g, '');
      const cleanInput = userInput.aadhaarNumber.replace(/\s/g, '');
      
      if (cleanExtracted !== cleanInput) {
        mismatches.push('Aadhaar number does not match');
        suggestions.push('Ensure all 12 digits are entered correctly');
      }
    }
    
    // Validate PAN number
    if ('panNumber' in extracted && extracted.panNumber && userInput.panNumber) {
      if (extracted.panNumber.toUpperCase() !== userInput.panNumber.toUpperCase()) {
        mismatches.push('PAN number does not match');
        suggestions.push('PAN format: ABCDE1234F');
      }
    }
    
    const confidence = extracted.confidence || 0;
    
    return {
      isValid: mismatches.length === 0 && confidence > 70,
      mismatches,
      confidence,
      suggestions
    };
  }
  
  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  /**
   * Levenshtein distance algorithm
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Normalize date format
   */
  private static normalizeDate(dateStr: string): string {
    // Try to parse various date formats
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/,    // DD-MM-YYYY
      /(\d{4})-(\d{2})-(\d{2})/     // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (match[1].length === 4) {
          // YYYY-MM-DD format
          return `${match[3]}/${match[2]}/${match[1]}`;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return `${match[1]}/${match[2]}/${match[3]}`;
        }
      }
    }
    
    return dateStr;
  }
  
  /**
   * Extract text patterns (Aadhaar, PAN, etc.)
   */
  static extractPatterns(text: string): {
    aadhaarNumbers: string[];
    panNumbers: string[];
    dates: string[];
  } {
    
    // Aadhaar: 12 digits (with or without spaces)
    const aadhaarPattern = /\d{4}\s?\d{4}\s?\d{4}/g;
    const aadhaarNumbers = (text.match(aadhaarPattern) || [])
      .map(num => num.replace(/\s/g, ''));
    
    // PAN: 5 letters, 4 digits, 1 letter
    const panPattern = /[A-Z]{5}\d{4}[A-Z]/g;
    const panNumbers = text.match(panPattern) || [];
    
    // Dates: DD/MM/YYYY or DD-MM-YYYY
    const datePattern = /\d{2}[\/\-]\d{2}[\/\-]\d{4}/g;
    const dates = text.match(datePattern) || [];
    
    return {
      aadhaarNumbers,
      panNumbers,
      dates
    };
  }
}

export default OCRService;
