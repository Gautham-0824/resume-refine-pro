"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/hooks/useMockAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import { setSessionData } from "@/lib/sessionStore";
import { buildResumeWithGemini } from "@/lib/gemini";

export default function BuilderPage() {
  const { user } = useMockAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0=none, 1=Analyzing, 2=Tailoring, 3=Optimizing, 4=Formatting

  useEffect(() => {
    if (user === null) router.push("/");
  }, [user, router]);

  // FORM STATE
  const [contact, setContact] = useState({
    name: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: ""
  });

  const [experience, setExperience] = useState([
    { title: "", company: "", location: "", startDate: "", endDate: "", isPresent: false, bullets: "" }
  ]);

  const [education, setEducation] = useState([
    { degree: "", institution: "", location: "", startDate: "", endDate: "" }
  ]);

  const [projects, setProjects] = useState([
    { name: "", technologies: "", startDate: "", endDate: "", isPresent: false, bullets: "" }
  ]);

  const [certifications, setCertifications] = useState([
    { name: "", issuer: "", date: "" }
  ]);

  const [skills, setSkills] = useState({
    languages: "", frameworks: "", developerTools: "", libraries: ""
  });

  const [targetRole, setTargetRole] = useState({
    jobTitle: "", jobDescription: ""
  });

  // Handlers for repeatable sections
  const addExperience = () => setExperience([...experience, { title: "", company: "", location: "", startDate: "", endDate: "", isPresent: false, bullets: "" }]);
  const removeExperience = (index: number) => setExperience(experience.filter((_, i) => i !== index));
  const updateExperience = (index: number, field: string, value: any) => {
    const newExp = [...experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setExperience(newExp);
  };

  const addEducation = () => setEducation([...education, { degree: "", institution: "", location: "", startDate: "", endDate: "" }]);
  const removeEducation = (index: number) => setEducation(education.filter((_, i) => i !== index));
  const updateEducation = (index: number, field: string, value: any) => {
    const newEd = [...education];
    newEd[index] = { ...newEd[index], [field]: value };
    setEducation(newEd);
  };

  const addProject = () => setProjects([...projects, { name: "", technologies: "", startDate: "", endDate: "", isPresent: false, bullets: "" }]);
  const removeProject = (index: number) => setProjects(projects.filter((_, i) => i !== index));
  const updateProject = (index: number, field: string, value: any) => {
    const newProj = [...projects];
    newProj[index] = { ...newProj[index], [field]: value };
    setProjects(newProj);
  };

  const addCertification = () => setCertifications([...certifications, { name: "", issuer: "", date: "" }]);
  const removeCertification = (index: number) => setCertifications(certifications.filter((_, i) => i !== index));
  const updateCertification = (index: number, field: string, value: any) => {
    const newCert = [...certifications];
    newCert[index] = { ...newCert[index], [field]: value };
    setCertifications(newCert);
  };

  const handleNextStep = () => {
    // Validate Step 1
    if (!contact.name || !contact.email) {
      alert("Name and Email are required.");
      return;
    }
    // Basic validation for experience/education (if they exist)
    for (const exp of experience) {
      if (exp.company && !exp.title) { alert("Please provide a job title for " + exp.company); return; }
      if (exp.title && !exp.company) { alert("Please provide a company for " + exp.title); return; }
    }
    for (const ed of education) {
       if (ed.degree && !ed.institution) { alert("Please provide an institution for " + ed.degree); return; }
    }

    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleGenerate = async () => {
    if (!targetRole.jobTitle) {
      alert("Job Title is required to target your resume.");
      return;
    }

    setIsGenerating(true);
    setLoadingStep(1);

    const builderData = {
      contactInfo: contact,
      experience,
      education,
      projects,
      certifications,
      skills,
      targetRole
    };
    
    // Simulate initial animation steps while API runs
    const t2 = setTimeout(() => setLoadingStep(2), 1500);
    const t3 = setTimeout(() => setLoadingStep(3), 3500);

    try {
      // Actually fetch the generated resume JSON
      const jsonResume = await buildResumeWithGemini(builderData);
      
      clearTimeout(t2);
      clearTimeout(t3);
      setLoadingStep(4);
      
      // Save everything to session storage
      setSessionData("builder_data", builderData);
      setSessionData("generated_resume", jsonResume);
      
      setTimeout(() => {
        router.push("/dashboard/preview");
      }, 1000);
      
    } catch (e) {
      console.error(e);
      alert("Failed to generate resume. Please try again.");
      setIsGenerating(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-black" />;

  // Full-page Loading State
  if (isGenerating) {
    const steps = [
      { step: 1, label: "Analyzing your details..." },
      { step: 2, label: "Tailoring content to your target role..." },
      { step: 3, label: "Optimizing for ATS keywords..." },
      { step: 4, label: "Formatting your resume..." }
    ];

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
        <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-8 relative z-10" />
        
        <div className="w-full max-w-md space-y-6 relative z-10 p-8 bg-[#0a0a0a]/50 border border-white/10 rounded-2xl backdrop-blur-xl">
          {steps.map(s => (
            <div key={s.step} className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className={loadingStep >= s.step ? "text-amber-500 font-medium" : "text-muted-foreground"}>{s.label}</span>
                {loadingStep > s.step && <span className="text-amber-500"><CheckCircle2 className="w-4 h-4" /></span>}
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                  initial={{ width: "0%" }}
                  animate={{ width: loadingStep > s.step ? "100%" : loadingStep === s.step ? "60%" : "0%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12 max-w-lg mx-auto">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step === 1 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : step > 1 ? 'bg-amber-500 text-black' : 'bg-white/5 text-muted-foreground'}`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
              </div>
              <span className="font-medium">Your Details</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${step > 1 ? 'bg-amber-500/50' : 'bg-white/10'}`} />
            
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step === 2 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-white/5 text-muted-foreground'}`}>
                2
              </div>
              <span className="font-medium">Target Role</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div>
                  <h1 className="text-3xl font-light tracking-tight mb-2">Build from Blank</h1>
                  <p className="text-muted-foreground font-light mb-8">Provide your details to generate a complete, ATS-optimized resume.</p>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-amber-500 mb-4 border-b border-white/10 pb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Full Name *</label>
                      <Input value={contact.name} onChange={e => setContact({...contact, name: e.target.value})} placeholder="Jane Doe" required />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Email Address *</label>
                      <Input type="email" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} placeholder="jane@example.com" required />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
                      <Input type="tel" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} placeholder="(555) 123-4567" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Location</label>
                      <Input value={contact.location} onChange={e => setContact({...contact, location: e.target.value})} placeholder="San Francisco, CA" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">LinkedIn URL</label>
                      <Input type="url" value={contact.linkedin} onChange={e => setContact({...contact, linkedin: e.target.value})} placeholder="linkedin.com/in/janedoe" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">GitHub URL</label>
                      <Input type="url" value={contact.github} onChange={e => setContact({...contact, github: e.target.value})} placeholder="github.com/janedoe" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="text-sm text-muted-foreground mb-1 block">Portfolio or Personal Website URL</label>
                       <Input type="url" value={contact.portfolio} onChange={e => setContact({...contact, portfolio: e.target.value})} placeholder="janedoe.com" />
                    </div>
                  </div>
                </div>

                {/* Work Experience */}
                <div>
                  <h3 className="text-lg font-medium text-amber-500 mb-4 border-b border-white/10 pb-2">Work Experience</h3>
                  <div className="space-y-6">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl relative group">
                        {experience.length > 1 && (
                          <button onClick={() => removeExperience(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div><label className="text-sm text-muted-foreground mb-1 block">Job Title *</label><Input value={exp.title} onChange={e => updateExperience(idx, 'title', e.target.value)} placeholder="Software Engineer" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Company Name *</label><Input value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} placeholder="Acme Corp" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Location</label><Input value={exp.location} onChange={e => updateExperience(idx, 'location', e.target.value)} placeholder="New York, NY" /></div>
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                               <label className="text-sm text-muted-foreground mb-1 block">Start Date</label>
                               <Input value={exp.startDate} onChange={e => updateExperience(idx, 'startDate', e.target.value)} placeholder="June 2020" />
                             </div>
                             <div>
                               <label className="text-sm text-muted-foreground mb-1 flex justify-between">
                                 End Date
                                 <label className="flex items-center gap-1 cursor-pointer">
                                   <input type="checkbox" checked={exp.isPresent} onChange={e => updateExperience(idx, 'isPresent', e.target.checked)} className="accent-amber-500" />
                                   <span className="text-xs">Present</span>
                                 </label>
                               </label>
                               <Input value={exp.endDate} onChange={e => updateExperience(idx, 'endDate', e.target.value)} disabled={exp.isPresent} placeholder={exp.isPresent ? "Present" : "May 2023"} className={exp.isPresent ? "opacity-50" : ""} />
                             </div>
                          </div>
                        </div>
                        <div>
                           <label className="text-sm text-muted-foreground mb-1 block">Responsibilities (One bullet per line)</label>
                           <Textarea 
                             value={exp.bullets} onChange={e => updateExperience(idx, 'bullets', e.target.value)} 
                             placeholder={"Developed a REST API using FastAPI and PostgreSQL...\nImproved performance by 20%...\nCollaborated with cross-functional teams..."}
                             className="min-h-[120px]"
                           />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addExperience} className="w-full border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-amber-500/50">
                      <Plus className="w-4 h-4 mr-2" /> Add Another Experience
                    </Button>
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-lg font-medium text-amber-500 mb-4 border-b border-white/10 pb-2">Education</h3>
                  <div className="space-y-6">
                    {education.map((ed, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl relative group">
                        {education.length > 1 && (
                          <button onClick={() => removeEducation(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2"><label className="text-sm text-muted-foreground mb-1 block">Degree and Field of Study</label><Input value={ed.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} placeholder="Bachelor of Arts in Computer Science, Minor in Business" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Institution Name *</label><Input value={ed.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} placeholder="Southwestern University" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Location</label><Input value={ed.location} onChange={e => updateEducation(idx, 'location', e.target.value)} placeholder="Georgetown, TX" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Start Date</label><Input value={ed.startDate} onChange={e => updateEducation(idx, 'startDate', e.target.value)} placeholder="Aug 2018" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">End Date</label><Input value={ed.endDate} onChange={e => updateEducation(idx, 'endDate', e.target.value)} placeholder="May 2021" /></div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addEducation} className="w-full border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-amber-500/50">
                      <Plus className="w-4 h-4 mr-2" /> Add Another Education
                    </Button>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h3 className="text-lg font-medium text-amber-500 mb-4 border-b border-white/10 pb-2">Projects</h3>
                  <div className="space-y-6">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl relative group">
                        <button onClick={() => removeProject(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div><label className="text-sm text-muted-foreground mb-1 block">Project Name *</label><Input value={proj.name} onChange={e => updateProject(idx, 'name', e.target.value)} placeholder="Gitlytics" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Technologies Used</label><Input value={proj.technologies} onChange={e => updateProject(idx, 'technologies', e.target.value)} placeholder="Python, Flask, React, PostgreSQL" /></div>
                          <div className="grid grid-cols-2 gap-2 md:col-span-2">
                             <div>
                               <label className="text-sm text-muted-foreground mb-1 block">Start Date</label>
                               <Input value={proj.startDate} onChange={e => updateProject(idx, 'startDate', e.target.value)} placeholder="June 2020" />
                             </div>
                             <div>
                               <label className="text-sm text-muted-foreground mb-1 flex justify-between">
                                 End Date
                                 <label className="flex items-center gap-1 cursor-pointer">
                                   <input type="checkbox" checked={proj.isPresent} onChange={e => updateProject(idx, 'isPresent', e.target.checked)} className="accent-amber-500" />
                                   <span className="text-xs">Present</span>
                                 </label>
                               </label>
                               <Input value={proj.endDate} onChange={e => updateProject(idx, 'endDate', e.target.value)} disabled={proj.isPresent} placeholder={proj.isPresent ? "Present" : "Aug 2020"} className={proj.isPresent ? "opacity-50" : ""} />
                             </div>
                          </div>
                        </div>
                        <div>
                           <label className="text-sm text-muted-foreground mb-1 block">Description (One bullet per line)</label>
                           <Textarea 
                             value={proj.bullets} onChange={e => updateProject(idx, 'bullets', e.target.value)} 
                             placeholder={"Developed a full-stack web application...\nImplemented GitHub OAuth...\nUsed Celery and Redis..."}
                             className="min-h-[100px]"
                           />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addProject} className="w-full border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-amber-500/50">
                      <Plus className="w-4 h-4 mr-2" /> Add Project
                    </Button>
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h3 className="text-lg font-medium text-amber-500 mb-4 border-b border-white/10 pb-2">Certifications</h3>
                  <div className="space-y-6">
                    {certifications.map((cert, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl relative group">
                        <button onClick={() => removeCertification(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div><label className="text-sm text-muted-foreground mb-1 block">Certification Name</label><Input value={cert.name} onChange={e => updateCertification(idx, 'name', e.target.value)} placeholder="AWS Certified Developer" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Issuing Organization</label><Input value={cert.issuer} onChange={e => updateCertification(idx, 'issuer', e.target.value)} placeholder="Amazon Web Services" /></div>
                          <div><label className="text-sm text-muted-foreground mb-1 block">Date Obtained</label><Input value={cert.date} onChange={e => updateCertification(idx, 'date', e.target.value)} placeholder="Oct 2022" /></div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addCertification} className="w-full border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-amber-500/50">
                      <Plus className="w-4 h-4 mr-2" /> Add Certification
                    </Button>
                  </div>
                </div>

                {/* Technical Skills */}
                <div>
                  <h3 className="text-lg font-medium text-amber-500 mb-4 border-b border-white/10 pb-2">Technical Skills</h3>
                  <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl space-y-4">
                     <div><label className="text-sm text-muted-foreground mb-1 block">Languages</label><Input value={skills.languages} onChange={e => setSkills({...skills, languages: e.target.value})} placeholder="Java, Python, C/C++, SQL, JavaScript" /></div>
                     <div><label className="text-sm text-muted-foreground mb-1 block">Frameworks</label><Input value={skills.frameworks} onChange={e => setSkills({...skills, frameworks: e.target.value})} placeholder="React, Node.js, Flask, FastAPI" /></div>
                     <div><label className="text-sm text-muted-foreground mb-1 block">Developer Tools</label><Input value={skills.developerTools} onChange={e => setSkills({...skills, developerTools: e.target.value})} placeholder="Git, Docker, VS Code, Google Cloud Platform" /></div>
                     <div><label className="text-sm text-muted-foreground mb-1 block">Libraries</label><Input value={skills.libraries} onChange={e => setSkills({...skills, libraries: e.target.value})} placeholder="pandas, NumPy, Matplotlib" /></div>
                  </div>
                </div>

                {/* Next Step Button */}
                <div className="flex justify-end pt-8">
                   <Button onClick={handleNextStep} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-6 text-lg rounded-xl shadow-[0_0_20px_-5px_#f59e0b] group">
                     Next: Target Role <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-light tracking-tight mb-2">What role are you targeting?</h1>
                  <p className="text-muted-foreground font-light mb-8">This helps Gemini tailor your resume&apos;s language, keywords, and bullet points to match the specific job.</p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl space-y-6">
                  <div>
                    <label className="text-sm font-medium text-amber-500 mb-2 block">Job Title *</label>
                    <Input value={targetRole.jobTitle} onChange={e => setTargetRole({...targetRole, jobTitle: e.target.value})} placeholder="e.g. Senior Software Engineer at Google" className="text-lg py-6" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-500 mb-2 block">Job Description (optional)</label>
                    <Textarea 
                      value={targetRole.jobDescription} onChange={e => setTargetRole({...targetRole, jobDescription: e.target.value})}
                      placeholder="Paste the full job description here. The more detail you give, the better Gemini can tailor your resume's language, keywords, and bullet points to match this specific role." 
                      className="min-h-[200px]"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground/70 italic">
                    Gemini will use your details from Step 1 and this job target to write strong, ATS-optimized bullet points, a powerful summary, and keyword-rich skills tailored to this role.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-8">
                   <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground hover:text-white">
                     ← Back to Details
                   </Button>
                   <Button onClick={handleGenerate} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-6 text-lg rounded-xl shadow-[0_0_20px_-5px_#f59e0b] group">
                     Generate My Resume <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </main>
    </div>
  );
}
