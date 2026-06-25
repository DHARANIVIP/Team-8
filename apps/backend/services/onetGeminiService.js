import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Standardize prompt querying for structured JSON data.
 */
async function generateJSON(prompt, systemInstruction) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const modelsToTry = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-pro',
    'gemini-1.0-pro'
  ];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 Attempting Generative AI query using model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.warn(`⚠️ Model "${modelName}" failed. Error:`, error.message || error);
      lastError = error;
    }
  }

  throw lastError;
}

/**
 * Fetch Career details according to O*NET and BLS standards.
 */
export async function getCareerDetails(careerName) {
  const systemInstruction = 'You are an O*NET and Bureau of Labor Statistics (BLS) data parser. Return only valid JSON.';
  const prompt = `Provide the occupational specification for: "${careerName}".
  Return a JSON object conforming exactly to this structure:
  {
    "name": "Exact standard name of the career",
    "description": "Short description of the career path",
    "icon": "A single representative emoji (e.g. 💻, 📊, 🎨)",
    "salary_range": "Salary range in Lakhs (INR), e.g. '₹8L – ₹25L'",
    "average_salary": 1600000, // integer INR
    "growth_rate": "Growth rate percentage, e.g. '28%'",
    "demand_level": "High, Medium, or Low",
    "top_companies": ["Company1", "Company2", "Company3"],
    "education_requirement": "Typical degree or bootcamp requirements",
    "work_environment": "Short summary of work settings, remote availability",
    "future_outlook": "Growth prospect details, future demand explanation"
  }`;

  try {
    return await generateJSON(prompt, systemInstruction);
  } catch (error) {
    console.warn(`Fallback to default metrics for: ${careerName}`);
    return {
      name: careerName,
      description: 'Explore opportunities in this field.',
      icon: '💼',
      salary_range: '₹6L – ₹18L',
      average_salary: 1000000,
      growth_rate: '15%',
      demand_level: 'Medium',
      top_companies: ['TCS', 'Infosys', 'Wipro'],
      education_requirement: 'Bachelor\'s Degree in related field',
      work_environment: 'Hybrid / Office settings',
      future_outlook: 'Steady demand expected across industries.'
    };
  }
}

/**
 * Fetch required skills for a target career according to O*NET specifications.
 */
export async function getCareerSkills(careerName) {
  const systemInstruction = 'You are an expert O*NET skills analyst. Return only valid JSON.';
  const prompt = `Map the key technical and soft skills required for the career: "${careerName}".
  Return a JSON array of skill objects matching this structure:
  [
    {
      "name": "Skill Name (e.g. Python, Figma, React)",
      "category": "Technical, Soft Skill, or Domain",
      "level": 80 // Integer between 10 and 100 representing importance/proficiency level
    }
  ]
  Provide exactly 6 to 10 of the most important skills.`;

  try {
    return await generateJSON(prompt, systemInstruction);
  } catch (error) {
    console.warn(`Fallback skills map for: ${careerName}`);
    return [
      { name: 'Communication', category: 'Soft Skill', level: 75 },
      { name: 'Problem Solving', category: 'Soft Skill', level: 80 }
    ];
  }
}

/**
 * Discover real online courses for a specific skill from Coursera, Udemy, edX, or YouTube.
 */
export async function discoverCoursesForSkill(skillName) {
  const systemInstruction = 'You are a course aggregation crawler. Verify that all course names and providers are real and links are correct. Return only valid JSON.';
  const prompt = `Find 3 to 5 real-world, popular online courses to learn the skill: "${skillName}".
  Return a JSON array of course objects matching this structure:
  [
    {
      "title": "Real course title (e.g. 'Python for Everybody')",
      "provider": "Coursera, Udemy, edX, or YouTube",
      "url": "A real hyperlink to the course page (or a standard anchor search url if exact is unavailable)",
      "difficulty": "Beginner, Intermediate, or Advanced",
      "price": "Free, Paid, or Subscription",
      "rating": 4.7, // decimal out of 5.0
      "duration_weeks": 8 // estimated weeks to finish
    }
  ]`;

  try {
    return await generateJSON(prompt, systemInstruction);
  } catch (error) {
    console.warn(`Fallback courses list for: ${skillName}`);
    return [
      {
        title: `Introduction to ${skillName}`,
        provider: 'Coursera',
        url: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`,
        difficulty: 'Beginner',
        price: 'Free',
        rating: 4.5,
        duration_weeks: 6
      }
    ];
  }
}
