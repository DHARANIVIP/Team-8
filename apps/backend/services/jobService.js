import axios from 'axios';

/**
 * Service to aggregate job data from LinkedIn, Indeed, Adzuna, and JSearch APIs.
 */

export const getLiveJobDemand = async (careerTitle, location = 'us') => {
  try {
    // Example: Using Adzuna API
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;
    
    if (!appId || !apiKey) {
      console.warn('⚠️ Adzuna credentials missing, returning mock demand data.');
      return { totalJobs: 1500, averageSalary: 85000 };
    }

    // This would be a real API call
    // const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/${location}/search/1?app_id=${appId}&app_key=${apiKey}&what=${encodeURIComponent(careerTitle)}`);
    // return { totalJobs: response.data.count, averageSalary: response.data.mean_salary };

    return { totalJobs: 1500, averageSalary: 85000 }; // Mocked for now
  } catch (error) {
    console.error('Error fetching job demand:', error.message);
    return null;
  }
};

export const extractRequiredSkills = async (careerTitle) => {
  try {
    // Example: Using JSearch API via RapidAPI to fetch job descriptions
    // and passing them to an LLM to extract common skills.
    return ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'];
  } catch (error) {
    console.error('Error extracting skills:', error.message);
    return [];
  }
};
