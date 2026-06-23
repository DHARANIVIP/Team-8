import axios from 'axios';

/**
 * Service to fetch industry news and financial health metrics
 */

export const getIndustryNews = async (industryCategory) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ NEWS_API_KEY missing, returning mock news.');
      return [{ title: `Latest trends in ${industryCategory}`, url: '#' }];
    }

    const response = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(industryCategory)}&apiKey=${apiKey}`);
    return response.data.articles.slice(0, 5); // Return top 5
  } catch (error) {
    console.error('Error fetching industry news:', error.message);
    return [];
  }
};

export const getCompanyStockHealth = async (companyName) => {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (!finnhubKey) {
      console.warn('⚠️ FINNHUB_API_KEY missing, returning mock stock data.');
      return { symbol: companyName, currentPrice: 150.0, trend: 'up' };
    }

    // Real API call would map companyName to a symbol, then fetch the quote
    // const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${finnhubKey}`);
    // return response.data;
    
    return { symbol: companyName, currentPrice: 150.0, trend: 'up' }; // Mocked for now
  } catch (error) {
    console.error('Error fetching stock health:', error.message);
    return null;
  }
};
