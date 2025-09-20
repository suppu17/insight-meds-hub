/**
 * Fallback Drug Information Service
 * Provides comprehensive drug information when Bright Data is unavailable
 * Uses multiple free APIs and static data as backup
 */

import type { ComprehensiveDrugInfo } from './brightDataDrugService';

// Enhanced medication database with comprehensive information
const COMPREHENSIVE_DRUG_DATABASE: Record<string, ComprehensiveDrugInfo> = {
  'metformin': {
    drugName: 'Metformin',
    genericName: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet', 'Riomet', 'Glumetza'],
    drugClass: 'Biguanide Antidiabetic',
    overview: 'Metformin is an oral medication primarily used to treat type 2 diabetes. It belongs to the class of drugs called biguanides and helps control blood sugar levels by improving the way the body uses insulin. Often prescribed when diet and exercise alone are insufficient, Metformin lowers glucose production in the liver and increases insulin sensitivity in muscle cells, enhancing glucose uptake.',
    primaryUses: [
      'Treatment for type 2 diabetes and gestational diabetes',
      'Prevention of type 2 diabetes in high-risk individuals (prediabetes)',
      'Off-label use for managing symptoms of polycystic ovary syndrome (PCOS)',
      'Sometimes used to assist in weight loss, especially in patients with insulin resistance'
    ],
    secondaryUses: [
      'Metabolic syndrome management',
      'Weight management in insulin-resistant patients'
    ],
    offLabelUses: [
      'PCOS treatment',
      'Anti-aging research applications',
      'Potential cancer prevention (under research)'
    ],
    mechanismOfAction: {
      description: 'Metformin decreases glucose production by the liver, reduces intestinal absorption of glucose, and improves insulin sensitivity, helping cells take up glucose more effectively.',
      targetSystems: ['Hepatic glucose production', 'Intestinal glucose absorption', 'Peripheral insulin sensitivity'],
      pharmacokinetics: {
        absorption: 'Absorbed from the small intestine with 50-60% bioavailability',
        distribution: 'Distributed to most body tissues, does not bind significantly to plasma proteins',
        metabolism: 'Not metabolized by the liver, excreted unchanged',
        elimination: 'Eliminated unchanged by the kidneys with a half-life of 4-9 hours'
      }
    },
    dosageInfo: {
      availableForms: ['Immediate-release tablets', 'Extended-release tablets', 'Oral solutions', 'Powder sachets'],
      commonDosages: ['500mg twice daily', '850mg once or twice daily', '1000mg twice daily'],
      administrationRoute: ['Oral'],
      specialInstructions: [
        'Take with meals to reduce gastrointestinal side effects',
        'Start with low dose and gradually increase',
        'Dosed by healthcare provider according to patient needs'
      ]
    },
    sideEffects: {
      common: [
        'Gastrointestinal issues such as nausea, diarrhea, stomach upset',
        'Metallic taste in mouth',
        'Decreased appetite',
        'Abdominal discomfort'
      ],
      serious: [
        'Lactic acidosis (rare but serious)',
        'Severe kidney problems',
        'Liver dysfunction',
        'Severe allergic reactions'
      ],
      rare: [
        'Vitamin B12 deficiency with prolonged use',
        'Megaloblastic anemia'
      ]
    },
    contraindications: [
      'Severe kidney disease (eGFR <30 mL/min/1.73m²)',
      'Acute or chronic metabolic acidosis',
      'Diabetic ketoacidosis',
      'Severe liver disease',
      'Heart failure requiring pharmacologic treatment'
    ],
    warnings: [
      'Risk of lactic acidosis in people with severe kidney or liver problems',
      'May need to be temporarily discontinued before surgery or contrast imaging',
      'Monitor kidney function regularly'
    ],
    precautions: [
      'Use with caution in elderly patients',
      'Monitor for vitamin B12 deficiency',
      'Adjust dose in kidney impairment',
      'Discontinue if contrast imaging is required'
    ],
    interactions: {
      majorInteractions: [
        'Contrast dyes (increased risk of kidney problems)',
        'Alcohol (increased risk of lactic acidosis)',
        'Carbonic anhydrase inhibitors'
      ],
      moderateInteractions: [
        'Diuretics',
        'Corticosteroids',
        'Phenytoin',
        'Nicotinic acid'
      ],
      foodInteractions: [
        'Take with food to reduce stomach upset',
        'Limit alcohol consumption'
      ]
    },
    additionalBenefits: [
      'Cardiovascular protective effects reducing risks related to heart disease in diabetic patients',
      'Does not commonly cause weight gain and may aid weight management',
      'May have anti-aging properties (under research)',
      'Potential anticancer effects (under investigation)'
    ],
    ongoingResearch: [
      'Anti-aging and longevity research',
      'Cancer prevention studies',
      'Neuroprotective effects research',
      'Cardiovascular outcomes studies'
    ],
    storageInstructions: [
      'Store metformin at room temperature, away from moisture and heat',
      'Keep in original container',
      'Protect from light'
    ],
    emergencyInfo: [
      'Seek immediate medical attention if severe side effects occur',
      'Signs of lactic acidosis: muscle pain, trouble breathing, stomach pain, dizziness, feeling cold',
      'Contact healthcare provider if persistent vomiting or diarrhea occurs'
    ],
    fdaApproved: true,
    lastUpdated: new Date(),
    sources: [
      { name: 'FDA Orange Book', url: 'https://www.accessdata.fda.gov/scripts/cder/ob/', type: 'FDA', credibility: 'high' },
      { name: 'DailyMed', url: 'https://dailymed.nlm.nih.gov/', type: 'NIH', credibility: 'high' },
      { name: 'Drugs.com', url: 'https://www.drugs.com/metformin.html', type: 'Medical Database', credibility: 'high' },
      { name: 'WebMD', url: 'https://www.webmd.com/drugs/2/drug-1577-3/metformin-oral', type: 'Medical Database', credibility: 'high' },
      { name: 'MedlinePlus', url: 'https://medlineplus.gov/druginfo/meds/a696005.html', type: 'NIH', credibility: 'high' }
    ]
  },
  'lisinopril': {
    drugName: 'Lisinopril',
    genericName: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    drugClass: 'ACE Inhibitor (Angiotensin-Converting Enzyme Inhibitor)',
    overview: 'Lisinopril is an ACE inhibitor used to treat high blood pressure (hypertension) and heart failure. It works by relaxing blood vessels, which lowers blood pressure and reduces the workload on the heart. It is also used to improve survival after a heart attack.',
    primaryUses: [
      'Treatment of hypertension (high blood pressure)',
      'Treatment of heart failure',
      'Improvement of survival after myocardial infarction (heart attack)',
      'Treatment of diabetic nephropathy'
    ],
    secondaryUses: [
      'Kidney protection in diabetes',
      'Prevention of cardiovascular events'
    ],
    offLabelUses: [
      'Migraine prevention',
      'Proteinuria reduction'
    ],
    mechanismOfAction: {
      description: 'Lisinopril inhibits the angiotensin-converting enzyme (ACE), preventing the conversion of angiotensin I to angiotensin II, a potent vasoconstrictor. This results in vasodilation, reduced blood pressure, and decreased aldosterone secretion.',
      targetSystems: ['Renin-angiotensin-aldosterone system', 'Cardiovascular system', 'Renal system'],
      pharmacokinetics: {
        absorption: 'Absorbed from the GI tract with 25% bioavailability',
        distribution: 'Does not bind to plasma proteins significantly',
        metabolism: 'Not metabolized, excreted unchanged',
        elimination: 'Eliminated by the kidneys with a half-life of 12 hours'
      }
    },
    dosageInfo: {
      availableForms: ['Tablets'],
      commonDosages: ['5mg once daily', '10mg once daily', '20mg once daily', '40mg once daily'],
      administrationRoute: ['Oral'],
      specialInstructions: [
        'Can be taken with or without food',
        'Take at the same time each day',
        'Start with low dose and titrate as needed'
      ]
    },
    sideEffects: {
      common: [
        'Dry cough',
        'Dizziness',
        'Headache',
        'Fatigue',
        'Nausea'
      ],
      serious: [
        'Angioedema (swelling of face, lips, tongue, throat)',
        'Severe hypotension',
        'Kidney problems',
        'Hyperkalemia (high potassium)'
      ],
      rare: [
        'Liver problems',
        'Blood disorders',
        'Severe allergic reactions'
      ]
    },
    contraindications: [
      'History of angioedema with ACE inhibitors',
      'Pregnancy (second and third trimesters)',
      'Bilateral renal artery stenosis',
      'Hypersensitivity to lisinopril'
    ],
    warnings: [
      'Risk of angioedema, especially in first dose',
      'Can cause fetal harm during pregnancy',
      'Monitor kidney function and potassium levels'
    ],
    precautions: [
      'Use with caution in kidney disease',
      'Monitor blood pressure regularly',
      'Be careful when standing up (orthostatic hypotension)',
      'Stay hydrated'
    ],
    interactions: {
      majorInteractions: [
        'Potassium supplements',
        'Salt substitutes containing potassium',
        'Diuretics',
        'NSAIDs'
      ],
      moderateInteractions: [
        'Lithium',
        'Digoxin',
        'Insulin and diabetes medications'
      ],
      foodInteractions: [
        'Avoid salt substitutes with potassium',
        'Limit alcohol consumption'
      ]
    },
    additionalBenefits: [
      'Cardiovascular protection',
      'Kidney protection in diabetics',
      'Improved survival after heart attack',
      'May reduce risk of stroke'
    ],
    ongoingResearch: [
      'Combination therapy studies',
      'Long-term cardiovascular outcomes',
      'Kidney protection mechanisms'
    ],
    storageInstructions: [
      'Store at room temperature',
      'Protect from moisture',
      'Keep in original container'
    ],
    emergencyInfo: [
      'Seek immediate help for signs of angioedema',
      'Contact doctor if persistent cough develops',
      'Monitor for signs of low blood pressure'
    ],
    fdaApproved: true,
    lastUpdated: new Date(),
    sources: [
      { name: 'FDA Orange Book', url: 'https://www.accessdata.fda.gov/scripts/cder/ob/', type: 'FDA', credibility: 'high' },
      { name: 'DailyMed', url: 'https://dailymed.nlm.nih.gov/', type: 'NIH', credibility: 'high' },
      { name: 'Drugs.com', url: 'https://www.drugs.com/lisinopril.html', type: 'Medical Database', credibility: 'high' }
    ]
  },
  'amoxicillin': {
    drugName: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Trimox', 'Moxatag'],
    drugClass: 'Beta-lactam Antibiotic (Penicillin)',
    overview: 'Amoxicillin is a penicillin-type antibiotic used to treat a wide variety of bacterial infections. It works by stopping the growth of bacteria and is effective against many gram-positive and some gram-negative bacteria.',
    primaryUses: [
      'Treatment of bacterial infections of the ear, nose, throat',
      'Respiratory tract infections',
      'Urinary tract infections',
      'Skin and soft tissue infections',
      'Dental infections'
    ],
    secondaryUses: [
      'H. pylori eradication (with other medications)',
      'Endocarditis prevention'
    ],
    offLabelUses: [
      'Lyme disease treatment',
      'Anthrax exposure prophylaxis'
    ],
    mechanismOfAction: {
      description: 'Amoxicillin inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins, leading to bacterial cell death.',
      targetSystems: ['Bacterial cell wall synthesis'],
      pharmacokinetics: {
        absorption: 'Well absorbed from GI tract, 74-92% bioavailability',
        distribution: 'Widely distributed to most body tissues',
        metabolism: 'Partially metabolized in the liver',
        elimination: 'Primarily excreted unchanged in urine, half-life 1-1.3 hours'
      }
    },
    dosageInfo: {
      availableForms: ['Capsules', 'Tablets', 'Chewable tablets', 'Oral suspension'],
      commonDosages: ['250mg three times daily', '500mg three times daily', '875mg twice daily'],
      administrationRoute: ['Oral'],
      specialInstructions: [
        'Can be taken with or without food',
        'Complete the full course even if feeling better',
        'Take at evenly spaced intervals'
      ]
    },
    sideEffects: {
      common: [
        'Nausea',
        'Vomiting',
        'Diarrhea',
        'Abdominal pain',
        'Skin rash'
      ],
      serious: [
        'Clostridioides difficile-associated diarrhea',
        'Severe allergic reactions',
        'Stevens-Johnson syndrome',
        'Severe skin reactions'
      ],
      rare: [
        'Blood disorders',
        'Liver problems',
        'Kidney problems'
      ]
    },
    contraindications: [
      'Allergy to penicillin or beta-lactam antibiotics',
      'History of severe allergic reaction to amoxicillin'
    ],
    warnings: [
      'Risk of serious allergic reactions',
      'May cause antibiotic-associated diarrhea',
      'Can reduce effectiveness of oral contraceptives'
    ],
    precautions: [
      'Use with caution in patients with kidney disease',
      'Monitor for signs of allergic reaction',
      'Complete full course of treatment'
    ],
    interactions: {
      majorInteractions: [
        'Methotrexate',
        'Warfarin',
        'Oral contraceptives'
      ],
      moderateInteractions: [
        'Probenecid',
        'Allopurinol'
      ],
      foodInteractions: [
        'No significant food interactions'
      ]
    },
    additionalBenefits: [
      'Broad spectrum of activity',
      'Generally well tolerated',
      'Available in multiple formulations'
    ],
    ongoingResearch: [
      'Resistance patterns',
      'Combination therapies',
      'Pediatric dosing studies'
    ],
    storageInstructions: [
      'Store at room temperature',
      'Refrigerate liquid formulations',
      'Discard unused liquid after 14 days'
    ],
    emergencyInfo: [
      'Seek immediate help for signs of allergic reaction',
      'Contact doctor for severe diarrhea',
      'Report unusual bleeding or bruising'
    ],
    fdaApproved: true,
    lastUpdated: new Date(),
    sources: [
      { name: 'FDA Orange Book', url: 'https://www.accessdata.fda.gov/scripts/cder/ob/', type: 'FDA', credibility: 'high' },
      { name: 'DailyMed', url: 'https://dailymed.nlm.nih.gov/', type: 'NIH', credibility: 'high' },
      { name: 'Drugs.com', url: 'https://www.drugs.com/amoxicillin.html', type: 'Medical Database', credibility: 'high' }
    ]
  }
};

class FallbackDrugService {
  private cache: Map<string, ComprehensiveDrugInfo> = new Map();

  /**
   * Get comprehensive drug information from fallback sources
   */
  async getComprehensiveDrugInfo(drugName: string): Promise<ComprehensiveDrugInfo | null> {
    const normalizedName = drugName.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(normalizedName)) {
      console.log(`📋 Using cached fallback data for ${drugName}`);
      return this.cache.get(normalizedName)!;
    }

    try {
      console.log(`🔍 Fetching fallback data for ${drugName}...`);
      
      // Try static database first
      const staticInfo = this.getStaticDrugInfo(normalizedName);
      if (staticInfo) {
        this.cache.set(normalizedName, staticInfo);
        console.log(`✅ Found comprehensive fallback data for ${drugName}`);
        return staticInfo;
      }

      // Try free APIs as backup
      const apiInfo = await this.fetchFromFreeAPIs(normalizedName);
      if (apiInfo) {
        this.cache.set(normalizedName, apiInfo);
        console.log(`✅ Generated fallback data for ${drugName} from APIs`);
        return apiInfo;
      }

      console.log(`❌ No fallback data available for ${drugName}`);
      return null;
    } catch (error) {
      console.error(`❌ Error in fallback service for ${drugName}:`, error);
      return null;
    }
  }

  /**
   * Get drug information from static database
   */
  private getStaticDrugInfo(drugName: string): ComprehensiveDrugInfo | null {
    return COMPREHENSIVE_DRUG_DATABASE[drugName] || null;
  }

  /**
   * Fetch from free APIs (OpenFDA, etc.)
   */
  private async fetchFromFreeAPIs(drugName: string): Promise<ComprehensiveDrugInfo | null> {
    try {
      // Try OpenFDA API
      const fdaResponse = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${drugName}"&limit=1`
      );

      if (fdaResponse.ok) {
        const fdaData = await fdaResponse.json();
        if (fdaData.results && fdaData.results.length > 0) {
          return this.parseFDAData(drugName, fdaData.results[0]);
        }
      }

      // Fallback to basic structure
      return this.createBasicDrugInfo(drugName);
    } catch (error) {
      console.warn('Free API fetch failed:', error);
      return this.createBasicDrugInfo(drugName);
    }
  }

  /**
   * Parse FDA API data
   */
  private parseFDAData(drugName: string, fdaData: any): ComprehensiveDrugInfo {
    const brandNames = fdaData.openfda?.brand_name || [];
    const manufacturer = fdaData.openfda?.manufacturer_name?.[0] || '';
    const drugClass = fdaData.openfda?.pharm_class_epc?.[0] || '';
    
    return {
      drugName: drugName.charAt(0).toUpperCase() + drugName.slice(1),
      genericName: drugName,
      brandNames: Array.isArray(brandNames) ? brandNames : [brandNames],
      drugClass: drugClass,
      overview: `${drugName.charAt(0).toUpperCase() + drugName.slice(1)} is a prescription medication with established clinical uses. Detailed information should be obtained from healthcare providers.`,
      primaryUses: fdaData.indications_and_usage ? [fdaData.indications_and_usage[0]] : [],
      secondaryUses: [],
      offLabelUses: [],
      mechanismOfAction: {
        description: fdaData.clinical_pharmacology?.[0] || 'Mechanism of action information available from healthcare provider.',
        targetSystems: [],
        pharmacokinetics: {
          absorption: '',
          distribution: '',
          metabolism: '',
          elimination: ''
        }
      },
      dosageInfo: {
        availableForms: fdaData.dosage_forms_and_strengths ? [fdaData.dosage_forms_and_strengths[0]] : [],
        commonDosages: [],
        administrationRoute: [],
        specialInstructions: fdaData.dosage_and_administration ? [fdaData.dosage_and_administration[0]] : []
      },
      sideEffects: {
        common: fdaData.adverse_reactions ? fdaData.adverse_reactions.slice(0, 5) : [],
        serious: [],
        rare: []
      },
      contraindications: fdaData.contraindications ? [fdaData.contraindications[0]] : [],
      warnings: fdaData.warnings ? [fdaData.warnings[0]] : [],
      precautions: fdaData.precautions ? [fdaData.precautions[0]] : [],
      interactions: {
        majorInteractions: [],
        moderateInteractions: [],
        foodInteractions: []
      },
      additionalBenefits: [],
      ongoingResearch: [],
      storageInstructions: fdaData.storage_and_handling ? [fdaData.storage_and_handling[0]] : [],
      emergencyInfo: ['Always consult healthcare provider for medical emergencies'],
      fdaApproved: true,
      lastUpdated: new Date(),
      sources: [
        { name: 'OpenFDA', url: 'https://open.fda.gov/', type: 'FDA', credibility: 'high' }
      ]
    };
  }

  /**
   * Create basic drug info structure
   */
  private createBasicDrugInfo(drugName: string): ComprehensiveDrugInfo {
    return {
      drugName: drugName.charAt(0).toUpperCase() + drugName.slice(1),
      genericName: drugName,
      brandNames: [],
      drugClass: 'Prescription Medication',
      overview: `${drugName.charAt(0).toUpperCase() + drugName.slice(1)} is a prescription medication. For comprehensive information, please consult your healthcare provider or pharmacist.`,
      primaryUses: ['Consult healthcare provider for specific uses'],
      secondaryUses: [],
      offLabelUses: [],
      mechanismOfAction: {
        description: 'Mechanism of action information available from healthcare provider.',
        targetSystems: [],
        pharmacokinetics: {
          absorption: '',
          distribution: '',
          metabolism: '',
          elimination: ''
        }
      },
      dosageInfo: {
        availableForms: [],
        commonDosages: [],
        administrationRoute: [],
        specialInstructions: ['Follow healthcare provider instructions']
      },
      sideEffects: {
        common: ['Consult healthcare provider for side effect information'],
        serious: [],
        rare: []
      },
      contraindications: ['Consult healthcare provider'],
      warnings: ['Always follow healthcare provider guidance'],
      precautions: ['Consult healthcare provider before use'],
      interactions: {
        majorInteractions: [],
        moderateInteractions: [],
        foodInteractions: []
      },
      additionalBenefits: [],
      ongoingResearch: [],
      storageInstructions: ['Store as directed by pharmacist'],
      emergencyInfo: ['Contact healthcare provider for emergencies'],
      fdaApproved: false,
      lastUpdated: new Date(),
      sources: [
        { name: 'Basic Drug Information', url: '#', type: 'Medical Database', credibility: 'medium' }
      ]
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get available drugs in static database
   */
  getAvailableDrugs(): string[] {
    return Object.keys(COMPREHENSIVE_DRUG_DATABASE);
  }
}

// Singleton instance
let fallbackService: FallbackDrugService | null = null;

/**
 * Get or create fallback drug service instance
 */
export function getFallbackDrugService(): FallbackDrugService {
  if (!fallbackService) {
    fallbackService = new FallbackDrugService();
  }
  return fallbackService;
}

/**
 * Quick function to get fallback drug information
 */
export async function getFallbackDrugInfo(drugName: string): Promise<ComprehensiveDrugInfo | null> {
  const service = getFallbackDrugService();
  return service.getComprehensiveDrugInfo(drugName);
}
