import { GEMINI_API_KEY } from './config.js';

export async function extractTasksFromText(text) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        throw new Error('Gemini API Key not configured. Check your .env file.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
        You are PanicPal, a student productivity assistant. 
        Extract tasks and deadlines from the following unstructured text.
        Text: "${text}"
        
        Return a JSON array of objects with these fields:
        - title (short, punchy name for the task)
        - deadline (ISO 8601 format, guess the year as 2026 if not specified)
        - priority (one of: low, medium, high, critical)
        
        Respond ONLY with the raw JSON array. Do not include markdown formatting or explanations.
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.error?.message || 'Gemini API Error';
            console.error('Gemini API Details:', errorData);
            throw new Error(errorMsg);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('Gemini returned no results. Try shorter text.');
        }

        let content = data.candidates[0].content.parts[0].text.trim();
        
        // Robust JSON parsing: remove markdown blocks if AI ignored "ResponseMimeType"
        if (content.startsWith('```')) {
            content = content.replace(/^```json\n?|```$/g, '').trim();
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse Gemini output:', content);
            throw new Error('AI returned an invalid format. Try again.');
        }
    } catch (error) {
        console.error('Gemini Extraction Error:', error);
        // Throw the specific message if it's one we generated, otherwise the generic one
        if (error.message.includes('API Key') || error.message.includes('invalid format')) {
            throw error;
        }
        throw new Error(`AI Error: ${error.message}`);
    }
}
