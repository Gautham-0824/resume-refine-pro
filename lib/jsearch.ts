const JSEARCH_API_KEY = process.env.NEXT_PUBLIC_JSEARCH_API_KEY;

export interface JobListing {
  job_id: string;
  employer_name: string;
  employer_logo?: string;
  job_title: string;
  job_description: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_apply_link: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  // Injected locally
  matchScore?: number;
  matchedSkills?: string[];
  fitExplanation?: string;
}

export async function fetchJobsForTitles(titles: string[]): Promise<JobListing[]> {
  if (!JSEARCH_API_KEY) {
    throw new Error("NEXT_PUBLIC_JSEARCH_API_KEY is not set");
  }

  // Fetch jobs for all 3 titles concurrently
  const fetchPromises = titles.map(title => fetchJobsFromAPI(title));
  
  try {
    const resultsArrays = await Promise.all(fetchPromises);
    
    // Combine arrays
    let combined: JobListing[] = [];
    resultsArrays.forEach(arr => {
      combined = [...combined, ...arr];
    });

    // Deduplicate by job_id
    const uniqueJobsMap = new Map<string, JobListing>();
    combined.forEach(job => {
      if (job.job_id && !uniqueJobsMap.has(job.job_id)) {
        uniqueJobsMap.set(job.job_id, job);
      }
    });

    return Array.from(uniqueJobsMap.values());
  } catch (error) {
    console.error("Failed to fetch jobs array:", error);
    return []; // Return empty array or throw? UI wants to handle it. Let's throw so UI can show error.
  }
}

async function fetchJobsFromAPI(query: string): Promise<JobListing[]> {
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=2&date_posted=all`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': JSEARCH_API_KEY!,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
       console.error(`JSearch API error for query "${query}": ${response.statusText}`);
       return [];
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
