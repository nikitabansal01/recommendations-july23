import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';

interface UserResponse {
  id: string;
  surveyData: any;
  results: {
    cyclePhase: string;
    confidence: string;
    primaryImbalance: string;
    secondaryImbalances: string[];
    explanations: Record<string, string>;
    conflicts: string[];
    scoringBreakdown?: {
      hormoneScores: Record<string, number>;
      totalScore: number;
      symptomSources: Array<{
        symptom: string;
        score: number;
        hormone: string;
        explanation: string;
      }>;
      labAdjustments: Array<{
        lab: string;
        value: number;
        threshold: string;
        adjustment: number;
        hormone: string;
        explanation: string;
      }>;
      conflicts: string[];
      labAnalysis: string[];
      confidenceFactors: string[];
      cyclePhaseImpact: string;
    };
  };
  timestamp: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  // const navigate = useNavigate(); // Unused for now
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<UserResponse | null>(null);
  const [filter, setFilter] = useState('all'); // all, high-confidence, low-confidence, with-labs
  const [showTestData, setShowTestData] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const response = await fetch('/api/get-responses');
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || []);
      } else {
        console.error('Failed to fetch responses');
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestData = () => {
    const testResponses: UserResponse[] = [
      {
        id: 'test_response_1',
        surveyData: {
          q1_period: 'Yes',
          q1_cycle_length: '28',
          q2_last_period: '2025-01-15',
          q2_dont_remember: false,
          q3_flow: 'Heavy',
          q4_symptoms: ['Acne', 'Bloating', 'Fatigue', 'Irritability'],
          q5_energy: 'Constant fatigue',
          q6_mood: 'Irritable',
          q7_cravings: ['Sugar', 'Salt'],
          q8_stress: 'High',
          q9_birth_control: 'No',
          q10_conditions: ['PCOS'],
          q11_labs: {
            free_t: '45',
            dhea: '280',
            lh: '12',
            fsh: '8',
            tsh: '2.5',
            t3: '120',
            insulin: '15',
            hba1c: '5.8'
          }
        },
        results: {
          cyclePhase: 'luteal',
          confidence: 'high',
          primaryImbalance: 'androgens',
          secondaryImbalances: ['cortisol', 'insulin'],
          explanations: {
            androgens: 'PCOS symptoms and elevated testosterone levels indicate androgen dominance',
            cortisol: 'High stress levels and fatigue suggest elevated cortisol',
            insulin: 'PCOS is associated with insulin resistance and elevated insulin levels'
          },
          conflicts: [],
          scoringBreakdown: {
            hormoneScores: {
              androgens: 11,
              progesterone: 8,
              estrogen: 6,
              thyroid: 12,
              cortisol: 15,
              insulin: 14
            },
            totalScore: 66,
            symptomSources: [
              {
                symptom: 'Acne',
                score: 3,
                hormone: 'androgens',
                explanation: 'Acne is strongly associated with high androgen levels'
              },
              {
                symptom: 'Fatigue',
                score: 3,
                hormone: 'thyroid',
                explanation: 'Constant fatigue strongly suggests thyroid or adrenal issues'
              },
              {
                symptom: 'Irritability',
                score: 2,
                hormone: 'progesterone',
                explanation: 'Irritability can indicate progesterone deficiency'
              },
              {
                symptom: 'Heavy flow',
                score: 3,
                hormone: 'estrogen',
                explanation: 'Heavy periods can indicate estrogen dominance'
              },
              {
                symptom: 'PCOS',
                score: 4,
                hormone: 'androgens',
                explanation: 'PCOS is characterized by high androgens and insulin resistance'
              },
              {
                symptom: 'Sugar cravings',
                score: 3,
                hormone: 'insulin',
                explanation: 'Sugar cravings strongly indicate insulin resistance'
              },
              {
                symptom: 'Salt cravings',
                score: 2,
                hormone: 'cortisol',
                explanation: 'Salt cravings can indicate adrenal/cortisol issues'
              },
              {
                symptom: 'High stress',
                score: 3,
                hormone: 'cortisol',
                explanation: 'High stress increases cortisol and can deplete progesterone'
              }
            ],
            labAdjustments: [
              {
                lab: 'free_t',
                value: 45,
                threshold: '>2.0 pg/mL',
                adjustment: 2,
                hormone: 'androgens',
                explanation: 'Free Testosterone 45 > 2.0 pg/mL - added +2 to Androgens'
              },
              {
                lab: 'dhea',
                value: 280,
                threshold: '>300 µg/dL',
                adjustment: 2,
                hormone: 'androgens',
                explanation: 'DHEA 280 > 300 µg/dL - added +2 to Androgens'
              },
              {
                lab: 'insulin',
                value: 15,
                threshold: '>6 μIU/mL',
                adjustment: 2,
                hormone: 'insulin',
                explanation: 'Fasting Insulin 15 > 6 μIU/mL - added +2 to Insulin'
              }
            ],
            conflicts: [],
            labAnalysis: [
              'Elevated free testosterone (45 ng/dL) confirms androgen excess',
              'Elevated insulin (15 μIU/mL) indicates insulin resistance'
            ],
            confidenceFactors: [
              'High symptom score (11 points)',
              'Multiple lab values available',
              'Clear PCOS diagnosis',
              'Consistent symptom patterns'
            ],
            cyclePhaseImpact: 'Cycle phase: luteal - symptoms evaluated in context'
          }
        },
        timestamp: '2025-01-20T10:30:00.000Z',
        createdAt: '2025-01-20T10:30:00.000Z'
      },
      {
        id: 'test_response_2',
        surveyData: {
          q1_period: 'Yes',
          q1_cycle_length: '32',
          q2_last_period: '2025-01-10',
          q2_dont_remember: false,
          q3_flow: 'Light',
          q4_symptoms: ['Fatigue', 'Weight gain', 'Cold intolerance'],
          q5_energy: 'Low energy',
          q6_mood: 'Depressed',
          q7_cravings: ['None'],
          q8_stress: 'Low',
          q9_birth_control: 'No',
          q10_conditions: ['Hypothyroidism'],
          q11_labs: {
            free_t: '25',
            dhea: '150',
            lh: '6',
            fsh: '4',
            tsh: '8.5',
            t3: '80',
            insulin: '8',
            hba1c: '5.2'
          }
        },
        results: {
          cyclePhase: 'follicular',
          confidence: 'medium',
          primaryImbalance: 'thyroid',
          secondaryImbalances: ['progesterone'],
          explanations: {
            thyroid: 'Elevated TSH and symptoms strongly suggest hypothyroidism',
            progesterone: 'Thyroid dysfunction can affect progesterone production'
          },
          conflicts: ['Low energy but normal cortisol levels'],
          scoringBreakdown: {
            hormoneScores: {
              androgens: 0,
              progesterone: 2,
              estrogen: 2,
              thyroid: 8,
              cortisol: 0,
              insulin: 0
            },
            totalScore: 12,
            symptomSources: [
              {
                symptom: 'Fatigue',
                score: 3,
                hormone: 'thyroid',
                explanation: 'Constant fatigue strongly suggests thyroid or adrenal issues'
              },
              {
                symptom: 'Depression',
                score: 2,
                hormone: 'thyroid',
                explanation: 'Depression can indicate thyroid issues or hormone imbalances'
              },
              {
                symptom: 'Light flow',
                score: 2,
                hormone: 'estrogen',
                explanation: 'Light periods may indicate low estrogen'
              },
              {
                symptom: 'Hypothyroidism',
                score: 4,
                hormone: 'thyroid',
                explanation: 'Hashimoto\'s is an autoimmune thyroid condition'
              }
            ],
            labAdjustments: [
              {
                lab: 'tsh',
                value: 8.5,
                threshold: '>2.5 μIU/mL',
                adjustment: 2,
                hormone: 'thyroid',
                explanation: 'TSH 8.5 > 2.5 μIU/mL - added +2 to Thyroid'
              }
            ],
            conflicts: ['Low energy but normal cortisol levels'],
            labAnalysis: [
              'Elevated TSH (8.5 μIU/mL) confirms hypothyroidism'
            ],
            confidenceFactors: [
              'Moderate symptom score (9 points)',
              'Clear lab confirmation',
              'Consistent thyroid symptoms'
            ],
            cyclePhaseImpact: 'Cycle phase: follicular - symptoms evaluated in context'
          }
        },
        timestamp: '2025-01-18T14:15:00.000Z',
        createdAt: '2025-01-18T14:15:00.000Z'
      }
    ];
    setResponses(testResponses);
    setShowTestData(true);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#757575';
    }
  };

  const getHormoneName = (hormone: string) => {
    const names: Record<string, string> = {
      androgens: 'Androgens',
      progesterone: 'Progesterone',
      estrogen: 'Estrogen',
      thyroid: 'Thyroid',
      cortisol: 'Cortisol',
      insulin: 'Insulin'
    };
    return names[hormone] || hormone;
  };

  const filteredResponses = responses.filter(response => {
    switch (filter) {
      case 'high-confidence':
        return response.results.confidence === 'high';
      case 'low-confidence':
        return response.results.confidence === 'low';
      case 'with-labs':
        return response.surveyData.q11_labs && 
               Object.values(response.surveyData.q11_labs).some(val => val !== '');
      default:
        return true;
    }
  });

  const handleResponseClick = (response: UserResponse) => {
    setSelectedResponse(response);
  };

  const handleCloseModal = () => {
    setSelectedResponse(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Loading responses...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Expert Dashboard</h1>
        <p className={styles.subtitle}>
          Review user assessments and scoring breakdowns
        </p>
        
        <div className={styles.filters}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Responses ({responses.length})</option>
            <option value="high-confidence">High Confidence</option>
            <option value="low-confidence">Low Confidence</option>
            <option value="with-labs">With Lab Data</option>
          </select>
          
          {/* Test Data Button - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={loadTestData}
              className={styles.testDataButton}
              disabled={showTestData}
            >
              {showTestData ? '✅ Test Data Loaded' : '🧪 Load Test Data'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.responsesList}>
          {filteredResponses.map((response) => (
            <div 
              key={response.id} 
              className={styles.responseCard}
              onClick={() => handleResponseClick(response)}
            >
              <div className={styles.responseHeader}>
                <span className={styles.responseId}>ID: {response.id.slice(-8)}</span>
                <span 
                  className={styles.confidenceBadge}
                  style={{ backgroundColor: getConfidenceColor(response.results.confidence) }}
                >
                  {response.results.confidence.toUpperCase()}
                </span>
              </div>
              
              <div className={styles.responseDetails}>
                <div className={styles.primaryImbalance}>
                  <strong>Primary:</strong> {getHormoneName(response.results.primaryImbalance)}
                </div>
                <div className={styles.secondaryImbalances}>
                  <strong>Secondary:</strong> {response.results.secondaryImbalances.map(getHormoneName).join(', ')}
                </div>
                <div className={styles.cyclePhase}>
                  <strong>Cycle:</strong> {response.results.cyclePhase}
                </div>
                <div className={styles.timestamp}>
                  {new Date(response.timestamp).toLocaleDateString()}
                </div>
              </div>

              {response.results.scoringBreakdown && (
                <div className={styles.scoringPreview}>
                  <strong>Total Score:</strong> {response.results.scoringBreakdown.totalScore}
                  <br />
                  <strong>Symptoms:</strong> {response.results.scoringBreakdown.symptomSources.length}
                  <br />
                  <strong>Lab Adjustments:</strong> {response.results.scoringBreakdown.labAdjustments.length}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Modal */}
      {selectedResponse && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Detailed Assessment Review</h2>
              <button onClick={handleCloseModal} className={styles.closeButton}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <DetailedResponseView response={selectedResponse} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Detailed Response View Component
const DetailedResponseView: React.FC<{ response: UserResponse }> = ({ response }) => {
  const getHormoneName = (hormone: string) => {
    const names: Record<string, string> = {
      androgens: 'Androgens',
      progesterone: 'Progesterone',
      estrogen: 'Estrogen',
      thyroid: 'Thyroid',
      cortisol: 'Cortisol',
      insulin: 'Insulin'
    };
    return names[hormone] || hormone;
  };

  return (
    <div className={styles.detailedView}>
      {/* Survey Data */}
      <div className={styles.section}>
        <h3>Survey Responses</h3>
        <div className={styles.surveyData}>
          {Object.entries(response.surveyData).map(([key, value]) => (
            <div key={key} className={styles.dataItem}>
              <strong>{key}:</strong> {JSON.stringify(value)}
            </div>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div className={styles.section}>
        <h3>Assessment Results</h3>
        <div className={styles.resultsSummary}>
          <div><strong>Primary Imbalance:</strong> {getHormoneName(response.results.primaryImbalance)}</div>
          <div><strong>Secondary Imbalances:</strong> {response.results.secondaryImbalances.map(getHormoneName).join(', ')}</div>
          <div><strong>Confidence:</strong> {response.results.confidence}</div>
          <div><strong>Cycle Phase:</strong> {response.results.cyclePhase}</div>
        </div>
      </div>

      {/* Scoring Breakdown */}
      {response.results.scoringBreakdown && (
        <div className={styles.section}>
          <h3>Scoring Breakdown</h3>
          
          {/* Hormone Scores */}
          <div className={styles.subsection}>
            <h4>Hormone Scores</h4>
            <div className={styles.scoresGrid}>
              {Object.entries(response.results.scoringBreakdown.hormoneScores).map(([hormone, score]) => (
                <div key={hormone} className={styles.scoreItem}>
                  <span className={styles.hormoneName}>{getHormoneName(hormone)}</span>
                  <span className={styles.scoreValue}>{score}</span>
                </div>
              ))}
            </div>
            <div className={styles.totalScore}>
              <strong>Total Score: {response.results.scoringBreakdown.totalScore}</strong>
            </div>
          </div>

          {/* Symptom Sources */}
          {response.results.scoringBreakdown.symptomSources.length > 0 && (
            <div className={styles.subsection}>
              <h4>Symptom Sources</h4>
              <div className={styles.sourcesList}>
                {response.results.scoringBreakdown.symptomSources.map((source, index) => (
                  <div key={index} className={styles.sourceItem}>
                    <div className={styles.sourceHeader}>
                      <span className={styles.symptomName}>{source.symptom}</span>
                      <span className={styles.sourceScore}>+{source.score}</span>
                    </div>
                    <div className={styles.sourceDetails}>
                      <span className={styles.hormoneTag}>{getHormoneName(source.hormone)}</span>
                      <span className={styles.explanationText}>{source.explanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Adjustments */}
          {response.results.scoringBreakdown.labAdjustments.length > 0 && (
            <div className={styles.subsection}>
              <h4>Lab Adjustments</h4>
              <div className={styles.adjustmentsList}>
                {response.results.scoringBreakdown.labAdjustments.map((adjustment, index) => (
                  <div key={index} className={styles.adjustmentItem}>
                    <div className={styles.adjustmentHeader}>
                      <span className={styles.labName}>{adjustment.lab}</span>
                      <span className={styles.adjustmentScore}>+{adjustment.adjustment}</span>
                    </div>
                    <div className={styles.adjustmentDetails}>
                      <span className={styles.labValue}>{adjustment.value} {adjustment.threshold}</span>
                      <span className={styles.hormoneTag}>{getHormoneName(adjustment.hormone)}</span>
                      <span className={styles.explanationText}>{adjustment.explanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Factors */}
          {response.results.scoringBreakdown.confidenceFactors.length > 0 && (
            <div className={styles.subsection}>
              <h4>Confidence Factors</h4>
              <ul className={styles.confidenceFactorsList}>
                {response.results.scoringBreakdown.confidenceFactors.map((factor, index) => (
                  <li key={index} className={styles.confidenceFactor}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cycle Phase Impact */}
          {response.results.scoringBreakdown.cyclePhaseImpact && (
            <div className={styles.subsection}>
              <h4>Cycle Phase Impact</h4>
              <p className={styles.cyclePhaseImpactText}>{response.results.scoringBreakdown.cyclePhaseImpact}</p>
            </div>
          )}
        </div>
      )}

      {/* Explanations */}
      <div className={styles.section}>
        <h3>Explanations</h3>
        <div className={styles.explanations}>
          {Object.entries(response.results.explanations).map(([hormone, explanation]) => (
            <div key={hormone} className={styles.explanationItem}>
              <strong>{getHormoneName(hormone)}:</strong> {explanation}
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      {response.results.conflicts.length > 0 && (
        <div className={styles.section}>
          <h3>Conflicts</h3>
          <ul className={styles.conflictsList}>
            {response.results.conflicts.map((conflict, index) => (
              <li key={index} className={styles.conflictItem}>{conflict}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 