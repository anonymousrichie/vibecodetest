import { OPENAI_API_KEY } from './config.js';

export async function extractTasksFromText(text) {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
        throw new Error('OpenAI API Key not configured. Check js/config.js');
    }

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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        // Remove markdown code blocks if present
        const jsonString = content.replace(/```json|```/g, '');
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('AI Extraction Error:', error);
        throw new Error('Failed to extract tasks. Check your connection and API key.');
    }
}
