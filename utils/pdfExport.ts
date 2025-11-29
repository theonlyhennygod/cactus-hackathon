import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Gemini API for AI-generated summary
const GEMINI_API_KEY = 'AIzaSyBbdAsfYEoNCjGxaWfUj5FWi8peo67-NZI';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Generate AI summary for PDF using Gemini
 */
async function generateAISummary(vitals: any): Promise<string> {
    try {
        const prompt = `Create a brief, professional wellness report summary (2-3 sentences) based on this data:
- Overall Mood: ${vitals.overallMood || 'Not assessed'}
- Mood Score: ${vitals.moodScore ? `${vitals.moodScore}/10` : 'Not assessed'}
- Facial Expression: ${vitals.facialEmotion || 'Not captured'}
- Voice Tone: ${vitals.voiceEmotion || 'Not captured'}
- Breathing Rate: ${vitals.breathingRate ? `${vitals.breathingRate} rpm` : 'Not measured'}
- Tremor Index: ${vitals.tremorIndex ? vitals.tremorIndex.toFixed(2) : 'Not measured'}
- Skin Condition: ${vitals.skinCondition || 'Not analyzed'}

AI Analysis: ${vitals.summary || 'No analysis available'}
Severity: ${vitals.severity || 'unknown'}

Write a compassionate, supportive summary. Do NOT give medical advice.`;

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
            }),
        });

        if (!response.ok) {
            console.warn('Gemini PDF summary failed:', response.status);
            return vitals.summary || 'Wellness check completed. Please consult a healthcare provider for medical advice.';
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || vitals.summary || 'Wellness check completed.';
    } catch (error) {
        console.warn('AI summary generation failed:', error);
        return vitals.summary || 'Wellness check completed. Please consult a healthcare provider for medical advice.';
    }
}

/**
 * Get emoji for mood
 */
function getMoodEmoji(mood: string | null): string {
    const emojis: Record<string, string> = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        anxious: '😰',
        neutral: '😐',
        calm: '😌',
    };
    return emojis[mood || ''] || '🙂';
}

/**
 * Get severity color
 */
function getSeverityColor(severity: string | null): string {
    const colors: Record<string, string> = {
        green: '#4CAF50',
        yellow: '#FFC107',
        red: '#F44336',
    };
    return colors[severity || ''] || '#9E9E9E';
}

export const generateAndSharePDF = async (vitals: any) => {
    console.log('📄 Generating PDF with vitals:', vitals);
    
    // Generate AI summary
    const aiSummary = await generateAISummary(vitals);
    
    const severityColor = getSeverityColor(vitals.severity);
    const moodEmoji = getMoodEmoji(vitals.overallMood);
    const inferenceLabel = vitals.inferenceType === 'local' ? '🔒 On-Device AI' 
        : vitals.inferenceType === 'cloud' ? '☁️ Cloud AI' 
        : '📱 Basic Analysis';

    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          h1 { text-align: center; color: #333; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
          .card { background: white; border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .card-header { font-weight: bold; color: #333; font-size: 1.1em; margin-bottom: 8px; }
          .label { font-weight: 500; color: #666; margin-bottom: 4px; }
          .value { font-size: 1.3em; color: #000; }
          .mood-emoji { font-size: 2em; text-align: center; margin: 10px 0; }
          .severity-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-weight: bold; }
          .summary-box { background: #f0f7ff; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
          .recommendations { list-style: none; padding: 0; }
          .recommendations li { padding: 8px 0; border-bottom: 1px solid #eee; }
          .recommendations li:last-child { border-bottom: none; }
          .recommendations li:before { content: "✓ "; color: #4CAF50; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 0.8em; color: #999; }
          .inference-tag { text-align: center; font-size: 0.85em; color: #666; margin-top: 10px; }
          .grid { display: flex; flex-wrap: wrap; gap: 10px; }
          .grid-item { flex: 1; min-width: 45%; }
        </style>
      </head>
      <body>
        <h1>🌿 Wellness Check Report</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div class="card">
          <div class="card-header">Emotional Wellness</div>
          <div class="mood-emoji">${moodEmoji}</div>
          <div style="text-align: center;">
            <div class="label">Overall Mood</div>
            <div class="value" style="text-transform: capitalize;">${vitals.overallMood || 'Not assessed'}</div>
            ${vitals.moodScore ? `<div style="margin-top: 5px; color: #666;">Score: ${vitals.moodScore}/10</div>` : ''}
          </div>
          <div class="grid" style="margin-top: 15px;">
            <div class="grid-item">
              <div class="label">Facial Expression</div>
              <div style="text-transform: capitalize;">${vitals.facialEmotion || '--'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Voice Tone</div>
              <div style="text-transform: capitalize;">${vitals.voiceEmotion || '--'}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">Physical Indicators</div>
          <div class="grid">
            <div class="grid-item">
              <div class="label">Breathing Rate</div>
              <div class="value">${vitals.breathingRate ? vitals.breathingRate.toFixed(0) : '--'} <span style="font-size: 0.7em; color: #666;">rpm</span></div>
            </div>
            <div class="grid-item">
              <div class="label">Tremor Index</div>
              <div class="value">${vitals.tremorIndex ? vitals.tremorIndex.toFixed(2) : '--'}</div>
            </div>
          </div>
          ${vitals.skinCondition ? `
          <div style="margin-top: 15px;">
            <div class="label">Skin Analysis</div>
            <div>${vitals.skinCondition}</div>
          </div>
          ` : ''}
        </div>

        <div class="card">
          <div class="card-header">
            AI Assessment 
            <span class="severity-badge" style="background-color: ${severityColor}; margin-left: 10px; font-size: 0.8em;">
              ${vitals.severity ? vitals.severity.toUpperCase() : 'N/A'}
            </span>
          </div>
          <div class="summary-box">
            <p style="margin: 0; line-height: 1.6;">${aiSummary}</p>
          </div>
          ${vitals.recommendations && vitals.recommendations.length > 0 ? `
          <div style="margin-top: 15px;">
            <div class="label">Recommendations</div>
            <ul class="recommendations">
              ${vitals.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>

        <div class="inference-tag">${inferenceLabel}</div>

        <div class="footer">
          <p><strong>Pocket Doctor</strong> - AI Wellness Companion</p>
          <p>⚠️ This is not a medical diagnosis. Please consult a healthcare professional for medical concerns.</p>
        </div>
      </body>
    </html>
  `;

    try {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('✅ PDF generated at:', uri);
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
        console.error('❌ Failed to generate or share PDF:', error);
    }
};
