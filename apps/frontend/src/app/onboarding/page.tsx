'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { submitOnboarding } from '@/lib/services/onboarding-service';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Form Fields
  // Step 1: Education
  const [education, setEducation] = useState('Undergrad');
  const [major, setMajor] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Step 2: Goals
  const [careerGoal, setCareerGoal] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('₹6L – ₹10L');

  // Step 3: Skills
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('Intermediate');
  const [interests, setInterests] = useState<string[]>([]);

  // Step 4: Learning Preferences
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [availability, setAvailability] = useState('10-20 hours/week');
  const [wantsCertifications, setWantsCertifications] = useState(true);

  // Step 5: Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Check if user already completed onboarding (API is the source of truth)
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/onboarding/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.completed) {
          // Sync localStorage before redirecting
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const userObj = JSON.parse(userStr);
              userObj.onboardingCompleted = true;
              localStorage.setItem('user', JSON.stringify(userObj));
            }
          } catch (e) {}
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
        // On error, stay on onboarding page — don't redirect
      }
    }
    checkOnboardingStatus();
  }, [router]);

  // Stepped Fields Lists
  const educationOptions = ['High School', 'Undergrad', 'Postgrad', 'Bootcamp/Self-taught'];
  const experienceOptions = ['Beginner', 'Intermediate', 'Advanced'];
  const learningStyleOptions = ['Hands-on Code', 'Video Lectures', 'Written Docs', 'Interactive Labs'];
  
  const interestOptions = [
    { name: 'Technology', desc: 'Software engineering, cloud architecture, web applications' },
    { name: 'Data & AI', desc: 'Machine learning, statistics, data analytics' },
    { name: 'Design', desc: 'User experience, visual interfaces, UI mockups' },
    { name: 'Security', desc: 'Cybersecurity, network defense, penetration testing' },
    { name: 'Business', desc: 'Product management, agile methods, corporate strategy' }
  ];

  const salaryOptions = ['Under ₹3L', '₹3L – ₹6L', '₹6L – ₹10L', '₹10L – ₹15L', '₹15L – ₹25L', '₹25L+'];
  const availabilityOptions = ['< 5 hours/week', '5-10 hours/week', '10-20 hours/week', '20+ hours/week'];

  // Chip togglers
  const toggleLearningStyle = (style: string) => {
    if (learningStyles.includes(style)) {
      setLearningStyles(learningStyles.filter(s => s !== style));
    } else {
      setLearningStyles([...learningStyles, style]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  // Tag manager for skills
  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // Submit flow
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    // Animate loader text stages
    const statuses = [
      'Uploading resume to secure server...',
      'Extracting profile text and parsing format...',
      'Generating sentence embeddings (all-mpnet-base-v2)...',
      'Running zero-shot domain classification (BART-large-MNLI)...',
      'Extracting profile insights (Llama-3-8B)...',
      'Calculating skills gaps and course pathways...',
      'Finalizing recommendations. Syncing with dashboard...'
    ];

    let currentIdx = 0;
    setLoadingStatus([statuses[0]]);
    
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < statuses.length) {
        setLoadingStatus(prev => [...prev, statuses[currentIdx]]);
      }
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('education', education);
      formData.append('major', major);
      formData.append('institutionName', institutionName);
      formData.append('graduationYear', graduationYear);
      
      formData.append('careerGoal', careerGoal);
      formData.append('targetRole', targetRole);
      formData.append('salaryExpectation', salaryExpectation);
      
      formData.append('yearsExperience', yearsExperience);
      formData.append('interests', JSON.stringify(interests));
      formData.append('skills', JSON.stringify(skills));
      
      formData.append('learningStyle', JSON.stringify(learningStyles));
      formData.append('availability', availability);
      formData.append('wantsCertifications', String(wantsCertifications));

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await submitOnboarding(formData);
      clearInterval(interval);
      setLoadingStatus(prev => [...prev, '✓ Analysis complete! Redirecting...']);
      
      // Update local storage user profile onboarding completed flag
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userObj.onboardingCompleted = true;
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {}
      }

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Onboarding failed. Please try again.');
      setLoading(false);
    }
  };

  // Quick helper to fetch side panels content
  const getHelpText = () => {
    switch(step) {
      case 1:
        return {
          title: '🎓 Education Context',
          bullets: [
            'Helps model understand your academic track.',
            'Ensures academic course level matches your foundation.',
            'Filters entry-level career prerequisites.'
          ]
        };
      case 2:
        return {
          title: '🎯 Career Goals',
          bullets: [
            'Guides the direction of your personalized learning pathway.',
            'Helps model filter salaries and roles matching expectations.',
            'Builds targets for direct O*NET profile comparisons.'
          ]
        };
      case 3:
        return {
          title: '🛠️ Skills & Experience',
          bullets: [
            'Forms the baseline for your dynamic skill-gap matrix.',
            'Prevents recommendation of courses you already know.',
            'Highlights strengths for matching domain roles.'
          ]
        };
      case 4:
        return {
          title: '⚡ Style & Pace',
          bullets: [
            'Customizes course formats (e.g. video vs. hands-on docs).',
            'Tailors study roadmaps to your actual hours available.',
            'Controls professional certificate recommendations.'
          ]
        };
      case 5:
        return {
          title: '📄 Resume Parser',
          bullets: [
            'Hugging Face BART classifies resume text to matching domains.',
            'Llama-3-8B parses projects, certs, and text context.',
            'Validates domain fit against actual career datasets.'
          ]
        };
      default:
        return { title: '', bullets: [] };
    }
  };

  const helpPanel = getHelpText();

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#ffffff' }}>
      <DashboardNavbar />
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        {loading ? (
          /* Stepped Loader HUD matching Postman AI Loading State */
          <div className="card animate-fade-in" style={{ width: '580px', padding: '40px', background: 'var(--surface)', border: '1px solid rgba(255, 158, 66, 0.25)', textAlign: 'center', borderRadius: '0px' }}>
            <div className="spinner" style={{ marginBottom: '24px', borderColor: 'var(--accent) transparent transparent transparent' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mastermind AI Analyzing Profile
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              We are parsing your credentials and running vector models to compile recommendations
            </p>
            <div style={{ textAlign: 'left', background: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(255, 158, 66, 0.15)', padding: '24px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingStatus.map((status, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: idx === loadingStatus.length - 1 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{idx === loadingStatus.length - 1 ? '⚡' : '✓'}</span>
                  <span style={{ fontFamily: 'monospace' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', width: '1000px', maxWidth: '100%' }}>
            
            {/* Left Main Form Card */}
            <div className="card animate-slide-up" style={{ flex: 1, padding: '40px', background: 'var(--surface)', border: '1px solid rgba(255, 158, 66, 0.2)', borderRadius: '0px' }}>
              
              {/* Header progress tracker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', paddingBottom: '16px' }}>
                <div>
                  <span className="section-label" style={{ marginBottom: '4px', color: 'var(--accent)', fontWeight: 600 }}>Step {step} of 5</span>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                    {step === 1 && 'Welcome & Education Background'}
                    {step === 2 && 'Career Goals & Aspirations'}
                    {step === 3 && 'Current Skills & Domain Matrix'}
                    {step === 4 && 'Learning Styles & Commitment'}
                    {step === 5 && 'AI Profile Analysis & Launch'}
                  </h1>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {step === 1 && '40s remaining'}
                    {step === 2 && '30s remaining'}
                    {step === 3 && '20s remaining'}
                    {step === 4 && '10s remaining'}
                    {step === 5 && 'Almost done!'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} style={{ width: '16px', height: '4px', background: s <= step ? 'var(--accent)' : 'rgba(255, 158, 66, 0.15)', transition: 'background-color 0.25s ease' }} />
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px', borderRadius: '0px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              {/* Step 1: Background & Education */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Let&apos;s map your educational qualifications so our recommendation system targets the right baseline courses.
                  </p>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Education Level
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {educationOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setEducation(opt)}
                          className={education === opt ? 'btn-primary' : 'btn-ghost'}
                          style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Major / Stream
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Computer Science, Finance, Design"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        style={{ background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.15)', color: '#ffffff', borderRadius: '0px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Institution Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Delhi University, MIT, self-taught"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        style={{ background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.15)', color: '#ffffff', borderRadius: '0px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Year of Graduation (Actual or Expected)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 2024, 2026, N/A"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      style={{ background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.15)', color: '#ffffff', borderRadius: '0px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '0px' }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Goals & Aspirations */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Define where you want to go. The AI model checks O*NET profiles and predicts salary ranges to fit your dream profile.
                  </p>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      What is your primary career goal?
                    </label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="e.g. I want to become a Senior DevOps Engineer in a product startup, focusing on infrastructure scaling."
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      style={{ background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.15)', color: '#ffffff', borderRadius: '0px', padding: '12px', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Target Role / Job Position
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Full-Stack Developer, AI Researcher, UX Architect"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      style={{ background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.15)', color: '#ffffff', borderRadius: '0px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Expected Salary Range
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {salaryOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSalaryExpectation(opt)}
                          className={salaryExpectation === opt ? 'btn-primary' : 'btn-ghost'}
                          style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <button onClick={() => setStep(1)} className="btn-ghost" style={{ padding: '10px 24px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}>
                      ← Back
                    </button>
                    <button onClick={() => setStep(3)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '0px' }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Current Skills & Experience Level */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Enter the skills you already possess. Our engine performs a skill-gap analysis, subtracting these from top career requirements.
                  </p>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Career Domains of Interest:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      {interestOptions.map((opt) => {
                        const selected = interests.includes(opt.name);
                        return (
                          <div
                            key={opt.name}
                            onClick={() => toggleInterest(opt.name)}
                            style={{
                              border: `1px solid ${selected ? 'var(--accent)' : 'rgba(255, 158, 66, 0.15)'}`,
                              background: selected ? 'rgba(255, 158, 66, 0.08)' : 'var(--surface-alt)',
                              padding: '14px 18px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', margin: 0 }}>{opt.name}</p>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>{opt.desc}</p>
                            </div>
                            <span style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)', fontSize: '18px' }}>
                              {selected ? '●' : '○'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Add your current skills:
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Type a skill (e.g. Python, Figma, React) and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                      style={{ background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.15)', color: '#ffffff', marginBottom: '10px', borderRadius: '0px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {skills.map((sk) => (
                        <span
                          key={sk}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--surface-alt)',
                            border: '1px solid rgba(255, 158, 66, 0.3)',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: '#ffffff'
                          }}
                        >
                          {sk}
                          <button
                            onClick={() => removeSkill(sk)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {skills.length === 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No skills added manually yet. (They can also be parsed from your resume in Step 5!)</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Overall Experience Level
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {experienceOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setYearsExperience(opt)}
                          className={yearsExperience === opt ? 'btn-primary' : 'btn-ghost'}
                          style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <button onClick={() => setStep(2)} className="btn-ghost" style={{ padding: '10px 24px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}>
                      ← Back
                    </button>
                    <button onClick={() => setStep(4)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '0px' }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Learning Preferences & Availability */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Customize how you want to learn. Our recommendations engine filters courses and generates study guides that fit your schedule.
                  </p>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Preferred Learning Styles (Select all that apply)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {learningStyleOptions.map((opt) => {
                        const selected = learningStyles.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleLearningStyle(opt)}
                            className={selected ? 'btn-primary' : 'btn-ghost'}
                            style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}
                          >
                            {selected ? '✓ ' : ''}{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Weekly Time Commitment
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {availabilityOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAvailability(opt)}
                          className={availability === opt ? 'btn-primary' : 'btn-ghost'}
                          style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-alt)', border: '1px solid rgba(255,158,66,0.1)', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Include Industry Certifications</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Suggest specialized credentials like AWS, Google, or Cisco certificates.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={wantsCertifications} 
                        onChange={(e) => setWantsCertifications(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <button onClick={() => setStep(3)} className="btn-ghost" style={{ padding: '10px 24px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}>
                      ← Back
                    </button>
                    <button onClick={() => setStep(5)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '0px' }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Resume Upload & Analysis */}
              {step === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Upload your resume to perform AI-based profile understanding. We will parse it to identify your strengths, certifications, education, and matching career pathways.
                  </p>

                  <div
                    style={{
                      border: `2px dashed ${resumeFile ? 'var(--accent)' : 'rgba(255, 158, 66, 0.3)'}`,
                      background: 'var(--surface-alt)',
                      padding: '36px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setResumeFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                        }
                      }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📄</span>
                    <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>
                      {resumeFile ? resumeFile.name : 'Drag & drop your resume PDF here'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                      {resumeFile ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supports PDF format up to 5MB'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <button onClick={() => setStep(4)} className="btn-ghost" style={{ padding: '10px 24px', borderRadius: '0px', border: '1px solid rgba(255,158,66,0.3)' }}>
                      ← Back
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleSubmit}
                        className="btn-primary"
                        disabled={!resumeFile}
                        style={{ padding: '10px 24px', opacity: !resumeFile ? 0.6 : 1, borderRadius: '0px' }}
                      >
                        Launch AI Analysis →
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
            
            {/* Right Help Sidebar */}
            <div style={{ width: '320px', padding: '30px', background: 'rgba(10, 10, 10, 0.6)', border: '1px solid rgba(255,158,66,0.15)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {helpPanel.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {helpPanel.bullets.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--accent)' }}>▶</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,158,66,0.1)', paddingTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, lineHeight: '1.4' }}>All recommendations are computed using vector space mapping against validated O*NET indices and Hugging Face models.</p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
