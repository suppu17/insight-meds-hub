// Health Analysis Service - Replace with your AI backend integration

export interface HealthAnalysisResult {
  condition: string;
  explanation: string;
  naturalRemedies: string[];
  severity: 'mild' | 'moderate' | 'critical';
  recommendation: string;
  whenToSeeDoctor: string[];
}

interface HealthAnalysisRequest {
  concern: string;
  symptoms: string;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string[];
}

class HealthAnalysisService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async analyzeHealthConcern(request: HealthAnalysisRequest): Promise<HealthAnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-health`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concern: request.concern,
          symptoms: request.symptoms,
          patient_age: request.patientAge,
          patient_gender: request.patientGender,
          medical_history: request.medicalHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Health analysis API error: ${response.status}`);
      }

      const result = await response.json();
      return this.formatAnalysisResult(result);
    } catch (error) {
      console.error('Health analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatAnalysisResult(apiResult: any): HealthAnalysisResult {
    return {
      condition: apiResult.condition || 'Unknown condition',
      explanation: apiResult.explanation || '',
      naturalRemedies: apiResult.natural_remedies || [],
      severity: apiResult.severity || 'mild',
      recommendation: apiResult.recommendation || '',
      whenToSeeDoctor: apiResult.when_to_see_doctor || [],
    };
  }
}

// Mock service for development and testing
class MockHealthAnalysisService {
  async analyzeHealthConcern(request: HealthAnalysisRequest): Promise<HealthAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    const concernLower = request.concern.toLowerCase();
    const symptomsLower = request.symptoms.toLowerCase();

    // Enhanced condition matching
    const conditions = {
      'gastritis': this.getGastritisAnalysis(),
      'headache': this.getHeadacheAnalysis(),
      'migraine': this.getMigrainAnalysis(),
      'fever': this.getFeverAnalysis(),
      'cold': this.getColdAnalysis(),
      'flu': this.getFluAnalysis(),
      'stress': this.getStressAnalysis(),
      'anxiety': this.getAnxietyAnalysis(),
      'insomnia': this.getInsomniaAnalysis(),
      'nausea': this.getNauseaAnalysis(),
    };

    // Find the best matching condition
    for (const [key, analysis] of Object.entries(conditions)) {
      if (concernLower.includes(key) || symptomsLower.includes(key)) {
        return analysis;
      }
    }

    // Check for symptom patterns
    if (symptomsLower.includes('stomach') || symptomsLower.includes('nausea')) {
      return this.getGastritisAnalysis();
    }
    if (symptomsLower.includes('head') || symptomsLower.includes('pain')) {
      return this.getHeadacheAnalysis();
    }
    if (symptomsLower.includes('tired') || symptomsLower.includes('fatigue')) {
      return this.getFatigueAnalysis();
    }

    // Default general analysis
    return this.getGeneralAnalysis();
  }

  private getGastritisAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Gastritis (Stomach Inflammation)',
      explanation: 'Gastritis is inflammation of the stomach lining, commonly caused by H. pylori bacteria, NSAIDs, excessive alcohol consumption, stress, or spicy foods. The symptoms you described align with acute gastritis patterns, where the stomach lining becomes irritated and inflamed.',
      naturalRemedies: [
        'Ginger tea (2-3 cups daily) - reduces inflammation and nausea',
        'Chamomile tea - soothes stomach lining and reduces inflammation',
        'Probiotics (yogurt, kefir) - restore healthy gut bacteria',
        'Avoid trigger foods (spicy, acidic, fatty, or processed foods)',
        'Eat smaller, more frequent meals throughout the day',
        'Licorice root tea (DGL form) - protects and heals stomach lining',
        'Aloe vera juice - anti-inflammatory properties for digestive tract'
      ],
      severity: 'moderate',
      recommendation: 'Try natural remedies and dietary modifications. Avoid trigger foods and stress. Monitor symptoms for 7-10 days. If symptoms persist or worsen, consult a healthcare provider.',
      whenToSeeDoctor: [
        'Severe or persistent abdominal pain',
        'Blood in vomit or black, tarry stools',
        'Persistent vomiting preventing fluid retention',
        'Signs of dehydration (dizziness, dry mouth, decreased urination)',
        'Symptoms worsen despite treatment after 1 week',
        'Unexplained weight loss',
        'High fever accompanying stomach pain'
      ]
    };
  }

  private getHeadacheAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Tension Headache',
      explanation: 'Tension headaches are the most common type of headache, often caused by stress, poor posture, dehydration, eye strain, or muscle tension in the neck and shoulders. They typically feel like a tight band around the head and can last from 30 minutes to several hours.',
      naturalRemedies: [
        'Apply cold compress to forehead or warm compress to neck/shoulders',
        'Gentle neck and shoulder stretches and massage',
        'Stay hydrated - drink 8-10 glasses of water daily',
        'Peppermint or lavender essential oil (diluted) on temples',
        'Practice deep breathing exercises or meditation',
        'Ensure adequate sleep (7-9 hours nightly)',
        'Regular moderate exercise to reduce tension',
        'Magnesium supplements (consult healthcare provider first)'
      ],
      severity: 'mild',
      recommendation: 'Try natural remedies and rest in a quiet, dark room. Most tension headaches resolve within a few hours with proper self-care. Focus on stress management and maintaining regular sleep patterns.',
      whenToSeeDoctor: [
        'Sudden, severe headache unlike any experienced before',
        'Headache with fever, stiff neck, confusion, or rash',
        'Headache with vision changes, speech problems, or weakness',
        'Frequent headaches (more than 2-3 per week)',
        'Headache after head injury or trauma',
        'Progressive worsening of headache pattern',
        'Headache with persistent nausea and vomiting'
      ]
    };
  }

  private getMigrainAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Migraine Headache',
      explanation: 'Migraines are neurological headaches characterized by intense, throbbing pain, often on one side of the head. They can be triggered by stress, hormonal changes, certain foods, light, or environmental factors. Migraines often include additional symptoms like nausea and light sensitivity.',
      naturalRemedies: [
        'Rest in a dark, quiet room during migraine attacks',
        'Apply cold compress to head or ice pack wrapped in towel',
        'Butterbur supplements (under medical supervision)',
        'Magnesium supplements (400mg daily, consult doctor)',
        'Feverfew herb tea or supplements',
        'Stay hydrated and maintain regular meal times',
        'Practice stress-reduction techniques (yoga, meditation)',
        'Identify and avoid personal migraine triggers'
      ],
      severity: 'moderate',
      recommendation: 'Keep a migraine diary to identify triggers. Try natural preventive measures and acute treatments. Consider lifestyle modifications to reduce frequency and severity.',
      whenToSeeDoctor: [
        'Severe migraine that doesn\'t respond to treatment',
        'Sudden onset of worst headache ever experienced',
        'Migraine with neurological symptoms (vision loss, weakness)',
        'Increasing frequency or severity of migraines',
        'Migraines interfering with daily activities',
        'New headache pattern after age 50',
        'Headache with fever and neck stiffness'
      ]
    };
  }

  private getFeverAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Fever (Elevated Body Temperature)',
      explanation: 'Fever is your body\'s natural immune response to infection or illness. It helps fight off pathogens by creating an environment less favorable for their growth. Most fevers are beneficial and indicate your immune system is working properly.',
      naturalRemedies: [
        'Stay well hydrated with water, herbal teas, or clear broths',
        'Rest and avoid strenuous activities',
        'Cool, damp washcloths on forehead, wrists, and back of neck',
        'Wear light, breathable clothing',
        'Elderberry syrup for immune system support',
        'Willow bark tea (natural aspirin alternative)',
        'Eat light, easy-to-digest foods when appetite returns',
        'Take lukewarm (not cold) baths or showers'
      ],
      severity: 'moderate',
      recommendation: 'Monitor temperature regularly and focus on rest and hydration. Most fevers resolve naturally within 2-3 days. Seek medical care if fever is very high or accompanied by concerning symptoms.',
      whenToSeeDoctor: [
        'Temperature above 103°F (39.4°C) in adults',
        'Fever lasting more than 3 days',
        'Difficulty breathing or shortness of breath',
        'Severe headache or neck stiffness',
        'Signs of dehydration (dizziness, decreased urination)',
        'Persistent vomiting preventing fluid intake',
        'Unusual skin rash accompanying fever'
      ]
    };
  }

  private getColdAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Common Cold (Upper Respiratory Infection)',
      explanation: 'The common cold is a viral infection of the upper respiratory tract. It\'s usually mild and self-limiting, lasting 7-10 days. Symptoms typically include runny nose, sneezing, mild cough, and sometimes low-grade fever.',
      naturalRemedies: [
        'Drink plenty of warm fluids (herbal tea, warm water with honey)',
        'Gargle with warm salt water for sore throat',
        'Use a humidifier or breathe steam from hot shower',
        'Zinc lozenges within first 24 hours of symptoms',
        'Vitamin C supplements or citrus fruits',
        'Echinacea tea or supplements',
        'Get extra rest and sleep',
        'Honey and ginger tea for cough and throat irritation'
      ],
      severity: 'mild',
      recommendation: 'Rest, stay hydrated, and let your body fight the infection naturally. Most colds resolve on their own within 7-10 days without complications.',
      whenToSeeDoctor: [
        'Symptoms worsen after 7-10 days instead of improving',
        'High fever above 101.5°F (38.6°C)',
        'Severe headache or sinus pain',
        'Difficulty breathing or wheezing',
        'Persistent cough with yellow/green mucus',
        'Ear pain or drainage',
        'Signs of bacterial infection (worsening after initial improvement)'
      ]
    };
  }

  private getFluAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Influenza (Flu)',
      explanation: 'Influenza is a viral respiratory illness that\'s more severe than a common cold. It typically causes sudden onset of fever, body aches, fatigue, and respiratory symptoms. The flu can last 1-2 weeks and may lead to complications in vulnerable populations.',
      naturalRemedies: [
        'Rest and sleep as much as possible',
        'Stay hydrated with water, herbal teas, and broths',
        'Elderberry syrup for antiviral properties',
        'Garlic and ginger for immune support',
        'Warm salt water gargles for sore throat',
        'Humidified air to ease breathing',
        'Light, nutritious meals when appetite returns',
        'Avoid alcohol and smoking'
      ],
      severity: 'moderate',
      recommendation: 'Focus on rest, hydration, and symptom management. The flu typically resolves within 1-2 weeks. Monitor for complications, especially if you\'re in a high-risk group.',
      whenToSeeDoctor: [
        'Difficulty breathing or shortness of breath',
        'Chest pain or pressure',
        'Sudden dizziness or confusion',
        'Severe or persistent vomiting',
        'High fever with severe body aches',
        'Flu symptoms that improve then return with fever',
        'Signs of dehydration or inability to keep fluids down'
      ]
    };
  }

  private getStressAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Stress-Related Symptoms',
      explanation: 'Chronic stress can manifest in various physical and emotional symptoms including headaches, muscle tension, fatigue, digestive issues, and mood changes. Your body\'s stress response, while protective in short-term situations, can become harmful when persistently activated.',
      naturalRemedies: [
        'Practice deep breathing exercises (4-7-8 breathing technique)',
        'Regular meditation or mindfulness practices',
        'Physical exercise (walking, yoga, swimming)',
        'Chamomile tea for relaxation',
        'Lavender aromatherapy or essential oil',
        'Maintain consistent sleep schedule',
        'Limit caffeine and alcohol consumption',
        'Connect with supportive friends and family'
      ],
      severity: 'mild',
      recommendation: 'Identify stress triggers and develop healthy coping strategies. Regular exercise, adequate sleep, and relaxation techniques can significantly reduce stress levels and associated symptoms.',
      whenToSeeDoctor: [
        'Stress significantly interfering with daily activities',
        'Persistent anxiety or panic attacks',
        'Physical symptoms that don\'t improve with stress management',
        'Thoughts of self-harm or harming others',
        'Inability to cope with daily responsibilities',
        'Substance use to cope with stress',
        'Severe sleep disturbances lasting more than 2 weeks'
      ]
    };
  }

  private getAnxietyAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Anxiety Symptoms',
      explanation: 'Anxiety can cause both mental and physical symptoms including racing thoughts, restlessness, muscle tension, rapid heartbeat, and digestive issues. While occasional anxiety is normal, persistent or severe anxiety may benefit from professional support.',
      naturalRemedies: [
        'Practice grounding techniques (5-4-3-2-1 sensory method)',
        'Deep breathing exercises and progressive muscle relaxation',
        'Regular aerobic exercise to reduce anxiety hormones',
        'Passionflower tea or supplements',
        'Magnesium supplements (consult healthcare provider)',
        'Limit caffeine and sugar intake',
        'Maintain regular sleep and meal schedules',
        'Journaling to process thoughts and emotions'
      ],
      severity: 'mild',
      recommendation: 'Try natural anxiety management techniques and lifestyle modifications. Consider therapy or counseling if anxiety persists or significantly impacts your daily life.',
      whenToSeeDoctor: [
        'Panic attacks or severe anxiety episodes',
        'Anxiety preventing normal daily activities',
        'Physical symptoms like chest pain or difficulty breathing',
        'Persistent worry that you can\'t control',
        'Avoiding important activities due to anxiety',
        'Anxiety lasting more than 6 months',
        'Thoughts of self-harm or suicide'
      ]
    };
  }

  private getInsomniaAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Sleep Difficulties (Insomnia)',
      explanation: 'Insomnia involves difficulty falling asleep, staying asleep, or waking too early. It can be caused by stress, anxiety, poor sleep habits, medical conditions, or lifestyle factors. Quality sleep is crucial for physical and mental health.',
      naturalRemedies: [
        'Maintain consistent sleep and wake times',
        'Create a relaxing bedtime routine',
        'Valerian root tea or melatonin supplements',
        'Keep bedroom cool, dark, and quiet',
        'Avoid screens 1 hour before bedtime',
        'Chamomile tea before bed',
        'Regular daytime exercise (not close to bedtime)',
        'Limit caffeine after 2 PM and avoid alcohol before bed'
      ],
      severity: 'mild',
      recommendation: 'Focus on sleep hygiene and relaxation techniques. Most sleep issues improve with consistent healthy sleep habits. If insomnia persists beyond 2-3 weeks, consider professional evaluation.',
      whenToSeeDoctor: [
        'Insomnia lasting more than 3 weeks',
        'Excessive daytime sleepiness affecting daily activities',
        'Loud snoring or breathing interruptions during sleep',
        'Persistent early morning awakenings with inability to return to sleep',
        'Sleep difficulties significantly impacting work or relationships',
        'Depression or anxiety accompanying sleep problems',
        'Physical symptoms like chest pain or irregular heartbeat'
      ]
    };
  }

  private getNauseaAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Nausea and Digestive Discomfort',
      explanation: 'Nausea can be caused by various factors including dietary choices, stress, infections, motion sickness, or underlying digestive conditions. It\'s often your body\'s way of signaling that something needs attention in your digestive system.',
      naturalRemedies: [
        'Ginger tea or ginger supplements for anti-nausea effects',
        'Peppermint tea or peppermint oil (diluted)',
        'Stay hydrated with small, frequent sips of water',
        'Eat bland foods (crackers, toast, rice) when appetite returns',
        'Avoid strong odors and greasy or spicy foods',
        'Fresh air and slow, deep breathing',
        'Acupressure point P6 on inner wrist',
        'Chamomile tea for digestive soothing'
      ],
      severity: 'mild',
      recommendation: 'Rest your digestive system with bland foods and stay hydrated. Most nausea resolves within 24-48 hours. Focus on identifying and avoiding triggers.',
      whenToSeeDoctor: [
        'Persistent vomiting preventing fluid retention',
        'Signs of dehydration (dizziness, dry mouth, decreased urination)',
        'Blood in vomit or severe abdominal pain',
        'High fever accompanying nausea',
        'Nausea lasting more than 3 days without improvement',
        'Severe headache with nausea and vomiting',
        'Chest pain or difficulty breathing with nausea'
      ]
    };
  }

  private getFatigueAnalysis(): HealthAnalysisResult {
    return {
      condition: 'Fatigue and Low Energy',
      explanation: 'Fatigue can result from poor sleep, stress, nutritional deficiencies, dehydration, or underlying health conditions. It\'s important to identify potential causes and address them through lifestyle modifications and natural approaches.',
      naturalRemedies: [
        'Ensure 7-9 hours of quality sleep nightly',
        'Stay hydrated throughout the day',
        'Eat balanced meals with complex carbohydrates and protein',
        'Take short breaks during the day for rest',
        'Light exercise or gentle stretching',
        'B-vitamin complex supplements (consult healthcare provider)',
        'Iron-rich foods if deficiency suspected',
        'Manage stress through relaxation techniques'
      ],
      severity: 'mild',
      recommendation: 'Focus on sleep quality, nutrition, and stress management. If fatigue persists despite lifestyle improvements, consider medical evaluation to rule out underlying conditions.',
      whenToSeeDoctor: [
        'Extreme fatigue lasting more than 2 weeks',
        'Fatigue accompanied by unexplained weight loss',
        'Shortness of breath or chest pain with fatigue',
        'Severe fatigue affecting daily activities',
        'Fatigue with persistent fever or other concerning symptoms',
        'Depression or mood changes with fatigue',
        'Fatigue that doesn\'t improve with rest and lifestyle changes'
      ]
    };
  }

  private getGeneralAnalysis(): HealthAnalysisResult {
    return {
      condition: 'General Health Concern',
      explanation: 'Based on the symptoms you\'ve described, this appears to be a common health issue that may benefit from natural remedies and lifestyle modifications. Your body often has natural healing mechanisms that can be supported through proper self-care.',
      naturalRemedies: [
        'Stay well hydrated with water throughout the day',
        'Ensure adequate rest and quality sleep (7-9 hours)',
        'Eat a balanced diet rich in fruits, vegetables, and whole grains',
        'Practice stress reduction techniques (deep breathing, meditation)',
        'Gentle exercise if feeling well enough (walking, stretching)',
        'Consider herbal teas like chamomile or ginger for general wellness',
        'Maintain good hygiene and avoid known triggers',
        'Listen to your body and rest when needed'
      ],
      severity: 'mild',
      recommendation: 'Try natural approaches and monitor your symptoms. Focus on supporting your body\'s natural healing processes through rest, nutrition, and stress management. Consider professional medical advice if symptoms persist or worsen.',
      whenToSeeDoctor: [
        'Symptoms worsen or don\'t improve after a reasonable time',
        'You develop additional concerning symptoms',
        'You have underlying health conditions that may be affected',
        'You feel unsure about your condition or need reassurance',
        'Symptoms significantly interfere with daily activities',
        'You experience severe pain or discomfort',
        'Any symptom that causes you significant concern'
      ]
    };
  }
}

// Factory function
export const createHealthAnalysisService = (baseUrl?: string, apiKey?: string) => {
  if (baseUrl && apiKey && process.env.NODE_ENV === 'production') {
    return new HealthAnalysisService(baseUrl, apiKey);
  } else {
    console.log('Using mock health analysis service for development/testing');
    return new MockHealthAnalysisService();
  }
};