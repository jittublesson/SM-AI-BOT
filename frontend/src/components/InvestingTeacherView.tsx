import React, { useState, useEffect } from "react";
import { BookOpen, CheckCircle, HelpCircle, ChevronRight, Award } from "lucide-react";

export const InvestingTeacherView: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  
  // Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);

  const fetchAcademyData = async () => {
    setLoading(true);
    try {
      const lRes = await fetch("/api/v1/education/lessons");
      const lJson = await lRes.json();
      setLessons(lJson);

      const pRes = await fetch("/api/v1/education/progress");
      const pJson = await pRes.json();
      const completed = pJson.filter((p: any) => p.completed).map((p: any) => p.lesson_slug);
      setCompletedSlugs(completed);
      
      if (lJson.length > 0) {
        setActiveLesson(lJson[0]);
      }
    } catch (err) {
      console.error("Academy fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademyData();
  }, []);

  const handleSelectLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setSelectedAnswers({});
    setShowQuizResults(false);
  };

  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    if (showQuizResults) return; // Prevent change after grading
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    setShowQuizResults(true);
    
    // Check if all answers are correct
    const quiz = activeLesson.quiz_questions || [];
    let allCorrect = true;
    quiz.forEach((q: any, idx: number) => {
      if (selectedAnswers[idx] !== q.correct_index) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      try {
        await fetch("/api/v1/education/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lesson_slug: activeLesson.slug,
            completed: true
          })
        });
        
        // Update local completed state
        if (!completedSlugs.includes(activeLesson.slug)) {
          setCompletedSlugs(prev => [...prev, activeLesson.slug]);
        }
      } catch (err) {
        console.error("Complete registry failed:", err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto">
      {/* Sidebar Course Navigator */}
      <div className="md:col-span-1 glass-card p-4 rounded-lg flex flex-col md:sticky md:top-20 h-fit">
        <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
          <BookOpen className="text-brand-primary w-5 h-5" />
          Academy Course Index
        </h2>
        
        {loading ? (
          <div className="text-brand-muted text-xs p-4 text-center">Loading academy...</div>
        ) : (
          <div className="space-y-2 flex-1 pr-1">
            {lessons.map((lesson) => {
              const isActive = activeLesson?.slug === lesson.slug;
              const isCompleted = completedSlugs.includes(lesson.slug);
              return (
                <div
                  key={lesson.slug}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`p-3 rounded text-xs cursor-pointer transition-all flex justify-between items-center ${
                    isActive 
                      ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold" 
                      : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="flex flex-col space-y-1">
                    <span className="font-mono text-[9px] text-brand-muted tracking-wider uppercase">{lesson.level}</span>
                    <span>{lesson.title}</span>
                  </div>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-brand-secondary shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Lesson Content */}
      <div className="md:col-span-3 glass-card p-6 rounded-lg flex flex-col space-y-6">
        {activeLesson ? (
          <>
            {/* Header info */}
            <div className="border-b border-light-border dark:border-dark-border pb-4 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-brand-primary/15 text-brand-primary font-extrabold tracking-wider">
                  {activeLesson.level} • {activeLesson.category}
                </span>
                <h1 className="text-xl font-extrabold mt-2 text-slate-800 dark:text-white leading-tight">
                  {activeLesson.title}
                </h1>
              </div>
              {completedSlugs.includes(activeLesson.slug) && (
                <div className="flex items-center gap-1.5 text-xs text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded font-bold uppercase font-mono">
                  <Award className="w-4 h-4" />
                  Course Completed
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">
                1. Concept Explanation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-black/5 dark:bg-white/5 p-4 rounded border border-light-border dark:border-dark-border">
                {activeLesson.content}
              </p>
            </div>

            {/* Practical Example */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-brand-secondary tracking-wider">
                2. Real-World Case Example
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-brand-secondary/5 p-4 rounded border border-brand-secondary/10">
                {activeLesson.example}
              </p>
            </div>

            {/* Lesson Summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-brand-warning tracking-wider">
                3. Summary takeaways
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-brand-warning/5 p-4 rounded border border-brand-warning/10 italic">
                {activeLesson.summary}
              </p>
            </div>

            {/* Interactive Grading Quiz */}
            <div className="border-t border-light-border dark:border-dark-border pt-6 space-y-6">
              <h2 className="text-md font-bold flex items-center gap-2">
                <HelpCircle className="text-brand-primary w-5 h-5" />
                Lesson Grading Quiz
              </h2>
              
              <div className="space-y-6">
                {activeLesson.quiz_questions?.map((q: any, qIdx: number) => {
                  const selectedOpt = selectedAnswers[qIdx];
                  return (
                    <div key={qIdx} className="space-y-3 p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                      <div className="text-sm font-semibold">
                        Q{qIdx + 1}: {q.question}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isSelected = selectedOpt === oIdx;
                          const isCorrect = oIdx === q.correct_index;
                          
                          let cardStyle = "border-light-border dark:border-dark-border hover:bg-black/10 dark:hover:bg-white/10";
                          if (isSelected) {
                            cardStyle = "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold";
                          }
                          if (showQuizResults) {
                            if (isCorrect) {
                              cardStyle = "border-brand-secondary bg-brand-secondary/10 text-brand-secondary font-bold";
                            } else if (isSelected) {
                              cardStyle = "border-brand-danger bg-brand-danger/10 text-brand-danger font-bold";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={showQuizResults}
                              onClick={() => handleOptionClick(qIdx, oIdx)}
                              className={`p-3 text-xs text-left rounded border transition-all ${cardStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {showQuizResults && (
                        <div className="text-xs mt-3 p-2 bg-light-bg dark:bg-[#070a10] rounded border border-light-border dark:border-dark-border leading-relaxed text-brand-muted">
                          <span className="font-bold text-slate-800 dark:text-white uppercase text-[10px] block mb-1">
                            Explanation:
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showQuizResults ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedAnswers).length < (activeLesson.quiz_questions?.length || 0)}
                  className="px-6 py-2 rounded bg-brand-primary text-white text-xs font-bold font-sans uppercase hover:bg-brand-primary/95 disabled:opacity-50 transition-colors"
                >
                  Grade Quiz & Submit Progress
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setShowQuizResults(false);
                  }}
                  className="px-6 py-2 rounded border border-light-border dark:border-dark-border text-xs font-bold uppercase hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Retry Lesson Quiz
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-brand-muted text-sm">
            Select a course topic to begin studying.
          </div>
        )}
      </div>
    </div>
  );
};
