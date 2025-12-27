// Utils for AI generation

async function generateWithAI(type, jobDescription, userResume, provider, config) {
    const systemPrompt = "You are an expert career coach and professional resume writer. You help candidates tailor their applications to specific job descriptions to maximize their chances of getting hired.";

    let userPrompt = "";

    if (type === 'resume') {
        userPrompt = `
      TASK: Rewrite the candidate's resume to target the specific job description below.
      
      GUIDELINES:
      1. ATS OPTIMIZATION: Use standard section headers (Summary, Experience, Skills, Education). Use keywords from the job description naturally.
      2. IMPACT: Focus on achievements and metrics.
      3. RELEVANCE: Highlight experience that matches the job requirements. Remove irrelevant details if necessary to keep it concise.
      4. FORMAT: Return plain text markdown.
      
      CANDIDATE RESUME:
      ${userResume}
      
      JOB DESCRIPTION:
      ${jobDescription}
    `;
    } else if (type === 'cover-letter') {
        userPrompt = `
      TASK: Write a compelling cover letter for this job application.
      
      GUIDELINES:
      1. HOOK: Start with a strong opening that shows enthusiasm and understanding of the company.
      2. ALIGNMENT: Connect the candidate's specific experiences to the job's key challenges.
      3. CULTURE FIT: Adopt a professional yet engaging tone that matches the likely culture of the company (analyze the JD for this).
      4. FORMAT: Standard cover letter format.
      
      CANDIDATE RESUME:
      ${userResume}
      
      JOB DESCRIPTION:
      ${jobDescription}
    `;
    } else if (type === 'email') {
        userPrompt = `
      TASK: Write a short, punchy outreach email to a recruiter or hiring manager.
      
      GUIDELINES:
      1. STRATEGY: Analyze if the candidate is a "Direct Fit" (perfect match) or "Pivot" (transferable skills).
         - If Direct Fit: Focus on "I have done exactly what you need X times."
         - If Pivot: Focus on "My background in X gives me a unique perspective on Y."
      2. SUBJECT LINE: Create 3 options for catchy subject lines.
      3. BODY: Keep it under 150 words. clear value proposition. Call to action.
      
      CANDIDATE RESUME:
      ${userResume}
      
      JOB DESCRIPTION:
      ${jobDescription}
    `;
    }

    // Dispatch to appropriate provider
    if (provider === 'ollama') {
        return await callOllamaAPI(systemPrompt, userPrompt, config);
    } else if (provider === 'gemini') {
        return await callGeminiAPI(systemPrompt, userPrompt, config);
    } else {
        return await callOpenAIAPI(systemPrompt, userPrompt, config);
    }
}

async function callOpenAIAPI(systemPrompt, userPrompt, config) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenAI API Error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI Error:', error);
        throw error;
    }
}

async function callGeminiAPI(systemPrompt, userPrompt, config) {
    try {
        // Using gemini-2.0-flash as confirmed available by user logs
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API Error');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini Error:', error);
        throw error;
    }
}

async function callOllamaAPI(systemPrompt, userPrompt, config) {
    try {
        const response = await fetch(`${config.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollamaModel,
                prompt: systemPrompt + "\n\n" + userPrompt,
                stream: false
            })
        });

        if (!response.ok) {
            console.error('Ollama Error Status:', response.status, response.statusText);
            const errText = await response.text();
            throw new Error(`Ollama API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Ollama Error:', error);
        throw new Error('Failed to connect to Ollama. Is it running?');
    }
}
