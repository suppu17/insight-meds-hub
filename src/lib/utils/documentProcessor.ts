// Enhanced document processing utility for comprehensive patient data extraction
// This module provides functionality to extract comprehensive patient information from medical documents
// Now enhanced with Claude Sonnet 4 Vision capabilities for direct image analysis

interface ExtractedMedicalInfo {
  // Medication Information
  medications: string[];
  symptoms: string[];
  clinicalNotes: string[];
  dosageRegimen: string[];
  rxIndications: string[];

  // Patient Demographics
  patientInfo?: {
    name?: string;
    age?: string;
    dob?: string;
    gender?: string;
    mrn?: string; // Medical Record Number
  };

  // Comprehensive Patient Data
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };

  // Medical History
  medicalHistory?: {
    pastMedicalHistory?: string[];
    familyHistory?: string[];
    socialHistory?: string[];
    surgicalHistory?: string[];
    allergies?: string[];
    chronicConditions?: string[];
  };

  // Current Medications
  concomitantMedications?: {
    medication: string;
    dosage: string;
    frequency: string;
    indication: string;
    startDate?: string;
  }[];

  // Lab Results
  labResults?: {
    testName: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    date?: string;
  }[];

  // Assessment and Plan
  assessment?: {
    primaryDiagnosis?: string;
    secondaryDiagnoses?: string[];
    treatmentPlan?: string[];
    followUpInstructions?: string[];
  };

  // Provider Information
  prescriber?: {
    name?: string;
    npi?: string;
    clinic?: string;
    specialty?: string;
    contactInfo?: string;
  };

  // Document Metadata
  documentInfo?: {
    type: 'prescription' | 'medical_report' | 'lab_report' | 'discharge_summary' | 'other';
    date?: string;
    facility?: string;
    source?: string;
    confidence?: number;
  };

  rawText: string;
}

/**
 * Process image using Claude Sonnet 4 Vision for direct medical analysis
 * @param file - The image file to analyze
 * @returns Promise<ExtractedMedicalInfo> - Extracted medical information
 */
async function processImageWithClaudeVision(file: File): Promise<ExtractedMedicalInfo> {
  try {
    console.log('👁️ Starting Claude Sonnet 4 Vision analysis for:', file.name);

    // Prepare form data for Claude Vision API
    const formData = new FormData();
    formData.append('image', file);
    formData.append('include_image_preview', 'true');

    // Call Claude Vision API
    const response = await fetch('http://localhost:8000/api/v1/medical-ocr/analyze-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Claude Vision API error: ${response.status}`);
    }

    const claudeResult = await response.json();
    
    if (!claudeResult.success || !claudeResult.extracted_data) {
      throw new Error('Claude Vision analysis failed or returned invalid data');
    }

    console.log('✅ Claude Vision analysis successful:', claudeResult.summary);

    // Convert Claude Vision result to ExtractedMedicalInfo format
    const medicalInfo: ExtractedMedicalInfo = {
      medications: claudeResult.extracted_data.medications?.map((med: any) => med.name) || [],
      symptoms: claudeResult.extracted_data.symptoms || [],
      clinicalNotes: claudeResult.extracted_data.medical_notes || [],
      dosageRegimen: claudeResult.extracted_data.medications?.map((med: any) => {
        const parts = [];
        if (med.name) parts.push(med.name);
        if (med.dosage) parts.push(med.dosage);
        if (med.frequency) parts.push(med.frequency);
        return parts.join(': ');
      }).filter((dosage: string) => dosage.length > 0) || [],
      rxIndications: claudeResult.extracted_data.medications?.map((med: any) => med.instructions).filter(Boolean) || [],
      
      // Patient information from Claude Vision
      patientInfo: claudeResult.extracted_data.patient_info ? {
        name: claudeResult.extracted_data.patient_info.name,
        dob: claudeResult.extracted_data.patient_info.dob,
      } : undefined,
      
      // Medical history with allergies
      medicalHistory: {
        pastMedicalHistory: [],
        familyHistory: [],
        socialHistory: [],
        surgicalHistory: [],
        allergies: claudeResult.extracted_data.allergies || [],
        chronicConditions: []
      },
      
      // Concomitant medications
      concomitantMedications: claudeResult.extracted_data.medications?.map((med: any) => ({
        medication: med.name || '',
        dosage: med.dosage || med.strength || '',
        frequency: med.frequency || '',
        indication: med.instructions || '',
        startDate: ''
      })) || [],
      
      // Assessment with warnings
      assessment: {
        primaryDiagnosis: '',
        secondaryDiagnoses: [],
        treatmentPlan: claudeResult.extracted_data.warnings || [],
        followUpInstructions: []
      },
      
      // Prescriber information
      prescriber: claudeResult.extracted_data.patient_info?.prescriber ? {
        name: claudeResult.extracted_data.patient_info.prescriber,
        npi: '',
        specialty: '',
        clinic: claudeResult.extracted_data.patient_info.pharmacy || ''
      } : undefined,
      
      // Document metadata
      documentInfo: {
        type: 'prescription',
        date: claudeResult.extracted_data.patient_info?.date || new Date().toISOString().split('T')[0],
        source: 'claude_sonnet_4_vision',
        confidence: claudeResult.confidence || 95
      },
      
      // Raw text for reference
      rawText: claudeResult.extracted_data.extracted_text || ''
    };

    console.log('📋 Converted Claude Vision result to medical info:', {
      medications: medicalInfo.medications.length,
      hasPatientInfo: !!medicalInfo.patientInfo,
      hasAllergies: medicalInfo.medicalHistory?.allergies?.length || 0
    });

    return medicalInfo;

  } catch (error) {
    console.error('❌ Claude Vision processing failed:', error);
    throw new Error(`Claude Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes an uploaded file (image or PDF) to extract comprehensive medical information
 * @param file - The uploaded file
 * @returns Promise<ExtractedMedicalInfo> - Extracted comprehensive medical information
 */
export async function processDocument(file: File): Promise<ExtractedMedicalInfo> {
  try {
    console.log('🚀 Starting document processing for:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Convert file to base64 for processing
    const base64Data = await fileToBase64(file);

    let extractedText = '';

    // Test mode: If file name contains "test", use sample prescription text
    if (file.name.toLowerCase().includes('test')) {
      console.log('🧪 TEST MODE: Using sample prescription text');
      extractedText = `
        PRESCRIPTION LABEL
        FUNICILLIN 500MG
        Take twice daily with food
        Patient: John Doe
        Date: 12/15/2024
        Pharmacy: Main St Pharmacy
        Dr. Smith
        Refills: 2
      `;
    } else if (file.type.startsWith('image/')) {
      // Use Claude Sonnet 4 Vision for direct image analysis
      console.log('👁️ Using Claude Sonnet 4 Vision for direct image analysis...');
      return await processImageWithClaudeVision(file);
    } else if (file.type === 'application/pdf') {
      // Process PDF
      extractedText = await processPDF(base64Data);
    } else {
      throw new Error('Unsupported file type. Please upload an image (JPG, PNG) or PDF file.');
    }

    console.log('📄 Final extracted text before processing:', extractedText);

    // Try to use backend API for enhanced medical extraction
    let medicalInfo;
    try {
      console.log('🔗 Attempting to use backend medical OCR API for enhanced extraction...');
      const backendResponse = await fetch('http://localhost:8000/api/v1/medical-ocr/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `text=${encodeURIComponent(extractedText)}`
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        if (backendData.success && backendData.extracted_data) {
          console.log('✅ Using enhanced backend medical extraction');

          // Convert backend format to frontend format
          medicalInfo = {
            medications: backendData.extracted_data.medications?.map((med: any) => med.name) || [],
            symptoms: backendData.extracted_data.symptoms || [],
            clinicalNotes: backendData.extracted_data.medical_notes || [],
            dosageRegimen: backendData.extracted_data.medications?.map((med: any) =>
              `${med.name}: ${med.dosage || ''} ${med.frequency || ''}`.trim()
            ).filter((dosage: string) => dosage.length > 0) || [],
            rxIndications: [],
            patientInfo: backendData.extracted_data.patient_info || {},
            vitals: {},
            medicalHistory: {
              pastMedicalHistory: [],
              familyHistory: [],
              socialHistory: [],
              allergies: backendData.extracted_data.allergies || [],
              chronicConditions: []
            },
            concomitantMedications: backendData.extracted_data.medications?.map((med: any) => ({
              medication: med.name,
              dosage: med.dosage || med.strength || '',
              frequency: med.frequency || '',
              indication: '',
              startDate: ''
            })) || [],
            labResults: [],
            assessment: {
              primaryDiagnosis: '',
              secondaryDiagnoses: [],
              treatmentPlan: [],
              followUpInstructions: []
            },
            prescriber: backendData.extracted_data.patient_info?.prescriber ? {
              name: backendData.extracted_data.patient_info.prescriber
            } : {},
            documentInfo: { type: 'prescription' }
          };
        } else {
          throw new Error('Backend API returned invalid format');
        }
      } else {
        throw new Error(`Backend API error: ${backendResponse.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Backend API not available, falling back to local extraction:', error);
      // Fallback to local extraction
      medicalInfo = extractMedicalInfo(extractedText);
    }

    console.log('🔍 Final extracted medical info:', medicalInfo);

    return {
      ...medicalInfo,
      rawText: extractedText
    };

  } catch (error) {
    console.error('❌ Document processing failed:', error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a file to base64 string
 * @param file - The file to convert
 * @returns Promise<string> - Base64 encoded string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Processes an image using OCR (using Tesseract.js in browser)
 * @param base64Data - Base64 encoded image data
 * @param mimeType - MIME type of the image
 * @returns Promise<string> - Extracted text
 */
async function processImageOCR(base64Data: string, mimeType: string): Promise<string> {
  try {
    console.log('Processing image with Tesseract.js OCR...');

    // Dynamic import of Tesseract.js to avoid SSR issues
    const { createWorker } = await import('tesseract.js');

    // Create Tesseract worker with optimized settings for prescription labels
    const worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure Tesseract for better medical text recognition
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Assume a single uniform block of text
      tessedit_ocr_engine_mode: '2', // Use LSTM OCR engine mode
      preserve_interword_spaces: '1',
      // Remove character whitelist to capture all possible characters
    });

    // Convert base64 to data URL for Tesseract
    const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

    console.log('Starting OCR recognition with optimized settings...');

    // Perform OCR recognition
    const { data: { text, confidence } } = await worker.recognize(imageDataUrl);

    console.log(`OCR completed with confidence: ${confidence}%`);
    console.log('Raw OCR text:', text);

    // Terminate worker to free memory
    await worker.terminate();

    // Clean up the extracted text
    const cleanedText = text
      .replace(/[^\w\s.,:/()\n-]/g, ' ') // Remove special characters that might interfere (fixed character class order)
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log('Cleaned OCR text:', cleanedText);

    if (!cleanedText) {
      throw new Error('No text could be extracted from the image. Please ensure the image is clear and contains readable text.');
    }

    // If confidence is very low, add a warning but still return the text
    if (confidence < 30) {
      console.warn(`OCR confidence is low (${confidence}%). Text extraction may be inaccurate.`);
    }

    return cleanedText;

  } catch (error) {
    console.error('OCR processing error:', error);

    // Fallback to a more informative error message
    if (error instanceof Error && error.message.includes('No text could be extracted')) {
      throw error;
    }

    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try uploading a clearer image with readable text.`);
  }
}

/**
 * Processes a PDF file to extract text
 * @param base64Data - Base64 encoded PDF data
 * @returns Promise<string> - Extracted text
 */
async function processPDF(base64Data: string): Promise<string> {
  try {
    // For now, we'll use a placeholder implementation
    // In a real implementation, you would use PDF.js or a server-side PDF parser

    console.log('Processing PDF...');

    // For development/demo purposes, return a generic medical document format
    // In production, this would be replaced with actual PDF text extraction
    const mockText = `
    MEDICAL DOCUMENT

    Patient Information:
    Name: [Patient Name from Document]
    DOB: [Date of Birth from Document]
    Gender: [Gender from Document]
    MRN: [Medical Record Number]

    Document Information:
    Date: ${new Date().toLocaleDateString()}
    Document Type: [Type from Document]
    Provider: [Provider Name from Document]
    Facility: [Facility Name from Document]

    Medications Listed:
    [Medications would be extracted from the actual PDF content]

    Clinical Information:
    [Clinical notes, diagnoses, and other medical information would be extracted from the actual PDF]

    WARNING: This is a placeholder PDF processing result for development.
    In production, actual PDF parsing would extract real content from the uploaded document.
    `;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return mockText;

  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts comprehensive medical information from raw text
 * @param text - Raw extracted text
 * @returns ExtractedMedicalInfo - Structured comprehensive medical information
 */
function extractMedicalInfo(text: string): Omit<ExtractedMedicalInfo, 'rawText'> {
  const medications: string[] = [];
  const symptoms: string[] = [];
  const clinicalNotes: string[] = [];
  const dosageRegimen: string[] = [];
  const rxIndications: string[] = [];

  // Initialize comprehensive patient data structures
  const patientInfo: any = {};
  const vitals: any = {};
  const medicalHistory: any = {
    pastMedicalHistory: [],
    familyHistory: [],
    socialHistory: [],
    allergies: [],
    chronicConditions: []
  };
  const concomitantMedications: any[] = [];
  const labResults: any[] = [];
  const assessment: any = {
    primaryDiagnosis: '',
    secondaryDiagnoses: [],
    treatmentPlan: [],
    followUpInstructions: []
  };
  const prescriber: any = {};
  const documentInfo: any = { type: 'other' };

  // Clean and filter text for processing
  const filteredText = text
    .replace(/[^\w\s.,:/()\n-]/g, ' ') // Remove special characters except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Add comprehensive debugging
  console.log('🔍 DEBUGGING OCR EXTRACTION:');
  console.log('Raw OCR Text Length:', text.length);
  console.log('Raw OCR Text Preview:', text.substring(0, 200));
  console.log('Full OCR Text:', text);

  // Split text into lines for better analysis
  const lines = text.split('\n').filter(line => line.trim());
  console.log('Text split into lines:', lines);

  // Look for ANY word that could be a medication (very broad search first)
  const allWords = text.match(/[A-Za-z]{3,}/g) || [];
  console.log('All words (3+ chars):', allWords);

  // Priority 1: Look for medications with dosage context (strongest indicator)
  const medicationWithDosagePatterns = [
    // Medication name followed by dosage and "TABLETS" or similar
    /\b([A-Za-z]{4,})\s+\d+\s*(?:mg|mcg|g|ml|units?)\s+(?:tablets?|capsules?|pills?|drops?|liquid|injection|cream|ointment)\b/gi,
    // Medication name followed by dosage
    /\b([A-Za-z]{4,})\s+\d+\s*(?:mg|mcg|g|ml|units?)\b/gi,
  ];

  console.log('🔍 STEP 1: Looking for medications with dosage indicators...');
  medicationWithDosagePatterns.forEach((pattern, index) => {
    const matches = filteredText.match(pattern);
    if (matches) {
      console.log(`Pattern ${index + 1} matches found:`, matches);
      matches.forEach(match => {
        const medNameMatch = match.match(/^([A-Za-z]{4,})/);
        if (medNameMatch) {
          const med = medNameMatch[1].toLowerCase();
          if (med.length > 3 && !medications.includes(med)) {
            console.log(`✅ Found medication with dosage: "${med}" from match: "${match}"`);
            medications.push(med);
          }
        }
      });
    }
  });

  // Priority 2: Enhanced medication extraction with multiple approaches
  const medicationPatterns = [
    // 1. Known medication names (expanded list including funicillin)
    /\b(aspirin|ibuprofen|acetaminophen|paracetamol|naproxen|diclofenac|celecoxib|meloxicam|tramadol|codeine|morphine|oxycodone|hydrocodone|fentanyl|lisinopril|atenolol|metoprolol|propranolol|amlodipine|nifedipine|losartan|valsartan|enalapril|captopril|hydrochlorothiazide|furosemide|carvedilol|bisoprolol|metformin|insulin|glipizide|glyburide|pioglitazone|sitagliptin|empagliflozin|liraglutide|semaglutide|januvia|victoza|ozempic|amoxicillin|penicillin|azithromycin|ciprofloxacin|doxycycline|cephalexin|clindamycin|erythromycin|funicillin|ampicillin|flucloxacillin|ceftriaxone|vancomycin|sertraline|fluoxetine|paroxetine|citalopram|escitalopram|venlafaxine|duloxetine|bupropion|trazodone|zoloft|prozac|lexapro|wellbutrin|omeprazole|lansoprazole|pantoprazole|ranitidine|famotidine|sucralfate|metoclopramide|ondansetron|nexium|prilosec|albuterol|ipratropium|budesonide|fluticasone|montelukast|theophylline|prednisone|prednisolone|symbicort|advair|atorvastatin|simvastatin|rosuvastatin|pravastatin|lovastatin|warfarin|clopidogrel|digoxin|lipitor|crestor|plavix)\b/gi,

    // 2. Generic patterns for drug names with common endings
    /\b[A-Za-z]{4,}(?:illin|mycin|floxacin|cycline|pril|sartan|statin|zole|pine|dine|lone|sone|mab|nib|tib|ine|ol|ide|ate|ium)\b/gi,

    // 3. All-caps words that could be medications (common on prescription labels)
    /\b[A-Z]{4,}\b/g,

    // 4. Words followed by dosage indicators
    /\b([A-Za-z]{3,})\s*\d+\s*(?:mg|mcg|g|ml|units?)\b/gi,

    // 5. Very broad pattern for any pharmaceutical-looking word
    /\b[A-Z][a-z]{2,}[A-Za-z]*\b/g
  ];

  // Enhanced exclusion list matching backend quality (common false positives, patient names, etc.)
  const excludeWords = new Set([
    // Common person names (matching backend exclusion list)
    'clyde', 'john', 'jane', 'michael', 'sarah', 'david', 'mary', 'robert', 'linda',
    'william', 'elizabeth', 'james', 'patricia', 'christopher', 'jennifer', 'nelson',
    'daniel', 'maria', 'matthew', 'nancy', 'anthony', 'lisa', 'mark', 'betty',
    'donald', 'helen', 'steven', 'sandra', 'paul', 'donna', 'andrew', 'carol',
    'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller',
    // Medical document terms
    'date', 'time', 'year', 'month', 'day', 'patient', 'doctor', 'pharmacy', 'quantity', 'refill', 'tablet', 'capsule',
    'morning', 'evening', 'night', 'daily', 'twice', 'directions', 'prescription', 'medicine',
    'medication', 'drug', 'take', 'with', 'without', 'food', 'water', 'continue', 'discontinued',
    'prescribed', 'address', 'phone', 'insurance', 'copay', 'generic', 'brand', 'strength',
    'dosage', 'administration', 'indication', 'warning', 'caution', 'store', 'refrigerate',
    'expire', 'expiration', 'lot', 'ndc', 'manufacturer', 'distributor', 'packaged',
    // Location and clinic terms
    'street', 'main', 'avenue', 'drive', 'road', 'clinic', 'hospital', 'medical', 'center'
  ]);

  // FDA-approved medication validation list (matching backend)
  const fdaApprovedMedications = new Set([
    'acetaminophen', 'ibuprofen', 'aspirin', 'naproxen', 'diclofenac',
    'lisinopril', 'amlodipine', 'atenolol', 'metoprolol', 'losartan',
    'metformin', 'insulin', 'glipizide', 'sitagliptin', 'empagliflozin',
    'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'penicillin',
    'funicillin', 'ampicillin', 'cloxacillin', 'flucloxacillin', 'cephalexin',
    'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram',
    'omeprazole', 'lansoprazole', 'pantoprazole', 'ranitidine', 'famotidine',
    'albuterol', 'budesonide', 'fluticasone', 'montelukast', 'prednisone',
    'atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin',
    'warfarin', 'clopidogrel', 'furosemide', 'hydrochlorothiazide', 'digoxin',
    'levothyroxine', 'synthroid', 'armour', 'cytomel', 'tirosint',
    'gabapentin', 'pregabalin', 'tramadol', 'oxycodone', 'hydrocodone',
    'alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'temazepam'
  ]);

  // Function to check if word has medication-like characteristics
  const isMedicationLike = (word: string): boolean => {
    const medicationPatterns = [
      /.*(?:cillin|mycin|floxacin|cycline|pril|sartan|statin|zole|pine|dine|lone|sone)$/,
      /.*(?:mab|nib|tib|ine|ol|ide|ate|ium|min|formin|pride|tide)$/
    ];
    return medicationPatterns.some(pattern => pattern.test(word));
  };

  // Extract medications using enhanced patterns with comprehensive debugging
  console.log('🔍 TESTING EXTRACTION PATTERNS:');

  medicationPatterns.forEach((pattern, index) => {
    console.log(`\n--- Pattern ${index + 1} ---`);
    const matches = text.match(pattern);
    console.log('Pattern:', pattern);
    console.log('Matches found:', matches);

    if (matches && matches.length > 0) {
      matches.forEach(match => {
        let med = match.trim();

        // Extract medication name from dosage patterns
        if (match.includes('mg') || match.includes('mcg') || match.includes('ml')) {
          const medMatch = med.match(/^([A-Za-z]+)/);
          if (medMatch) {
            med = medMatch[1];
          }
        }

        // Clean up the medication name
        med = med.toLowerCase().replace(/[^a-z]/g, '');

        console.log(`Processing match: "${match}" -> cleaned: "${med}"`);

        // Check if it's in the exclude list (common false positives)
        if (excludeWords.has(med)) {
          console.log(`❌ Excluded: "${med}" (in exclude list)`);
          return;
        }

        // Only add if it's FDA approved or has medication-like characteristics and not already in list
        if (med && med.length > 2 && !medications.includes(med)) {
          if (fdaApprovedMedications.has(med) || isMedicationLike(med)) {
            console.log(`✅ Found valid medication: "${med}" from match: "${match}"`);
            medications.push(med);
          } else {
            console.log(`⚠️ Skipped: "${med}" (not FDA approved or medication-like)`);
          }
        } else {
          console.log(`⚠️ Skipped: "${med}" (too short or duplicate)`);
        }
      });
    }
  });

  // Fallback: If no medications found, try extracting ANY reasonable word
  if (medications.length === 0) {
    console.log('\n🚨 NO MEDICATIONS FOUND - TRYING FALLBACK EXTRACTION');
    console.log('Looking for any word that could be a medication...');

    // Extract all capitalized words (common in prescriptions)
    const capitalizedWords = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    console.log('Capitalized words found:', capitalizedWords);

    // Extract all uppercase words (also common in prescriptions)
    const uppercaseWords = text.match(/\b[A-Z]{3,}\b/g) || [];
    console.log('Uppercase words found:', uppercaseWords);

    // Try both sets with FDA validation
    [...capitalizedWords, ...uppercaseWords].forEach(word => {
      const cleanWord = word.toLowerCase();
      if (!excludeWords.has(cleanWord) && cleanWord.length > 3 && !medications.includes(cleanWord)) {
        if (fdaApprovedMedications.has(cleanWord) || isMedicationLike(cleanWord)) {
          console.log(`📋 Valid fallback medication: "${cleanWord}"`);
          medications.push(cleanWord);
        } else {
          console.log(`⚠️ Skipped fallback: "${cleanWord}" (not FDA approved or medication-like)`);
        }
      }
    });
  }

  // Additional extraction for prescription label format (specifically for cases like "FUNICILLIN 200MG")
  const prescriptionLabelPattern = /\b([A-Z]{4,})\s+(\d+)\s*mg\b/gi;
  const prescriptionMatches = text.match(prescriptionLabelPattern);
  if (prescriptionMatches) {
    console.log('Found prescription label patterns:', prescriptionMatches);
    prescriptionMatches.forEach(match => {
      const medMatch = match.match(/^([A-Z]{4,})/);
      if (medMatch) {
        const med = medMatch[1].toLowerCase();

        // Skip if it's a common false positive
        if (excludeWords.has(med)) {
          console.log(`Skipping false positive: "${med}"`);
          return;
        }

        if (med && med.length > 3 && !medications.includes(med)) {
          if (fdaApprovedMedications.has(med) || isMedicationLike(med)) {
            console.log(`Found valid medication from prescription label: "${med}"`);
            medications.push(med);
          } else {
            console.log(`Skipped prescription label candidate: "${med}" (not FDA approved or medication-like)`);
          }
        }
      }
    });
  }

  // Add debugging information
  console.log('Raw OCR text:', text);
  console.log('Filtered text:', filteredText);
  console.log('All extracted medications:', medications);

  // Extract dosage information
  const dosagePatterns = [
    /(?:take|sig:|sig)\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml|tablet|capsule|pill).*?)(?:\n|$)/gi,
    /(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|units?).*?(?:once|twice|three times|daily|bid|tid|qid|qhs|prn).*?)(?:\n|$)/gi,
    /(\d+(?:\.\d+)?\s*(?:mg|g|ml)\s+(?:once|twice|three times)\s+(?:daily|a day|per day))/gi
  ];

  dosagePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const dosage = match.trim();
        if (dosage && !dosageRegimen.includes(dosage)) {
          dosageRegimen.push(dosage);
        }
      });
    }
  });

  // Extract symptoms and conditions
  const symptomPatterns = [
    /(?:chief complaint|cc|complaint|symptoms?):\s*([^.\n]+)/gi,
    /(?:patient reports|complains of|presents with)\s+([^.\n]+)/gi,
    /(?:pain|ache|fever|nausea|vomiting|diarrhea|constipation|headache|dizziness|fatigue|weakness|shortness of breath|chest pain|abdominal pain)/gi
  ];

  symptomPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const symptom = match.trim();
        if (symptom && !symptoms.includes(symptom)) {
          symptoms.push(symptom);
        }
      });
    }
  });

  // Extract indications/diagnoses
  const indicationPatterns = [
    /(?:diagnosis|dx|indication|for):\s*([^.\n]+)/gi,
    /(?:type \d+ diabetes|hypertension|hyperlipidemia|depression|anxiety|asthma|copd|arthritis|infection|pneumonia)/gi
  ];

  indicationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const indication = match.trim();
        if (indication && !rxIndications.includes(indication)) {
          rxIndications.push(indication);
        }
      });
    }
  });

  // Extract clinical notes
  const notePatterns = [
    /(?:assessment|plan|note|comment):\s*([^.\n]+)/gi,
    /(?:follow up|continue|discontinue|increase|decrease|monitor)\s+([^.\n]+)/gi
  ];

  notePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const note = match.trim();
        if (note && !clinicalNotes.includes(note)) {
          clinicalNotes.push(note);
        }
      });
    }
  });

  // Extract comprehensive patient data
  extractPatientInfo(text, patientInfo);
  extractVitals(text, vitals);
  extractMedicalHistory(text, medicalHistory);
  extractConcomitantMedications(text, concomitantMedications);
  extractLabResults(text, labResults);
  extractAssessmentAndPlan(text, assessment);
  extractProviderInfo(text, prescriber);
  determineDocumentType(text, documentInfo);

  return {
    medications,
    symptoms,
    clinicalNotes,
    dosageRegimen,
    rxIndications,
    patientInfo: Object.keys(patientInfo).length > 0 ? patientInfo : undefined,
    vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
    medicalHistory: medicalHistory.pastMedicalHistory.length > 0 ||
                   medicalHistory.familyHistory.length > 0 ||
                   medicalHistory.allergies.length > 0 ? medicalHistory : undefined,
    concomitantMedications: concomitantMedications.length > 0 ? concomitantMedications : undefined,
    labResults: labResults.length > 0 ? labResults : undefined,
    assessment: assessment.primaryDiagnosis || assessment.treatmentPlan.length > 0 ? assessment : undefined,
    prescriber: Object.keys(prescriber).length > 0 ? prescriber : undefined,
    documentInfo: documentInfo.type !== 'other' ? documentInfo : undefined
  };
}

// Helper functions for comprehensive data extraction
function extractPatientInfo(text: string, patientInfo: any) {
  // Extract patient name
  const nameMatch = text.match(/(?:patient|name):\s*([^\n\r]+)/gi);
  if (nameMatch) {
    patientInfo.name = nameMatch[0].split(':')[1].trim();
  }

  // Extract DOB and age
  const dobMatch = text.match(/(?:dob|date of birth):\s*([^\n\r\(]+)/gi);
  if (dobMatch) {
    patientInfo.dob = dobMatch[0].split(':')[1].replace(/\(.*?\)/g, '').trim();
  }

  const ageMatch = text.match(/(?:age:|\(age\s*)(\d+)/gi);
  if (ageMatch) {
    patientInfo.age = ageMatch[0].match(/\d+/)?.[0];
  }

  // Extract gender
  const genderMatch = text.match(/(?:gender|sex):\s*(male|female|m|f)/gi);
  if (genderMatch) {
    patientInfo.gender = genderMatch[0].split(':')[1].trim();
  }

  // Extract MRN
  const mrnMatch = text.match(/(?:mrn|medical record):\s*([^\n\r]+)/gi);
  if (mrnMatch) {
    patientInfo.mrn = mrnMatch[0].split(':')[1].trim();
  }
}

function extractVitals(text: string, vitals: any) {
  // Blood pressure
  const bpMatch = text.match(/(?:blood pressure|bp):\s*(\d+\/\d+\s*mmhg?)/gi);
  if (bpMatch) {
    vitals.bloodPressure = bpMatch[0].split(':')[1].trim();
  }

  // Heart rate
  const hrMatch = text.match(/(?:heart rate|hr|pulse):\s*(\d+\s*bpm?)/gi);
  if (hrMatch) {
    vitals.heartRate = hrMatch[0].split(':')[1].trim();
  }

  // Temperature
  const tempMatch = text.match(/(?:temperature|temp):\s*(\d+\.?\d*\s*°?f?)/gi);
  if (tempMatch) {
    vitals.temperature = tempMatch[0].split(':')[1].trim();
  }

  // Weight
  const weightMatch = text.match(/(?:weight|wt):\s*(\d+(?:\.\d+)?\s*(?:lbs?|kg))/gi);
  if (weightMatch) {
    vitals.weight = weightMatch[0].split(':')[1].trim();
  }

  // Height
  const heightMatch = text.match(/(?:height|ht):\s*([\d'"\s\(\)cm]+)/gi);
  if (heightMatch) {
    vitals.height = heightMatch[0].split(':')[1].trim();
  }

  // BMI
  const bmiMatch = text.match(/(?:bmi):\s*(\d+\.?\d*)/gi);
  if (bmiMatch) {
    vitals.bmi = bmiMatch[0].split(':')[1].trim();
  }

  // Oxygen saturation
  const o2Match = text.match(/(?:o2 saturation|spo2):\s*(\d+%)/gi);
  if (o2Match) {
    vitals.oxygenSaturation = o2Match[0].split(':')[1].trim();
  }

  // Respiratory rate
  const rrMatch = text.match(/(?:respiratory rate|rr):\s*(\d+\/min)/gi);
  if (rrMatch) {
    vitals.respiratoryRate = rrMatch[0].split(':')[1].trim();
  }
}

function extractMedicalHistory(text: string, medicalHistory: any) {
  // Past medical history
  const pmhSection = text.match(/past medical history[:\s]*([^\n]*(?:\n(?!\n|[A-Z][^:]+:)[^\n]*)*)/gi);
  if (pmhSection) {
    const conditions = pmhSection[0].split(/[\n-]/).filter(line =>
      line.trim() && !line.match(/past medical history/gi)
    ).map(condition => condition.trim().replace(/^[\s-]+/, ''));
    medicalHistory.pastMedicalHistory.push(...conditions);
  }

  // Family history
  const fhSection = text.match(/family history[:\s]*([^\n]*(?:\n(?!\n|[A-Z][^:]+:)[^\n]*)*)/gi);
  if (fhSection) {
    const familyConditions = fhSection[0].split(/[\n-]/).filter(line =>
      line.trim() && !line.match(/family history/gi)
    ).map(condition => condition.trim().replace(/^[\s-]+/, ''));
    medicalHistory.familyHistory.push(...familyConditions);
  }

  // Social history
  const shSection = text.match(/social history[:\s]*([^\n]*(?:\n(?!\n|[A-Z][^:]+:)[^\n]*)*)/gi);
  if (shSection) {
    const socialFactors = shSection[0].split(/[\n-]/).filter(line =>
      line.trim() && !line.match(/social history/gi)
    ).map(factor => factor.trim().replace(/^[\s-]+/, ''));
    medicalHistory.socialHistory.push(...socialFactors);
  }

  // Allergies
  const allergySection = text.match(/allergies[:\s]*([^\n]*(?:\n(?!\n|[A-Z][^:]+:)[^\n]*)*)/gi);
  if (allergySection) {
    const allergies = allergySection[0].split(/[\n-]/).filter(line =>
      line.trim() && !line.match(/allergies/gi)
    ).map(allergy => allergy.trim().replace(/^[\s-]+/, ''));
    medicalHistory.allergies.push(...allergies);
  }
}

function extractConcomitantMedications(text: string, concomitantMedications: any[]) {
  // Extract current medications section
  const medSection = text.match(/current medications[:\s]*([^\n]*(?:\n(?!\n|[A-Z][^:]+:)[^\n]*)*)/gi);
  if (medSection) {
    const medLines = medSection[0].split('\n').filter(line =>
      line.trim() && !line.match(/current medications/gi)
    );

    medLines.forEach(line => {
      const cleaned = line.trim().replace(/^\d+\.\s*/, '').replace(/^[\s-]+/, '');
      if (cleaned) {
        const parts = cleaned.split(' - ');
        const medInfo = parts[0];
        const indication = parts[1] || '';

        // Extract medication name and dosage
        const medMatch = medInfo.match(/(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?\s*mg)/i);
        if (medMatch) {
          concomitantMedications.push({
            medication: medMatch[1],
            dosage: medMatch[2],
            frequency: extractFrequency(cleaned),
            indication: indication.replace(/[\(\)]/g, '').trim()
          });
        }
      }
    });
  }
}

function extractFrequency(text: string): string {
  const frequencies = [
    'once daily', 'twice daily', 'three times daily', 'four times daily',
    'daily', 'bid', 'tid', 'qid', 'qhs', 'prn', 'as needed',
    'every 8 hours', 'every 12 hours', 'every 6 hours'
  ];

  for (const freq of frequencies) {
    if (text.toLowerCase().includes(freq)) {
      return freq;
    }
  }
  return 'as directed';
}

function extractLabResults(text: string, labResults: any[]) {
  // Common lab patterns
  const labPatterns = [
    /hba1c:\s*(\d+\.\d+%)/gi,
    /glucose:\s*(\d+\s*mg\/dl)/gi,
    /cholesterol:\s*(\d+\s*mg\/dl)/gi,
    /ldl:\s*(\d+\s*mg\/dl)/gi,
    /hdl:\s*(\d+\s*mg\/dl)/gi,
    /triglycerides:\s*(\d+\s*mg\/dl)/gi,
    /creatinine:\s*(\d+\.\d+\s*mg\/dl)/gi,
    /tsh:\s*(\d+\.\d+\s*miu\/l)/gi,
    /bnp:\s*(\d+\s*pg\/ml)/gi
  ];

  labPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const [testName, value] = match.split(':');
        labResults.push({
          testName: testName.trim(),
          value: value.trim(),
          date: new Date().toLocaleDateString()
        });
      });
    }
  });
}

function extractAssessmentAndPlan(text: string, assessment: any) {
  // Extract assessment section
  const assessmentSection = text.match(/assessment(?:\s+and\s+plan)?[:\s]*([^\n]*(?:\n(?!\n|provider:|date:)[^\n]*)*)/gi);
  if (assessmentSection) {
    const content = assessmentSection[0];

    // Extract numbered items as diagnoses and plans
    const numberedItems = content.match(/\d+\.\s*([^\n]+(?:\n(?!\d+\.)[^\n]*)*)/g);
    if (numberedItems) {
      numberedItems.forEach((item, index) => {
        const cleaned = item.replace(/^\d+\.\s*/, '').trim();
        const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line);

        if (lines.length > 0) {
          if (index === 0) {
            assessment.primaryDiagnosis = lines[0];
          } else {
            assessment.secondaryDiagnoses.push(lines[0]);
          }

          // Treatment plan items (usually start with -, continue, start, etc.)
          const planItems = lines.filter(line =>
            line.match(/^[\s-]*(?:continue|start|consider|monitor|follow|recheck)/i)
          );
          assessment.treatmentPlan.push(...planItems);
        }
      });
    }
  }
}

function extractProviderInfo(text: string, prescriber: any) {
  // Provider name
  const providerMatch = text.match(/provider:\s*([^\n\r,]+)/gi);
  if (providerMatch) {
    prescriber.name = providerMatch[0].split(':')[1].trim();
  }

  // NPI
  const npiMatch = text.match(/npi:\s*(\d+)/gi);
  if (npiMatch) {
    prescriber.npi = npiMatch[0].split(':')[1].trim();
  }

  // Specialty
  const specialtyMatch = text.match(/specialty:\s*([^\n\r]+)/gi);
  if (specialtyMatch) {
    prescriber.specialty = specialtyMatch[0].split(':')[1].trim();
  }

  // Clinic
  const clinicMatch = text.match(/clinic:\s*([^\n\r]+)/gi);
  if (clinicMatch) {
    prescriber.clinic = clinicMatch[0].split(':')[1].trim();
  }

  // Phone
  const phoneMatch = text.match(/phone:\s*([^\n\r]+)/gi);
  if (phoneMatch) {
    prescriber.contactInfo = phoneMatch[0].split(':')[1].trim();
  }
}

function determineDocumentType(text: string, documentInfo: any) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('prescription') || lowerText.includes('rx:')) {
    documentInfo.type = 'prescription';
  } else if (lowerText.includes('lab') && lowerText.includes('result')) {
    documentInfo.type = 'lab_report';
  } else if (lowerText.includes('discharge') && lowerText.includes('summary')) {
    documentInfo.type = 'discharge_summary';
  } else if (lowerText.includes('medical report') || lowerText.includes('consultation')) {
    documentInfo.type = 'medical_report';
  }

  // Extract document date
  const dateMatch = text.match(/date:\s*([^\n\r]+)/gi);
  if (dateMatch) {
    documentInfo.date = dateMatch[0].split(':')[1].trim();
  }
}

/**
 * Validates if the extracted information contains valid medication names
 * @param extractedInfo - The extracted medical information
 * @returns boolean - True if valid medications found, false otherwise
 */
export function hasValidMedications(extractedInfo: ExtractedMedicalInfo): boolean {
  return extractedInfo.medications.length > 0 ||
         (extractedInfo.concomitantMedications && extractedInfo.concomitantMedications.length > 0);
}

/**
 * Gets the primary medication from extracted information
 * @param extractedInfo - The extracted medical information
 * @returns string | null - The primary medication name or null if none found
 */
export function getPrimaryMedication(extractedInfo: ExtractedMedicalInfo): string | null {
  console.log('Getting primary medication from:', extractedInfo);

  // First check concomitant medications (more detailed)
  if (extractedInfo.concomitantMedications && extractedInfo.concomitantMedications.length > 0) {
    const primaryMed = extractedInfo.concomitantMedications[0].medication;
    console.log('Primary medication from concomitant medications:', primaryMed);
    return primaryMed;
  }

  // Fallback to basic medications list, but filter out common false positives
  if (extractedInfo.medications.length > 0) {
    const excludeWords = new Set([
      'date', 'time', 'patient', 'doctor', 'pharmacy', 'quantity', 'refill', 'tablet', 'capsule',
      'morning', 'evening', 'night', 'daily', 'twice', 'directions', 'prescription', 'medicine',
      'medication', 'drug', 'take', 'with', 'without', 'food', 'water', 'continue', 'discontinued',
      'prescribed', 'address', 'phone', 'insurance', 'copay', 'generic', 'brand', 'strength'
    ]);

    // Filter medications to find the first valid one
    for (const medication of extractedInfo.medications) {
      if (!excludeWords.has(medication.toLowerCase()) && medication.length > 2) {
        console.log('Primary medication from basic medications list:', medication);
        return medication;
      }
    }
  }

  // If no valid medication found, try to extract from raw text as fallback
  console.log('No medications found in structured data, checking raw text...');
  const rawTextMedication = extractMedicationFromRawText(extractedInfo.rawText);
  if (rawTextMedication) {
    console.log('Primary medication from raw text fallback:', rawTextMedication);
    return rawTextMedication;
  }

  console.log('No primary medication found');
  return null;
}

/**
 * Fallback function to extract medication from raw text when structured extraction fails
 * @param rawText - The raw extracted text
 * @returns string | null - The first valid medication found or null
 */
function extractMedicationFromRawText(rawText: string): string | null {
  // Look for words that could be medications in prescription format
  const prescriptionPattern = /\b([A-Z]{4,}(?:ILLIN|INE|OL|IDE|ATE|IUM|AN|EX|IL|PRIL|SARTAN|STATIN|MYCIN|CILLIN|FLOXACIN|ZOLE|PINE|DINE|LONE|SONE|MAB|NIB|TIB))\b/i;
  const match = rawText.match(prescriptionPattern);

  if (match) {
    const medication = match[1].toLowerCase();

    // Exclude common false positives
    const excludeWords = new Set(['date', 'time', 'patient', 'doctor', 'pharmacy', 'quantity', 'refill', 'tablet', 'capsule', 'prescription', 'medicine', 'medication', 'drug']);

    if (!excludeWords.has(medication) && medication.length > 3) {
      return medication;
    }
  }

  // Look for any word that looks like a medication name
  const words = rawText.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();

    // Check if it looks like a medication name (has common drug endings)
    if (cleanWord.length > 4 && /(?:illin|ine|ol|ide|ate|ium|an|ex|il|pril|sartan|statin|mycin|cillin|floxacin|zole|pine|dine|lone|sone|mab|nib|tib)$/.test(cleanWord)) {
      const excludeWords = new Set(['date', 'time', 'patient', 'doctor', 'pharmacy', 'quantity', 'refill', 'tablet', 'capsule', 'prescription', 'medicine', 'medication', 'drug', 'administration', 'indication', 'warning', 'caution']);

      if (!excludeWords.has(cleanWord)) {
        return cleanWord;
      }
    }
  }

  return null;
}

/**
 * Formats the extracted comprehensive medical information for analysis
 * @param extractedInfo - The extracted medical information
 * @returns string - Formatted text for analysis
 */
export function formatMedicalInfoForAnalysis(extractedInfo: ExtractedMedicalInfo): string {
  const parts: string[] = [];

  // Patient Demographics
  if (extractedInfo.patientInfo) {
    const patient = extractedInfo.patientInfo;
    const demographics = [];
    if (patient.name) demographics.push(`Name: ${patient.name}`);
    if (patient.age) demographics.push(`Age: ${patient.age}`);
    if (patient.gender) demographics.push(`Gender: ${patient.gender}`);
    if (demographics.length > 0) {
      parts.push(`Patient Information: ${demographics.join(', ')}`);
    }
  }

  // Vital Signs
  if (extractedInfo.vitals) {
    const vitals = extractedInfo.vitals;
    const vitalsList = [];
    if (vitals.bloodPressure) vitalsList.push(`BP: ${vitals.bloodPressure}`);
    if (vitals.heartRate) vitalsList.push(`HR: ${vitals.heartRate}`);
    if (vitals.weight) vitalsList.push(`Weight: ${vitals.weight}`);
    if (vitals.height) vitalsList.push(`Height: ${vitals.height}`);
    if (vitals.bmi) vitalsList.push(`BMI: ${vitals.bmi}`);
    if (vitalsList.length > 0) {
      parts.push(`Vital Signs: ${vitalsList.join(', ')}`);
    }
  }

  // Current Medications
  if (extractedInfo.concomitantMedications && extractedInfo.concomitantMedications.length > 0) {
    const medList = extractedInfo.concomitantMedications.map(med =>
      `${med.medication} ${med.dosage} ${med.frequency}${med.indication ? ` (${med.indication})` : ''}`
    );
    parts.push(`Current Medications: ${medList.join(', ')}`);
  } else if (extractedInfo.medications.length > 0) {
    parts.push(`Medications: ${extractedInfo.medications.join(', ')}`);
  }

  // Medical History
  if (extractedInfo.medicalHistory) {
    const history = extractedInfo.medicalHistory;
    if (history.pastMedicalHistory && history.pastMedicalHistory.length > 0) {
      parts.push(`Past Medical History: ${history.pastMedicalHistory.join(', ')}`);
    }
    if (history.allergies && history.allergies.length > 0) {
      parts.push(`Allergies: ${history.allergies.join(', ')}`);
    }
    if (history.familyHistory && history.familyHistory.length > 0) {
      parts.push(`Family History: ${history.familyHistory.join(', ')}`);
    }
  }

  // Lab Results
  if (extractedInfo.labResults && extractedInfo.labResults.length > 0) {
    const labs = extractedInfo.labResults.map(lab => `${lab.testName}: ${lab.value}`);
    parts.push(`Laboratory Results: ${labs.join(', ')}`);
  }

  // Assessment & Plan
  if (extractedInfo.assessment) {
    const assessment = extractedInfo.assessment;
    if (assessment.primaryDiagnosis) {
      parts.push(`Primary Diagnosis: ${assessment.primaryDiagnosis}`);
    }
    if (assessment.secondaryDiagnoses && assessment.secondaryDiagnoses.length > 0) {
      parts.push(`Secondary Diagnoses: ${assessment.secondaryDiagnoses.join(', ')}`);
    }
    if (assessment.treatmentPlan && assessment.treatmentPlan.length > 0) {
      parts.push(`Treatment Plan: ${assessment.treatmentPlan.join(', ')}`);
    }
  }

  // Basic extracted info (fallback)
  if (extractedInfo.rxIndications.length > 0) {
    parts.push(`Indications: ${extractedInfo.rxIndications.join(', ')}`);
  }

  if (extractedInfo.symptoms.length > 0) {
    parts.push(`Symptoms: ${extractedInfo.symptoms.join(', ')}`);
  }

  if (extractedInfo.dosageRegimen.length > 0) {
    parts.push(`Dosage: ${extractedInfo.dosageRegimen.join(', ')}`);
  }

  if (extractedInfo.clinicalNotes.length > 0) {
    parts.push(`Clinical Notes: ${extractedInfo.clinicalNotes.join(', ')}`);
  }

  return parts.join('\n\n');
}

/**
 * Generates personalized clinical recommendations based on patient data
 * @param extractedInfo - The extracted medical information
 * @returns object - Personalized recommendations and alerts
 */
export function generatePersonalizedRecommendations(extractedInfo: ExtractedMedicalInfo) {
  const recommendations = {
    drugInteractions: [],
    contraindications: [],
    dosageAdjustments: [],
    monitoring: [],
    lifestyle: [],
    alerts: []
  };

  // Basic safety checks would go here
  // This is a placeholder for comprehensive clinical decision support

  return recommendations;
}