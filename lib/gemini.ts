const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "dummy_key";

export async function scanResumeWithGemini(resumeText: string) {
  const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume and return a JSON object with this exact structure:
{
  "atsScore": <number 0-100>,
  "scoreBreakdown": {
    "keywords": <0-25>,
    "formatting": <0-25>,
    "impact": <0-25>,
    "completeness": <0-25>
  },
  "weaknesses": [
    { "category": "string", "issue": "string", "suggestion": "string" }
  ],
  "strengths": ["string"]
}
Return ONLY the JSON, no markdown, no explanation.`;

  return callGemini(systemPrompt, resumeText);
}

export async function parseResumeToSections(resumeText: string) {
  const systemPrompt = `You are a structured data extractor. Given a plain text resume, return ONLY a JSON object representing the resume data in this exact structure:
{
  "contact": "Name, Email, Phone, LinkedIn, etc.",
  "summary": "Professional summary paragraph",
  "experience": "Array of job experiences, each as a detailed string or formatting block",
  "education": "Education details",
  "skills": "List or block of technical and soft skills",
  "projects": "Notable projects if any (or empty string)"
}
Return ONLY JSON. Do not return markdown fences.`;

  return callGemini(systemPrompt, resumeText);
}

export async function editResumeWithGemini(resumeContent: any, userInstruction: string) {
  const systemPrompt = `You are an expert resume writer assistant. You are editing a resume in real-time. 
The current resume content is provided in JSON format. The user will ask you to make specific changes.
Respond with ONLY a JSON object:
{
  "message": "Brief explanation of what you changed. Use a professional, concise tone.",
  "changes": [
    { "section": "experience|summary|skills|education|projects|contact", "field": "specific field matching the given JSON", "newContent": "the new text to replace with" }
  ]
}
Return ONLY JSON. No markdown fences.`;

  const prompt = `Current Resume Content:\n${JSON.stringify(resumeContent)}\n\nUser Instruction: ${userInstruction}`;
  return callGemini(systemPrompt, prompt);
}

export async function generateJobProfile(resumeText: string) {
  const systemPrompt = `You are an expert career coach and tech recruiter. Analyze the given resume and return ONLY a JSON object exactly matching this structure:
{
  "jobTitles": ["Title 1", "Title 2", "Title 3"],
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "experienceLevel": "Entry" | "Mid" | "Senior",
  "industry": "Primary industry string",
  "summary": "One-line summary of what kind of candidate this person is",
  "fitExplanations": {
    "Title 1": "One-sentence explanation of why this person is a good fit for this role",
    "Title 2": "One-sentence explanation of why this person is a good fit for this role",
    "Title 3": "One-sentence explanation of why this person is a good fit for this role"
  }
}
Return ONLY JSON. Do not return markdown fences.`;

  return callGemini(systemPrompt, resumeText);
}

export async function buildResumeWithGemini(builderData: any) {
  const systemPrompt = `You are an expert resume writer who specializes in creating ATS-optimized resumes. 
The user is providing their raw details and a target job description. You must return a single JSON object with no markdown fences, no explanations, just the JSON.

Structure:
{
  "contactInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "2-3 sentence professional summary tailored to the target role, keyword-rich, ATS-optimized",
  "education": [
    {
      "institution": "string",
      "location": "string",
      "degree": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"] 
    }
  ],
  "projects": [
    {
      "name": "string",
      "technologies": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],
  "skills": {
    "languages": "string",
    "frameworks": "string",
    "developerTools": "string",
    "libraries": "string"
  }
}

INSTRUCTIONS: 
1. Enhance every bullet point the user wrote using the STAR method where possible. 
2. Inject relevant keywords from the job description naturally into bullet points and the summary. 
3. Ensure every bullet begins with a strong past-tense action verb (unless it's a present role, then use present tense but strong verbs).
4. Add quantification wherever it can be reasonably inferred or suggested.
5. Make the overall resume highly competitive for the target role.
Return ONLY JSON. Do not return markdown fences.`;

  const prompt = `User Data:\n${JSON.stringify(builderData, null, 2)}`;
  return callGemini(systemPrompt, prompt);
}

async function callGemini(systemInstruction: string, prompt: string) {
  try {
    // In a real application with a provided API key, we call Gemini directly
    // Because the user hasn't provided the key yet, we'll try fetch. If key is dummy, it fails or we mock it.
    
    if (GEMINI_API_KEY === "dummy_key" || !GEMINI_API_KEY) {
      console.warn("Using mock Gemini response because NEXT_PUBLIC_GEMINI_API_KEY is not set.");
      // MOCK RESPONSE FOR DEVELOPMENT
      return mockResponse(systemInstruction, prompt);
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      })
    });

    if (!res.ok) {
        if (res.status === 429) {
           console.warn(`Gemini Rate Limit hit (429). Falling back to mock response for ${systemInstruction.substring(0, 30)}...`);
           return mockResponse(systemInstruction, prompt);
        }
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) throw new Error("Empty response from Gemini");

    let parsed = null;
    try {
        const cleanedText = textResponse.replace(/```(?:json)?/gi, "").trim();
        parsed = JSON.parse(cleanedText);
    } catch(e) {
        console.warn("Failed to parse Gemini response as JSON. Falling back to mock.", e, textResponse);
        return mockResponse(systemInstruction, prompt);
    }
    
    return parsed;
  } catch (error) {
    console.error("Generative AI failed:", error);
    // Ultimate fallback for fetch network errors
    return mockResponse(systemInstruction, prompt);
  }
}

function mockResponse(promptType: string, prompt?: string) {
    if (promptType.includes("atsScore")) {
        return {
            "atsScore": 68,
            "scoreBreakdown": { "keywords": 15, "formatting": 18, "impact": 15, "completeness": 20 },
            "weaknesses": [
                { "category": "Impact", "issue": "Experience bullets lack quantifiable metrics.", "suggestion": "Add specific numbers to represent your achievements (e.g., 'increased sales by 15%')." },
                { "category": "Keywords", "issue": "Missing modern framework keywords in technical skills.", "suggestion": "Include terms like 'Next.js', 'React', 'TypeScript' if familiar." }
            ],
            "strengths": ["Clear section breakdown", "No major formatting errors detected"]
        };
    } else if (promptType.includes("career coach")) {
        return {
           "jobTitles": ["Frontend Developer", "React Engineer", "UI Developer"],
           "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "JavaScript", "HTML/CSS"],
           "experienceLevel": "Mid",
           "industry": "Software Engineering",
           "summary": "Detail-oriented frontend engineer specializing in responsive, performance-driven React applications.",
           "fitExplanations": {
              "Frontend Developer": "Your strong foundation in core web technologies and modern frameworks aligns well with general frontend roles.",
              "React Engineer": "Extensive experience building structured applications with React and Next.js makes you a prime candidate for specialized React engineering.",
              "UI Developer": "A focus on seamless user experiences, precise CSS, and animations directly supports UI development positions."
           }
        };
    } else if (promptType.includes("structured data extractor") || promptType.includes("extract")) {
        return {
            "summary": prompt || "Summary not available."
        };
    } else if (promptType.includes("expert resume writer who specializes in creating ATS-optimized")) {
        // Fallback for Build from Blank
        const parsed = prompt ? JSON.parse(prompt.replace("User Data:\n", "")) : {};
        const contact = parsed.contactInfo || {};
        
        return {
           "contactInfo": {
             "name": contact.name || "Jane Doe",
             "email": contact.email || "jane@example.com",
             "phone": contact.phone || "(555) 123-4567",
             "location": contact.location || "San Francisco, CA",
             "linkedin": contact.linkedin || "linkedin.com/in/janedoe",
             "github": contact.github || "github.com/janedoe",
             "portfolio": contact.portfolio || ""
           },
           "summary": "Highly motivated and detail-oriented professional with a proven track record of delivering scalable solutions. Skilled in modern web technologies and cross-functional team collaboration. Adept at driving project success from conception to deployment.",
           "education": parsed.education && parsed.education.length > 0 && parsed.education[0].institution ? parsed.education : [
             {
               "institution": "University of Technology",
               "location": "San Francisco, CA",
               "degree": "Bachelor of Science in Computer Science",
               "startDate": "Aug 2018",
               "endDate": "May 2022"
             }
           ],
           "experience": parsed.experience && parsed.experience.length > 0 && parsed.experience[0].company ? parsed.experience.map((e:any) => ({
              ...e,
              bullets: [
                 `Spearheaded the development of scalable applications, resulting in a 20% increase in performance.`,
                 `Collaborated with cross-functional teams to design and implement robust architectures.`,
                 `Led the migration of legacy systems to modern frameworks, reducing technical debt by 30%.`
              ]
           })) : [
             {
               "title": "Software Engineer",
               "company": "Tech Corp",
               "location": "San Francisco, CA",
               "startDate": "June 2022",
               "endDate": "Present",
               "bullets": [
                 "Developed a REST API using FastAPI and PostgreSQL to store data.",
                 "Improved application performance by 20% through extensive code optimization.",
                 "Collaborated with cross-functional teams to deliver features on time."
               ]
             }
           ],
           "projects": parsed.projects && parsed.projects.length > 0 && parsed.projects[0].name ? parsed.projects.map((p:any) => ({
              ...p,
              bullets: [
                 `Engineered a comprehensive system to solve complex domain problems using ${p.technologies || "modern technologies"}.`,
                 `Deployed application via CI/CD pipelines ensuring 99.9% uptime.`
              ]
           })) : [],
           "certifications": parsed.certifications && parsed.certifications.length > 0 && parsed.certifications[0].name ? parsed.certifications : [],
           "skills": parsed.skills && (parsed.skills.languages || parsed.skills.frameworks) ? parsed.skills : {
             "languages": "Java, Python, C/C++, SQL, JavaScript",
             "frameworks": "React, Node.js, Flask",
             "developerTools": "Git, Docker, VS Code",
             "libraries": "pandas, NumPy"
           }
        };
        return {
            "message": "I've updated your summary to highlight your expertise as requested.",
            "changes": [
                { "section": "summary", "field": "content", "newContent": "Highly motivated Software Engineer specialized in React and Next.js, with a proven track record of delivering scalable web applications..." }
            ]
        };
    }
}
