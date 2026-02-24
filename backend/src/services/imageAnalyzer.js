const fs = require('fs');
const path = require('path');

async function analyzeImage(imagePath) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Detect MIME type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const prompt = `You are an expert agricultural plant pathologist. Analyze this plant image carefully.

If the plant appears diseased, identify the disease and provide detailed information.
If the plant appears healthy, indicate that.

Respond ONLY with valid JSON (no markdown, no code fences, no extra text) in this exact format:
{
  "isHealthy": false,
  "diseaseName": "Disease Name",
  "cropName": "Crop Name",
  "confidence": 85,
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "treatment": ["treatment step 1", "treatment step 2", "treatment step 3"],
  "prevention": ["prevention tip 1", "prevention tip 2"],
  "organicTreatment": ["organic option 1", "organic option 2"],
  "pathogenType": "fungal",
  "severity": "moderate",
  "description": "Brief description of the disease and its impact on the crop"
}

Rules:
- "confidence" is 0-99 (your confidence in the diagnosis)
- "pathogenType" must be one of: "fungal", "bacterial", "viral", "nematode", "nutritional"
- "severity" must be one of: "mild", "moderate", "severe"
- If the plant is healthy, set "isHealthy": true and "diseaseName": "Healthy Plant"
- Include practical, actionable treatments relevant to Indian farming
- Include both chemical and organic treatment options`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text();

    // Strip markdown code fences if present
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.diseaseName) {
      return null;
    }

    return {
      isHealthy: parsed.isHealthy || false,
      diseaseName: parsed.diseaseName,
      cropName: parsed.cropName || 'Unknown',
      confidence: Math.min(Math.max(parseInt(parsed.confidence) || 50, 0), 99),
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      treatment: Array.isArray(parsed.treatment) ? parsed.treatment : [],
      prevention: Array.isArray(parsed.prevention) ? parsed.prevention : [],
      organicTreatment: Array.isArray(parsed.organicTreatment) ? parsed.organicTreatment : [],
      pathogenType: parsed.pathogenType || 'unknown',
      severity: parsed.severity || 'moderate',
      description: parsed.description || '',
    };
  } catch (err) {
    console.warn('Image analysis failed:', err.message);
    return null;
  }
}

module.exports = { analyzeImage };
