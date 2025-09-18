// Drug name validation utility
// This module provides functionality to validate if user input is a valid drug name

// Common drug name patterns and suffixes
const DRUG_SUFFIXES = [
  'ine', 'in', 'ol', 'ide', 'ate', 'ium', 'an', 'ex', 'il', 'pril', 'sartan',
  'statin', 'mycin', 'cillin', 'floxacin', 'zole', 'pine', 'dine', 'lone', 'sone',
  'mab', 'nib', 'tib', 'mide', 'ide', 'fen', 'phen', 'zepam', 'thiazide'
];

// Known drug prefixes
const DRUG_PREFIXES = [
  'anti', 'beta', 'alpha', 'hydro', 'chloro', 'fluoro', 'methyl', 'acetyl',
  'dextro', 'levo', 'iso', 'pseudo', 'neo', 'pro', 'pre', 'post'
];

// Common brand names and generic drug names (extensive list)
const KNOWN_DRUGS = [
  // Common pain relievers
  'aspirin', 'ibuprofen', 'acetaminophen', 'paracetamol', 'naproxen', 'diclofenac',
  'celecoxib', 'meloxicam', 'indomethacin', 'tramadol', 'codeine', 'morphine',

  // Cardiovascular
  'lisinopril', 'atenolol', 'metoprolol', 'propranolol', 'amlodipine', 'nifedipine',
  'losartan', 'valsartan', 'enalapril', 'captopril', 'hydrochlorothiazide', 'furosemide',
  'digoxin', 'warfarin', 'heparin', 'clopidogrel', 'atorvastatin', 'simvastatin',
  'rosuvastatin', 'pravastatin', 'lovastatin',

  // Diabetes
  'metformin', 'insulin', 'glipizide', 'glyburide', 'pioglitazone', 'sitagliptin',
  'empagliflozin', 'liraglutide', 'semaglutide',

  // Antibiotics
  'amoxicillin', 'penicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
  'cephalexin', 'clindamycin', 'erythromycin', 'tetracycline', 'vancomycin',
  'trimethoprim', 'sulfamethoxazole',

  // Mental health
  'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram',
  'venlafaxine', 'duloxetine', 'bupropion', 'trazodone', 'mirtazapine',
  'lithium', 'quetiapine', 'risperidone', 'olanzapine', 'aripiprazole',
  'clonazepam', 'lorazepam', 'alprazolam', 'diazepam',

  // Respiratory
  'albuterol', 'ipratropium', 'budesonide', 'fluticasone', 'montelukast',
  'theophylline', 'prednisone', 'prednisolone',

  // GI
  'omeprazole', 'lansoprazole', 'pantoprazole', 'ranitidine', 'famotidine',
  'sucralfate', 'metoclopramide', 'ondansetron',

  // Common brand names
  'advil', 'tylenol', 'motrin', 'aleve', 'excedrin', 'bayer', 'bufferin',
  'lipitor', 'crestor', 'zocor', 'pravachol', 'mevacor',
  'glucophage', 'januvia', 'jardiance', 'victoza', 'ozempic',
  'zoloft', 'prozac', 'paxil', 'celexa', 'lexapro', 'cymbalta', 'effexor',
  'wellbutrin', 'xanax', 'ativan', 'klonopin', 'valium',
  'proventil', 'ventolin', 'spiriva', 'advair', 'symbicort',
  'prilosec', 'prevacid', 'nexium', 'pepcid', 'zantac'
];

// Words that are definitely NOT drug names
const NON_DRUG_WORDS = [
  'hello', 'hi', 'test', 'testing', 'food', 'water', 'juice', 'coffee', 'tea',
  'vitamin', 'supplement', 'protein', 'exercise', 'diet', 'sleep', 'rest',
  'doctor', 'hospital', 'clinic', 'pharmacy', 'medicine', 'pill', 'tablet',
  'capsule', 'liquid', 'injection', 'shot', 'dose', 'dosage', 'prescription',
  'headache', 'pain', 'fever', 'cold', 'flu', 'cough', 'sore throat',
  'nausea', 'vomiting', 'diarrhea', 'constipation', 'heartburn', 'infection',
  'allergy', 'rash', 'itch', 'swelling', 'bruise', 'cut', 'burn',
  'broken', 'sprain', 'strain', 'fracture', 'surgery', 'operation',
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
  'what', 'when', 'where', 'why', 'how', 'who', 'which', 'can', 'could',
  'should', 'would', 'will', 'shall', 'may', 'might', 'must', 'need',
  'want', 'like', 'love', 'hate', 'good', 'bad', 'best', 'worst',
  'big', 'small', 'large', 'little', 'new', 'old', 'young', 'fast', 'slow'
];

// Symptoms and conditions (not drug names)
const MEDICAL_CONDITIONS = [
  'diabetes', 'hypertension', 'depression', 'anxiety', 'asthma', 'copd',
  'arthritis', 'osteoporosis', 'cancer', 'tumor', 'infection', 'pneumonia',
  'bronchitis', 'sinusitis', 'migraine', 'epilepsy', 'seizure', 'stroke',
  'heart attack', 'angina', 'arrhythmia', 'heart failure', 'kidney disease',
  'liver disease', 'hepatitis', 'cirrhosis', 'ulcer', 'gastritis', 'reflux',
  'ibs', 'crohns', 'colitis', 'fibromyalgia', 'lupus', 'psoriasis', 'eczema'
];

/**
 * Validates if the input text is likely a valid drug name
 * @param input - The text to validate
 * @returns boolean - true if likely a drug name, false otherwise
 */
export function isDrugName(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const cleanInput = input.trim().toLowerCase();

  // Empty or too short
  if (cleanInput.length < 2) {
    return false;
  }

  // Check if it's in our known drugs list
  if (KNOWN_DRUGS.includes(cleanInput)) {
    return true;
  }

  // Check if it's definitely not a drug
  if (NON_DRUG_WORDS.includes(cleanInput)) {
    return false;
  }

  // Check if it's a medical condition (not a drug)
  if (MEDICAL_CONDITIONS.includes(cleanInput)) {
    return false;
  }

  // Check for multiple words (most drug names are single words or hyphenated)
  const words = cleanInput.split(/\s+/);
  if (words.length > 3) {
    return false;
  }

  // Check for common non-drug patterns
  if (/^(what|when|where|why|how|who|which|can|could|should|would|will|may|might|must)/.test(cleanInput)) {
    return false;
  }

  // Check for numbers without letters (like "123" or "2024")
  if (/^\d+$/.test(cleanInput)) {
    return false;
  }

  // Check for email patterns
  if (/@/.test(cleanInput)) {
    return false;
  }

  // Check for URL patterns
  if (/^(https?:\/\/|www\.|\.com|\.org|\.net)/.test(cleanInput)) {
    return false;
  }

  // Drug name heuristics
  const hasDrugSuffix = DRUG_SUFFIXES.some(suffix => cleanInput.endsWith(suffix));
  const hasDrugPrefix = DRUG_PREFIXES.some(prefix => cleanInput.startsWith(prefix));

  // Contains pharmaceutical-like patterns
  const hasPharmPattern = /^[a-z]+([0-9]+)?([a-z]+)?$/.test(cleanInput) &&
                         cleanInput.length >= 4 &&
                         cleanInput.length <= 20;

  // If it has drug-like characteristics, it's likely a drug
  if (hasDrugSuffix || hasDrugPrefix || hasPharmPattern) {
    // But make sure it's not a common word that happens to match the pattern
    if (cleanInput.length >= 4 && !NON_DRUG_WORDS.includes(cleanInput)) {
      return true;
    }
  }

  // For brand names or unknown generics, we'll be more permissive
  // If it's a single word, 4-15 characters, contains only letters (and maybe numbers/hyphens)
  if (words.length === 1 &&
      cleanInput.length >= 4 &&
      cleanInput.length <= 15 &&
      /^[a-z]([a-z0-9\-]*[a-z0-9])?$/.test(cleanInput) &&
      !NON_DRUG_WORDS.includes(cleanInput) &&
      !MEDICAL_CONDITIONS.includes(cleanInput)) {
    return true;
  }

  // Default to false for safety
  return false;
}

/**
 * Gets a validation message for invalid drug names
 * @param input - The invalid input
 * @returns string - Appropriate error message
 */
export function getDrugValidationMessage(input: string): string {
  if (!input || input.trim().length === 0) {
    return "Please enter a medication name to continue.";
  }

  const cleanInput = input.trim().toLowerCase();

  if (NON_DRUG_WORDS.includes(cleanInput)) {
    return "Please enter a valid medication name (e.g., Aspirin, Metformin, Lisinopril).";
  }

  if (MEDICAL_CONDITIONS.includes(cleanInput)) {
    return `"${input}" appears to be a medical condition. Please enter the specific medication name used to treat this condition.`;
  }

  if (cleanInput.split(/\s+/).length > 3) {
    return "Please enter just the medication name without additional text.";
  }

  if (/^\d+$/.test(cleanInput)) {
    return "Please enter a medication name, not just numbers.";
  }

  if (/@/.test(cleanInput) || /^(https?:\/\/|www\.|\.com|\.org|\.net)/.test(cleanInput)) {
    return "Please enter a medication name, not a website or email address.";
  }

  return `"${input}" doesn't appear to be a valid medication name. Please enter a drug name like Aspirin, Metformin, or Lisinopril.`;
}

/**
 * Suggests similar drug names if the input is close to a known drug
 * @param input - The input to find suggestions for
 * @returns string[] - Array of suggested drug names
 */
export function getSuggestedDrugNames(input: string): string[] {
  if (!input || input.trim().length < 2) {
    return [];
  }

  const cleanInput = input.trim().toLowerCase();
  const suggestions: string[] = [];

  // Find drugs that start with the same letters
  KNOWN_DRUGS.forEach(drug => {
    if (drug.startsWith(cleanInput.substring(0, 3)) && drug !== cleanInput) {
      suggestions.push(drug);
    }
  });

  // Find drugs that contain the input
  if (suggestions.length < 5) {
    KNOWN_DRUGS.forEach(drug => {
      if (drug.includes(cleanInput) && drug !== cleanInput && !suggestions.includes(drug)) {
        suggestions.push(drug);
      }
    });
  }

  return suggestions.slice(0, 5);
}