"use client";
import { useEffect, useState, useMemo } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, Search, Briefcase, MapPin, Map, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { getSessionData, setSessionData } from "@/lib/sessionStore";
import { generateJobProfile } from "@/lib/gemini";
import { fetchJobsForTitles, JobListing } from "@/lib/jsearch";

export default function JobsPage() {
  const { user } = useMockAuth();
  const router = useRouter();

  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any | null>(null);

  const [loadingStep, setLoadingStep] = useState<number>(0);
  // 0 = none, 1 = "Reading your resume", 2 = "Searching live job listings", 3 = "Ranking by relevance"

  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [jobType, setJobType] = useState("All Types");
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [datePosted, setDatePosted] = useState("Any Time");
  const [minMatch, setMinMatch] = useState(0);
  const [location, setLocation] = useState("");

  const hasApiKey = !!process.env.NEXT_PUBLIC_JSEARCH_API_KEY;

  useEffect(() => {
    if (user === null) router.push("/");
    const stored = localStorage.getItem("resumerefine_saved_resumes");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSavedResumes(parsed);
      if (parsed.length > 0) setActiveResume(parsed[0]);
    }

    // Try restoring from session
    const cachedProfile = getSessionData("jobs_profile");
    const cachedJobs = getSessionData("jobs_results");
    if (cachedProfile && cachedJobs) {
      setProfile(cachedProfile);
      setJobs(cachedJobs);
    }
  }, [user, router]);

  const handleUploadTemp = (e: React.ChangeEvent<HTMLInputElement>) => {
    // A dummy mock representation since true parsing takes components/UploadZone logic.
    // For brevity, we just use the name here, but typically you'd abstract the parser.
    if (e.target.files && e.target.files[0]) {
      alert("For the temp upload to work, we'd fire the Parse logic. Using existing for now.");
    }
  };

  const handleFindJobs = async () => {
    if (!activeResume) return;
    setLoadingStep(1);

    try {
      // 1. AI Analysis
      const p = await generateJobProfile(activeResume.rawText);
      setProfile(p);
      setLoadingStep(2);

      // 2. Fetch Jobs
      const rawJobs = await fetchJobsForTitles(p.jobTitles);
      setLoadingStep(3);

      // 3. Score & Rank
      const scoredJobs = rawJobs.map((job: any) => {
        const descLower = (job.job_description || "").toLowerCase();
        const matchedSkills = (p.skills || []).filter((s: string) => descLower.includes(s.toLowerCase()));
        const score = Math.round((matchedSkills.length / Math.max(p.skills.length, 1)) * 100);

        let explanation = "";
        for (const title of p.jobTitles) {
          if (job.job_title.toLowerCase().includes(title.toLowerCase())) {
            explanation = p.fitExplanations[title];
            break;
          }
        }
        if (!explanation && p.jobTitles.length > 0) explanation = p.fitExplanations[p.jobTitles[0]];

        return { ...job, matchScore: score, matchedSkills, fitExplanation: explanation };
      });

      const sorted = scoredJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 30);

      setJobs(sorted);
      setSessionData("jobs_profile", p);
      setSessionData("jobs_results", sorted);

      // Finish
      setTimeout(() => setLoadingStep(0), 1000);
    } catch (e) {
      console.error(e);
      alert("Failed to find jobs. Check API keys or console.");
      setLoadingStep(0);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (minMatch > 0 && (job.matchScore || 0) < minMatch) return false;
      if (isRemoteOnly && !job.job_is_remote) return false;
      if (searchQuery && !job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) && !job.employer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Simple date posted logic (JSearch returns UTC text often, but let's assume filtering relies on text or basic checks)
      // For real implementations, compare `job_posted_at_datetime_utc`

      if (location && !isRemoteOnly) {
        if (location === "Remote") {
          if (!job.job_is_remote) return false;
        } else {
          const locString = `${job.job_city} ${job.job_state} ${job.job_country}`.toLowerCase();
          if (!locString.includes(location.toLowerCase())) return false;
        }
      }

      const typeRaw = (job.job_employment_type || "").toLowerCase();
      if (jobType === "Full-time" && !typeRaw.includes("fulltime") && !typeRaw.includes("full_time")) return false;
      if (jobType === "Part-time" && !typeRaw.includes("parttime") && !typeRaw.includes("part_time")) return false;
      if (jobType === "Contract" && !typeRaw.includes("contract")) return false;

      return true;
    });
  }, [jobs, minMatch, isRemoteOnly, searchQuery, location, jobType, datePosted]);

  if (!user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-foreground flex">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {!hasApiKey && (
          <div className="w-full bg-amber-500/10 border-b border-amber-500/30 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500 mb-1">JSearch API Key Missing</p>
              <p className="text-amber-500/80 mb-2">You need to set <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-400">NEXT_PUBLIC_JSEARCH_API_KEY</code> in your <code className="bg-amber-500/20 px-1 py-0.5 rounded text-amber-400">.env.local</code> file.</p>
              <a href="https://rapidapi.com/letscrape-6baf62026910d/api/jsearch" target="_blank" rel="noreferrer" className="text-amber-400 underline hover:text-amber-300">Get your free key here</a> and restart the server.
            </div>
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto p-8 md:p-12">
          {/* Resume Source Banner */}
          {savedResumes.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-8 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <FileText className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Active Resume Profile</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    {activeResume?.name} <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">Score: {activeResume?.atsScore}</span>
                  </p>
                </div>
              </div>
              <label className="text-sm text-muted-foreground hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> Use different resume
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleUploadTemp} />
              </label>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-white/5"><FileText className="w-8 h-8 text-muted-foreground" /></div>
              </div>
              <h3 className="text-xl font-medium tracking-wide mb-2">No resumes found</h3>
              <p className="text-muted-foreground font-light mb-6">Upload a resume on the dashboard to start matching with jobs.</p>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="border-amber-500/50 text-amber-500">Go to Dashboard</Button>
            </div>
          )}

          {/* Action / Loading State */}
          {loadingStep > 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-8" />
              <div className="w-full max-w-md space-y-4">
                {[
                  { step: 1, label: "Reading your resume (AI)" },
                  { step: 2, label: "Searching live job listings" },
                  { step: 3, label: "Ranking by relevance" }
                ].map(s => (
                  <div key={s.step} className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className={loadingStep >= s.step ? "text-amber-500 font-medium" : "text-muted-foreground"}>{s.label}</span>
                      {loadingStep > s.step && <span className="text-amber-500">Done</span>}
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-amber-500"
                        initial={{ width: "0%" }}
                        animate={{ width: loadingStep > s.step ? "100%" : loadingStep === s.step ? "60%" : "0%" }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex justify-center my-12">
              <Button onClick={handleFindJobs} size="lg" disabled={!activeResume || !hasApiKey} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-6 text-lg rounded-xl shadow-[0_0_20px_-5px_#f59e0b] group">
                <Sparkles className="w-5 h-5 mr-3 group-hover:animate-pulse" /> Find Jobs for Me
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-light tracking-tight">Your Matches</h2>
                <Button onClick={handleFindJobs} variant="ghost" className="text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">
                  Refresh Results
                </Button>
              </div>

              {/* AI Insight Banner */}
              {profile && (
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 p-6 rounded-r-xl mb-8">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1 leading-snug">{profile.summary}</p>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-3">
                        Showing results for:
                        {profile.jobTitles.map((t: string, i: number) => (
                          <span key={i} className="text-amber-500/90 font-medium">{t}{i < profile.jobTitles.length - 1 ? " • " : ""}</span>
                        ))}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-white font-medium">{profile.experienceLevel} Level</span>
                        {profile.skills.slice(0, 5).map((s: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 rounded border border-white/10 text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Bar */}
              <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl mb-8 flex flex-wrap gap-4 items-center">
                <div className="relative border-r border-white/5 pr-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter by keyword..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 w-48 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 border-r border-white/5 pr-4">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <select value={jobType} onChange={e => setJobType(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer">
                    <option value="All Types" className="bg-black">All Types</option>
                    <option value="Full-time" className="bg-black">Full-time</option>
                    <option value="Part-time" className="bg-black">Part-time</option>
                    <option value="Contract" className="bg-black">Contract</option>
                  </select>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsRemoteOnly(!isRemoteOnly)}
                  className={`h-9 text-sm ${isRemoteOnly ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 hover:text-amber-400" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}
                  >
                Remote Only
              </Button>
              <div className="flex items-center gap-3 ml-auto border-l border-white/5 pl-4">
                <span className="text-xs text-muted-foreground">Match &gt; {minMatch}%</span>
                <input
                  type="range" min="0" max="100" step="10"
                  value={minMatch} onChange={e => setMinMatch(parseInt(e.target.value))}
                  className="accent-amber-500 w-24 cursor-pointer"
                />
              </div>
            </div>

               {/* Location Quick Select */}
          <div className="flex items-center gap-2 mb-8">
            <MapPin className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-sm text-muted-foreground mr-2">Location:</span>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Type city..." className="bg-transparent border-b border-white/20 text-sm pb-1 w-32 focus:outline-none focus:border-amber-500 mr-2" />
            {["Remote", "New York", "San Francisco", "London"].map(loc => (
              <button key={loc} onClick={() => setLocation(loc)} className={`text-xs px-2.5 py-1 rounded-full border ${location === loc ? "border-amber-500 text-amber-500 bg-amber-500/10" : "border-white/10 text-muted-foreground hover:bg-white/5"} transition-colors`}>
            {loc}
          </button>
                  ))}
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground font-light text-lg">No jobs match your exact filters.</div>
          ) : null}

          {filteredJobs.map((job) => (
                    <div key={job.job_id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col group hover:border-amber-500/20 transition-all flex h-[380px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                       
                       <div className="flex gap-4 items-start mb-4">
                          {job.employer_logo ? (
                            <img src={job.employer_logo} alt={job.employer_name} className="w-12 h-12 rounded shadow-sm shrink-0 object-contain bg-white" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-amber-500/10 text-amber-500 shrink-0 flex items-center justify-center font-bold text-lg">
                              {job.employer_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pr-12 relative">
                             <h3 className="font-medium text-lg leading-tight truncate text-white" title={job.job_title}>{job.job_title}</h3>
                             <p className="text-sm text-foreground/70 truncate">{job.employer_name}</p>
                             
                             {/* Match Badge Top Right */}
                             <div className={`absolute -top-1 -right-1 flex items-center justify-center w-10 h-10 rounded-full border-2 ${(job.matchScore || 0) >= 80 ? "border-green-500/30 text-green-500" : (job.matchScore || 0) >= 50 ? "border-amber-500/30 text-amber-500" : "border-white/10 text-muted-foreground"} font-bold text-xs`}>
                                {job.matchScore}%
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-2 mb-4 shrink-0">
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted-foreground flex items-center gap-1">
                             {job.job_is_remote ? <Map className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                             {job.job_is_remote ? 'Remote' : `${job.job_city || ''} ${job.job_state || ''}`.trim() || 'Unspecified'}
                          </span>
                          {job.job_employment_type && (
                             <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted-foreground">
                               {job.job_employment_type.replace('_', ' ')}
                             </span>
                          )}
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted-foreground ml-auto">
                            {/* Dummy time for demonstration if API missing */}
                            {job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString() : '2 days ago'}
                          </span>
                       </div>

                       {/* Matched Skills Pilles */ }
            < div className = "flex flex-wrap gap-1.5 mb-4 shrink-0 max-h-[50px] overflow-hidden" >
            {
              job.matchedSkills?.map((skill, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-500/90 whitespace-nowrap">
                  {skill}
                </span>
              ))
            }
                       </div>

        <p className="text-sm text-muted-foreground font-light line-clamp-2 mb-auto" title={job.job_description}>
          {job.job_description}
        </p>

        <div className="border-t border-white/5 pt-4 mt-4">
          <p className="text-xs text-amber-500/80 italic line-clamp-2 mb-4 leading-relaxed">
            "{job.fitExplanation}"
          </p>
          <Button
            onClick={() => window.open(job.job_apply_link, '_blank')}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            Apply Now
          </Button>
        </div>

    </div>
  ))
}
               </div >
            </div >
          )}
        </div >
      </main >
    </div >
  );
}
