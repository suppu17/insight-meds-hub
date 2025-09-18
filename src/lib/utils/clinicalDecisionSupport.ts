// Clinical Decision Support System for Patient-Specific Recommendations
// This module provides comprehensive drug interaction checking, contraindication analysis,
// and personalized clinical recommendations based on patient data

interface PatientProfile {
  age?: string;
  gender?: string;
  weight?: string;
  height?: string;
  bmi?: string;
  allergies?: string[];
  medicalHistory?: string[];
  concomitantMedications?: {
    medication: string;
    dosage: string;
    frequency: string;
    indication: string;
  }[];
  labResults?: {
    testName: string;
    value: string;
  }[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
}

interface ClinicalRecommendation {
  drugInteractions: string[];
  contraindications: string[];
  dosageAdjustments: string[];
  monitoring: string[];
  lifestyle: string[];
  alerts: string[];
}

// Comprehensive drug interaction database
const DRUG_INTERACTIONS = {
  // Cardiovascular medications
  'warfarin': {
    majorInteractions: ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'amiodarone', 'simvastatin'],
    moderateInteractions: ['atorvastatin', 'rosuvastatin', 'omeprazole', 'pantoprazole'],
    descriptions: {
      'aspirin': 'Increased bleeding risk - monitor INR closely',
      'ibuprofen': 'Increased bleeding risk - avoid if possible',
      'simvastatin': 'Increased warfarin effect - monitor INR'
    }
  },
  'lisinopril': {
    majorInteractions: ['spironolactone', 'amiloride', 'potassium supplements'],
    moderateInteractions: ['ibuprofen', 'naproxen', 'diclofenac', 'lithium'],
    descriptions: {
      'ibuprofen': 'Reduced antihypertensive effect, increased kidney risk',
      'spironolactone': 'Hyperkalemia risk - monitor potassium levels'
    }
  },
  'metformin': {
    majorInteractions: ['contrast dye', 'alcohol'],
    moderateInteractions: ['furosemide', 'hydrochlorothiazide'],
    descriptions: {
      'contrast dye': 'Lactic acidosis risk - hold before procedures',
      'alcohol': 'Increased lactic acidosis risk - limit alcohol'
    }
  },
  'atorvastatin': {
    majorInteractions: ['gemfibrozil', 'cyclosporine', 'clarithromycin'],
    moderateInteractions: ['amlodipine', 'diltiazem', 'verapamil'],
    descriptions: {
      'gemfibrozil': 'Severe myopathy risk - avoid combination',
      'amlodipine': 'Increased statin levels - monitor for muscle symptoms'
    }
  }
};

// Contraindications based on medical conditions
const MEDICAL_CONTRAINDICATIONS = {
  'metformin': {
    absoluteContraindications: ['severe kidney disease', 'severe liver disease', 'heart failure'],
    relativeContraindications: ['dehydration', 'contrast procedures'],
    descriptions: {
      'severe kidney disease': 'eGFR <30: Risk of lactic acidosis',
      'heart failure': 'Unstable heart failure increases lactic acidosis risk'
    }
  },
  'ibuprofen': {
    absoluteContraindications: ['active GI bleeding', 'severe kidney disease'],
    relativeContraindications: ['peptic ulcer history', 'heart failure', 'hypertension'],
    descriptions: {
      'active GI bleeding': 'NSAIDs increase bleeding risk',
      'heart failure': 'Fluid retention and worsening heart failure'
    }
  },
  'lisinopril': {
    absoluteContraindications: ['angioedema history', 'bilateral renal artery stenosis'],
    relativeContraindications: ['hyperkalemia', 'severe kidney disease'],
    descriptions: {
      'angioedema history': 'Life-threatening angioedema risk',
      'hyperkalemia': 'ACE inhibitors increase potassium levels'
    }
  }
};

// Age and weight-based dosing adjustments
const DOSAGE_ADJUSTMENTS = {
  'metformin': {
    elderly: 'Start with lower dose in patients >65 years',
    kidneyFunction: 'Reduce dose if eGFR 30-45, avoid if <30',
    weight: 'Dose based on kidney function, not weight'
  },
  'lisinopril': {
    elderly: 'Start with 2.5mg daily in elderly patients',
    kidneyFunction: 'Monitor kidney function closely',
    weight: 'Standard dosing, not weight-based'
  },
  'atorvastatin': {
    elderly: 'Start with 10-20mg daily',
    kidneyFunction: 'No adjustment needed for kidney disease',
    weight: 'Standard dosing regardless of weight'
  }
};

// Laboratory monitoring requirements
const MONITORING_REQUIREMENTS = {
  'warfarin': {
    labs: ['INR', 'PT'],
    frequency: 'Weekly initially, then monthly when stable',
    targets: 'INR 2-3 for most indications'
  },
  'metformin': {
    labs: ['eGFR', 'creatinine', 'HbA1c'],
    frequency: 'eGFR every 6-12 months, HbA1c every 3-6 months',
    targets: 'HbA1c <7% for most patients'
  },
  'lisinopril': {
    labs: ['creatinine', 'potassium', 'eGFR'],
    frequency: 'Check within 1-2 weeks of starting, then every 6-12 months',
    targets: 'Potassium <5.5 mEq/L, stable kidney function'
  },
  'atorvastatin': {
    labs: ['lipid panel', 'ALT', 'AST'],
    frequency: 'Lipids in 6-8 weeks, then annually. LFTs if symptoms',
    targets: 'LDL <100 mg/dL (or <70 for high risk)'
  }
};

/**
 * Analyzes patient data and generates comprehensive clinical recommendations
 * @param primaryMedication - The primary medication being analyzed
 * @param patientProfile - Comprehensive patient data
 * @returns ClinicalRecommendation - Personalized recommendations and alerts
 */
export function generateClinicalRecommendations(
  primaryMedication: string,
  patientProfile: PatientProfile
): ClinicalRecommendation {
  const recommendations: ClinicalRecommendation = {
    drugInteractions: [],
    contraindications: [],
    dosageAdjustments: [],
    monitoring: [],
    lifestyle: [],
    alerts: []
  };

  const drugName = primaryMedication.toLowerCase();

  // Check for drug interactions
  checkDrugInteractions(drugName, patientProfile, recommendations);

  // Check for contraindications
  checkContraindications(drugName, patientProfile, recommendations);

  // Generate dosage adjustments
  generateDosageRecommendations(drugName, patientProfile, recommendations);

  // Add monitoring requirements
  addMonitoringRequirements(drugName, patientProfile, recommendations);

  // Generate lifestyle recommendations
  generateLifestyleRecommendations(drugName, patientProfile, recommendations);

  // Generate alerts based on patient-specific factors
  generatePatientAlerts(drugName, patientProfile, recommendations);

  return recommendations;
}

function checkDrugInteractions(
  drugName: string,
  patientProfile: PatientProfile,
  recommendations: ClinicalRecommendation
) {
  const drugData = DRUG_INTERACTIONS[drugName as keyof typeof DRUG_INTERACTIONS];
  if (!drugData || !patientProfile.concomitantMedications) return;

  patientProfile.concomitantMedications.forEach(med => {
    const medName = med.medication.toLowerCase();

    // Check for major interactions
    if (drugData.majorInteractions.includes(medName)) {
      const description = drugData.descriptions[medName] || `Major interaction with ${med.medication}`;
      recommendations.drugInteractions.push(`⚠️ MAJOR: ${description}`);
      recommendations.alerts.push(`Critical drug interaction: ${drugName} + ${med.medication}`);
    }

    // Check for moderate interactions
    if (drugData.moderateInteractions.includes(medName)) {
      const description = drugData.descriptions[medName] || `Moderate interaction with ${med.medication}`;
      recommendations.drugInteractions.push(`⚠️ MODERATE: ${description}`);
    }
  });
}

function checkContraindications(
  drugName: string,
  patientProfile: PatientProfile,
  recommendations: ClinicalRecommendation
) {
  const contraData = MEDICAL_CONTRAINDICATIONS[drugName as keyof typeof MEDICAL_CONTRAINDICATIONS];
  if (!contraData || !patientProfile.medicalHistory) return;

  patientProfile.medicalHistory.forEach(condition => {
    const conditionLower = condition.toLowerCase();

    // Check absolute contraindications
    contraData.absoluteContraindications.forEach(contra => {
      if (conditionLower.includes(contra)) {
        const description = contraData.descriptions[contra] || `Contraindicated with ${condition}`;
        recommendations.contraindications.push(`🚫 ABSOLUTE: ${description}`);
        recommendations.alerts.push(`Absolute contraindication: ${drugName} with ${condition}`);
      }
    });

    // Check relative contraindications
    contraData.relativeContraindications.forEach(contra => {
      if (conditionLower.includes(contra)) {
        const description = contraData.descriptions[contra] || `Use caution with ${condition}`;
        recommendations.contraindications.push(`⚠️ RELATIVE: ${description}`);
      }
    });
  });

  // Check allergy contraindications
  if (patientProfile.allergies) {
    patientProfile.allergies.forEach(allergy => {
      if (allergy.toLowerCase().includes(drugName)) {
        recommendations.contraindications.push(`🚫 ALLERGY: Patient allergic to ${drugName}`);
        recommendations.alerts.push(`Drug allergy alert: Patient allergic to ${drugName}`);
      }
    });
  }
}

function generateDosageRecommendations(
  drugName: string,
  patientProfile: PatientProfile,
  recommendations: ClinicalRecommendation
) {
  const dosageData = DOSAGE_ADJUSTMENTS[drugName as keyof typeof DOSAGE_ADJUSTMENTS];
  if (!dosageData) return;

  // Age-based adjustments
  if (patientProfile.age && parseInt(patientProfile.age) >= 65) {
    recommendations.dosageAdjustments.push(`👴 ELDERLY: ${dosageData.elderly}`);
  }

  // Kidney function adjustments
  if (patientProfile.labResults) {
    const creatinine = patientProfile.labResults.find(lab =>
      lab.testName.toLowerCase().includes('creatinine')
    );
    if (creatinine && parseFloat(creatinine.value) > 1.5) {
      recommendations.dosageAdjustments.push(`🫘 KIDNEY: ${dosageData.kidneyFunction}`);
    }
  }

  // BMI-based considerations
  if (patientProfile.vitals?.bmi) {
    const bmi = parseFloat(patientProfile.vitals.bmi);
    if (bmi < 18.5) {
      recommendations.dosageAdjustments.push(`⚖️ UNDERWEIGHT: Consider lower starting dose due to low BMI`);
    } else if (bmi > 35) {
      recommendations.dosageAdjustments.push(`⚖️ OBESITY: Weight-based dosing may be needed for some medications`);
    }
  }
}

function addMonitoringRequirements(
  drugName: string,
  patientProfile: PatientProfile,
  recommendations: ClinicalRecommendation
) {
  const monitorData = MONITORING_REQUIREMENTS[drugName as keyof typeof MONITORING_REQUIREMENTS];
  if (!monitorData) return;

  recommendations.monitoring.push(`🔬 Labs needed: ${monitorData.labs.join(', ')}`);
  recommendations.monitoring.push(`📅 Frequency: ${monitorData.frequency}`);
  recommendations.monitoring.push(`🎯 Targets: ${monitorData.targets}`);

  // Add specific monitoring based on patient factors
  if (patientProfile.age && parseInt(patientProfile.age) >= 65) {
    recommendations.monitoring.push(`👴 Elderly: More frequent monitoring recommended`);
  }

  if (patientProfile.medicalHistory?.some(h => h.toLowerCase().includes('kidney'))) {
    recommendations.monitoring.push(`🫘 Kidney disease: Enhanced kidney function monitoring`);
  }
}

function generateLifestyleRecommendations(
  drugName: string,
  patientProfile: PatientProfile,
  recommendations: ClinicalRecommendation
) {
  // Drug-specific lifestyle recommendations
  switch (drugName) {
    case 'metformin':
      recommendations.lifestyle.push('🍽️ Take with meals to reduce GI side effects');
      recommendations.lifestyle.push('🚶 Regular exercise enhances diabetes control');
      recommendations.lifestyle.push('🍷 Limit alcohol to reduce lactic acidosis risk');
      break;

    case 'lisinopril':
      recommendations.lifestyle.push('🧂 Reduce sodium intake for better BP control');
      recommendations.lifestyle.push('🚶 Regular exercise supports cardiovascular health');
      recommendations.lifestyle.push('⚖️ Maintain healthy weight');
      break;

    case 'atorvastatin':
      recommendations.lifestyle.push('🥗 Follow heart-healthy diet');
      recommendations.lifestyle.push('🚶 Regular exercise to improve cholesterol');
      recommendations.lifestyle.push('🚭 Smoking cessation crucial for cardiovascular health');
      break;

    case 'warfarin':
      recommendations.lifestyle.push('🥬 Maintain consistent vitamin K intake');
      recommendations.lifestyle.push('🍷 Limit alcohol to prevent bleeding risk');
      recommendations.lifestyle.push('⚠️ Avoid activities with high injury risk');
      break;
  }

  // BMI-based lifestyle recommendations
  if (patientProfile.vitals?.bmi) {
    const bmi = parseFloat(patientProfile.vitals.bmi);
    if (bmi > 25) {
      recommendations.lifestyle.push('⚖️ Weight loss can improve medication effectiveness');
    }
  }

  // Blood pressure-based recommendations
  if (patientProfile.vitals?.bloodPressure) {
    const bp = patientProfile.vitals.bloodPressure;
    const systolic = parseInt(bp.split('/')[0]);
    if (systolic > 140) {
      recommendations.lifestyle.push('🧂 Reduce sodium intake for blood pressure control');
      recommendations.lifestyle.push('🧘 Stress management techniques recommended');
    }
  }
}

function generatePatientAlerts(
  drugName: string,
  patientProfile: PatientProfile,
  recommendations: ClinicalRecommendation
) {
  // Age-related alerts
  if (patientProfile.age) {
    const age = parseInt(patientProfile.age);
    if (age >= 75) {
      recommendations.alerts.push(`Geriatric patient: Increased sensitivity to medications`);
    }
    if (age < 18) {
      recommendations.alerts.push(`Pediatric patient: Verify appropriate dosing for age/weight`);
    }
  }

  // Multiple medication alerts
  if (patientProfile.concomitantMedications && patientProfile.concomitantMedications.length >= 5) {
    recommendations.alerts.push(`Polypharmacy alert: ${patientProfile.concomitantMedications.length} concurrent medications`);
  }

  // Vital signs alerts
  if (patientProfile.vitals?.bloodPressure) {
    const bp = patientProfile.vitals.bloodPressure;
    const systolic = parseInt(bp.split('/')[0]);
    const diastolic = parseInt(bp.split('/')[1]);

    if (systolic > 180 || diastolic > 110) {
      recommendations.alerts.push(`Hypertensive crisis: BP ${bp} - immediate attention needed`);
    }
  }

  // Lab value alerts
  if (patientProfile.labResults) {
    patientProfile.labResults.forEach(lab => {
      const testName = lab.testName.toLowerCase();
      const value = parseFloat(lab.value);

      if (testName.includes('creatinine') && value > 2.0) {
        recommendations.alerts.push(`Severe kidney impairment: Creatinine ${lab.value} - adjust dosing`);
      }

      if (testName.includes('hba1c') && value > 9.0) {
        recommendations.alerts.push(`Poor diabetes control: HbA1c ${lab.value}% - intensify treatment`);
      }
    });
  }

  // Drug-specific alerts
  if (drugName === 'warfarin') {
    recommendations.alerts.push(`High-risk medication: Requires frequent INR monitoring`);
  }

  if (drugName === 'metformin' && patientProfile.age && parseInt(patientProfile.age) >= 80) {
    recommendations.alerts.push(`Metformin in elderly: Monitor kidney function closely`);
  }
}

/**
 * Calculates estimated GFR based on creatinine, age, gender, and weight
 * @param creatinine - Serum creatinine in mg/dL
 * @param age - Patient age in years
 * @param gender - Patient gender ('male' or 'female')
 * @param weight - Patient weight in kg
 * @returns Estimated GFR
 */
export function calculateGFR(
  creatinine: number,
  age: number,
  gender: string,
  weight?: number
): number {
  // Cockcroft-Gault equation
  const genderMultiplier = gender.toLowerCase() === 'female' ? 0.85 : 1;
  const weightKg = weight || 70; // Default weight if not provided

  const gfr = ((140 - age) * weightKg * genderMultiplier) / (72 * creatinine);
  return Math.round(gfr);
}

/**
 * Assesses cardiovascular risk based on patient factors
 * @param patientProfile - Patient data
 * @returns Risk level and factors
 */
export function assessCardiovascularRisk(patientProfile: PatientProfile) {
  let riskScore = 0;
  const riskFactors: string[] = [];

  // Age factor
  if (patientProfile.age) {
    const age = parseInt(patientProfile.age);
    if (age >= 65) {
      riskScore += 2;
      riskFactors.push('Advanced age');
    }
  }

  // Medical history factors
  if (patientProfile.medicalHistory) {
    patientProfile.medicalHistory.forEach(condition => {
      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('diabetes')) {
        riskScore += 2;
        riskFactors.push('Diabetes');
      }
      if (conditionLower.includes('hypertension')) {
        riskScore += 1;
        riskFactors.push('Hypertension');
      }
      if (conditionLower.includes('smoking')) {
        riskScore += 2;
        riskFactors.push('Smoking history');
      }
    });
  }

  // Lab values
  if (patientProfile.labResults) {
    const cholesterol = patientProfile.labResults.find(lab =>
      lab.testName.toLowerCase().includes('cholesterol')
    );
    if (cholesterol && parseFloat(cholesterol.value) > 240) {
      riskScore += 1;
      riskFactors.push('High cholesterol');
    }
  }

  let riskLevel = 'Low';
  if (riskScore >= 4) riskLevel = 'High';
  else if (riskScore >= 2) riskLevel = 'Moderate';

  return { riskLevel, riskScore, riskFactors };
}

/**
 * Generates medication adherence recommendations based on patient factors
 * @param primaryMedication - The medication being prescribed
 * @param patientProfile - Patient data
 * @returns Adherence strategies
 */
export function generateAdherenceRecommendations(
  primaryMedication: string,
  patientProfile: PatientProfile
): string[] {
  const recommendations: string[] = [];

  // Age-specific recommendations
  if (patientProfile.age && parseInt(patientProfile.age) >= 65) {
    recommendations.push('📱 Consider pill organizer or medication app');
    recommendations.push('👥 Involve family member in medication management');
  }

  // Multiple medication management
  if (patientProfile.concomitantMedications && patientProfile.concomitantMedications.length >= 3) {
    recommendations.push('📋 Medication list card for wallet');
    recommendations.push('⏰ Consider synchronized refill dates');
  }

  // Medication-specific adherence tips
  switch (primaryMedication.toLowerCase()) {
    case 'metformin':
      recommendations.push('🍽️ Set phone reminder to take with meals');
      break;
    case 'lisinopril':
      recommendations.push('🌅 Take at same time daily (morning preferred)');
      break;
    case 'atorvastatin':
      recommendations.push('🌙 Take at bedtime for optimal effectiveness');
      break;
  }

  recommendations.push('💊 Never stop suddenly without consulting provider');
  recommendations.push('📞 Call pharmacy/provider with questions');

  return recommendations;
}