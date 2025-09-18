// Enhanced document processing utility for comprehensive patient data extraction
// This module provides functionality to extract comprehensive patient information from medical documents

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
  };

  rawText: string;
}

/**
 * Processes an uploaded file (image or PDF) to extract comprehensive medical information
 * @param file - The uploaded file
 * @returns Promise<ExtractedMedicalInfo> - Extracted comprehensive medical information
 */
export async function processDocument(file: File): Promise<ExtractedMedicalInfo> {
  try {
    // Convert file to base64 for processing
    const base64Data = await fileToBase64(file);

    let extractedText = '';

    if (file.type.startsWith('image/')) {
      // Process image using OCR
      extractedText = await processImageOCR(base64Data, file.type);
    } else if (file.type === 'application/pdf') {
      // Process PDF
      extractedText = await processPDF(base64Data);
    } else {
      throw new Error('Unsupported file type. Please upload an image (JPG, PNG) or PDF file.');
    }

    // Extract comprehensive medical information from the text
    const medicalInfo = extractMedicalInfo(extractedText);

    return {
      ...medicalInfo,
      rawText: extractedText
    };

  } catch (error) {
    console.error('Document processing failed:', error);
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
    // For now, we'll use a placeholder implementation
    // In a real implementation, you would use Tesseract.js or a cloud OCR service

    // Simulate OCR processing
    console.log('Processing image with OCR...');

    // Mock extracted text for comprehensive medical document
    // In production, this would be replaced with actual OCR
    const mockText = `
    COMPREHENSIVE MEDICAL REPORT

    Patient Information:
    Name: John Doe
    DOB: 01/15/1980 (Age: 44)
    Gender: Male
    MRN: 123456789
    Weight: 185 lbs (84 kg)
    Height: 5'10" (178 cm)
    BMI: 26.5

    Vital Signs (${new Date().toLocaleDateString()}):
    Blood Pressure: 142/90 mmHg
    Heart Rate: 78 bpm
    Temperature: 98.6°F
    Respiratory Rate: 16/min
    O2 Saturation: 98%

    Current Medications:
    1. Metformin 500mg - Take 1 tablet twice daily with meals (for diabetes)
    2. Lisinopril 10mg - Take 1 tablet once daily (for hypertension)
    3. Atorvastatin 20mg - Take 1 tablet at bedtime (for hyperlipidemia)
    4. Aspirin 81mg - Take 1 tablet daily (for cardioprotection)

    Allergies:
    - Penicillin (rash)
    - Shellfish (anaphylaxis)

    Medical History:
    Past Medical History:
    - Type 2 Diabetes Mellitus (diagnosed 2015)
    - Hypertension (diagnosed 2018)
    - Hyperlipidemia (diagnosed 2020)
    - Obesity

    Family History:
    - Father: Myocardial infarction at age 65
    - Mother: Type 2 diabetes, hypertension
    - Brother: No significant medical history

    Social History:
    - Non-smoker (quit 5 years ago, 10 pack-year history)
    - Occasional alcohol use (2-3 drinks/week)
    - Sedentary lifestyle
    - Works as an office manager

    Recent Lab Results (${new Date().toLocaleDateString()}):
    - HbA1c: 7.2% (target <7.0%)
    - Fasting Glucose: 145 mg/dL (70-100 mg/dL)
    - Total Cholesterol: 220 mg/dL (<200 mg/dL)
    - LDL: 145 mg/dL (<100 mg/dL)
    - HDL: 42 mg/dL (>40 mg/dL)
    - Triglycerides: 180 mg/dL (<150 mg/dL)
    - Creatinine: 1.1 mg/dL (0.7-1.3 mg/dL)
    - eGFR: >60 mL/min/1.73m²

    Assessment and Plan:
    1. Type 2 Diabetes - suboptimal control
       - Continue Metformin 500mg BID
       - Consider adding SGLT2 inhibitor
       - Dietary counseling
       - Follow up in 3 months

    2. Hypertension - Stage 1
       - Continue Lisinopril 10mg daily
       - Monitor BP at home
       - Lifestyle modifications

    3. Hyperlipidemia
       - Continue Atorvastatin 20mg
       - Recheck lipids in 3 months

    Provider: Dr. Sarah Johnson, MD
    Specialty: Internal Medicine
    NPI: 1234567890
    Clinic: Primary Care Associates
    Phone: (555) 123-4567
    `;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return mockText;

  } catch (error) {
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Mock extracted text for comprehensive patient PDF
    const mockText = `
    CARDIOLOGY CONSULTATION REPORT

    Patient Information:
    Name: Jane Smith
    DOB: 03/22/1975 (Age: 49)
    Gender: Female
    MRN: 987654321
    Weight: 165 lbs (75 kg)
    Height: 5'6" (168 cm)
    BMI: 26.6

    Vital Signs:
    Blood Pressure: 138/88 mmHg
    Heart Rate: 82 bpm (regular)
    Temperature: 98.4°F
    Respiratory Rate: 18/min
    O2 Saturation: 97% on room air

    Chief Complaint:
    Chest pain and shortness of breath on exertion

    Current Medications:
    1. Atorvastatin 20mg - once daily at bedtime (hyperlipidemia)
    2. Amlodipine 5mg - once daily (hypertension)
    3. Metformin 1000mg - twice daily with meals (diabetes)
    4. Levothyroxine 75mcg - once daily on empty stomach (hypothyroidism)
    5. Multivitamin - once daily

    Allergies:
    - Sulfa drugs (Stevens-Johnson syndrome)
    - Latex (contact dermatitis)

    Past Medical History:
    - Type 2 Diabetes Mellitus (2010)
    - Hypertension (2012)
    - Hyperlipidemia (2014)
    - Hypothyroidism (2016)
    - Osteoarthritis (2020)

    Family History:
    - Mother: Coronary artery disease, diabetes
    - Father: Stroke at age 72
    - Sister: Breast cancer

    Social History:
    - Never smoker
    - Social drinker (1 glass wine with dinner)
    - Regular exercise (walking 30 min, 3x/week)
    - Married, works as a teacher

    Recent Laboratory Results:
    - HbA1c: 6.8% (good control)
    - Fasting Glucose: 128 mg/dL
    - Total Cholesterol: 185 mg/dL
    - LDL: 105 mg/dL
    - HDL: 58 mg/dL
    - Triglycerides: 110 mg/dL
    - TSH: 2.1 mIU/L (normal)
    - BNP: 45 pg/mL (normal)
    - Troponin I: <0.01 ng/mL (normal)

    Assessment and Plan:
    1. Chest pain - likely angina, rule out CAD
       - Start Nitroglycerin 0.4mg SL PRN chest pain
       - Schedule stress test
       - Consider cardiology consultation

    2. Hypertension - well controlled
       - Continue Amlodipine 5mg daily
       - Home BP monitoring

    3. Type 2 Diabetes - good control
       - Continue Metformin 1000mg BID
       - Continue lifestyle modifications

    4. Hyperlipidemia - at goal
       - Continue Atorvastatin 20mg
       - Recheck in 6 months

    Provider: Dr. Michael Johnson, MD, FACC
    Specialty: Cardiology
    Date: ${new Date().toLocaleDateString()}
    Next Appointment: Follow up in 2 weeks
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

  // Extract basic medication patterns (legacy support)
  const medicationPatterns = [
    /(?:^|\s)(aspirin|ibuprofen|acetaminophen|paracetamol|naproxen|diclofenac|celecoxib|meloxicam|tramadol|codeine|morphine)\b/gi,
    /(?:^|\s)(lisinopril|atenolol|metoprolol|propranolol|amlodipine|nifedipine|losartan|valsartan|enalapril|captopril|hydrochlorothiazide|furosemide)\b/gi,
    /(?:^|\s)(metformin|insulin|glipizide|glyburide|pioglitazone|sitagliptin|empagliflozin|liraglutide|semaglutide)\b/gi,
    /(?:^|\s)(amoxicillin|penicillin|azithromycin|ciprofloxacin|doxycycline|cephalexin|clindamycin|erythromycin)\b/gi,
    /(?:^|\s)(sertraline|fluoxetine|paroxetine|citalopram|escitalopram|venlafaxine|duloxetine|bupropion|trazodone)\b/gi,
    /(?:^|\s)(omeprazole|lansoprazole|pantoprazole|ranitidine|famotidine|sucralfate|metoclopramide|ondansetron)\b/gi,
    /(?:^|\s)(albuterol|ipratropium|budesonide|fluticasone|montelukast|theophylline|prednisone|prednisolone)\b/gi,
    /(?:^|\s)(atorvastatin|simvastatin|rosuvastatin|pravastatin|lovastatin|warfarin|clopidogrel|digoxin)\b/gi,
    // Generic pattern for medication names ending in common suffixes
    /\b[a-z]+(?:ine|in|ol|ide|ate|ium|an|ex|il|pril|sartan|statin|mycin|cillin|floxacin|zole|pine|dine|lone|sone|mab|nib|tib)\b/gi
  ];

  // Extract medications
  medicationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const med = match.trim().toLowerCase();
        if (med && !medications.includes(med)) {
          medications.push(med);
        }
      });
    }
  });

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
  // First check concomitant medications (more detailed)
  if (extractedInfo.concomitantMedications && extractedInfo.concomitantMedications.length > 0) {
    return extractedInfo.concomitantMedications[0].medication;
  }

  // Fallback to basic medications list
  if (extractedInfo.medications.length > 0) {
    return extractedInfo.medications[0];
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