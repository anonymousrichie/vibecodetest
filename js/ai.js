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
        
        Respond ONLY with the JSON array.
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
            throw new Error(errorData.error?.message || 'Gemini API Error');
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text.trim();
        return JSON.parse(content);
    } catch (error) {
        console.error('Gemini Extraction Error:', error);
        throw new Error('Failed to extract tasks. Check your connection and Gemini API key.');
    }
}
