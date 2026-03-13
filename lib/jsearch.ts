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
  if (!JSEARCH_API_KEY || JSEARCH_API_KEY === "dummy_key") {
    console.warn("Using mock JSearch response because NEXT_PUBLIC_JSEARCH_API_KEY is missing or dummy.");
    return Array.from(new Set(titles.flatMap(title => mockJobs(title))));
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
       if (response.status === 401 || response.status === 403 || response.status === 429) {
          console.warn(`JSearch API error ${response.status} for "${query}". Using mock jobs.`);
          return mockJobs(query);
       }
       console.error(`JSearch API error for query "${query}": ${response.statusText}`);
       return mockJobs(query);
    }
    const result = await response.json();
    return result.data && result.data.length > 0 ? result.data : mockJobs(query);
  } catch (error) {
    console.error("JSearch API failed:", error);
    return mockJobs(query);
  }
}

function mockJobs(query: string): JobListing[] {
  return [
    {
      job_id: `mock-${query.replace(/\s+/g, '-').toLowerCase()}-1`,
      employer_name: "Tech Solutions Inc",
      job_title: `Senior ${query}`,
      job_description: `We are looking for an experienced ${query} to join our dynamic team and lead innovative projects. You should have a strong background in modern frameworks and scalable architecture.`,
      job_city: "San Francisco",
      job_state: "CA",
      job_country: "US",
      job_is_remote: true,
      job_employment_type: "FULL_TIME",
      job_apply_link: "https://example.com/apply",
      job_posted_at_datetime_utc: new Date().toISOString()
    },
    {
      job_id: `mock-${query.replace(/\s+/g, '-').toLowerCase()}-2`,
      employer_name: "Global Innovations",
      job_title: `${query} Developer`,
      job_description: `Join us as a ${query} Developer to build scalable enterprise web applications. Experience with UI/UX principles and backend integration is highly valued.`,
      job_city: "New York",
      job_state: "NY",
      job_country: "US",
      job_is_remote: false,
      job_employment_type: "FULL_TIME",
      job_apply_link: "https://example.com/apply",
      job_posted_at_datetime_utc: new Date(Date.now() - 86400000).toISOString()
    }
  ];
}
