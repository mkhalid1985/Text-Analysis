
import React, { useState, useCallback, useMemo } from 'react';
import { QuestionState } from './types';
import * as geminiService from './services/geminiService';
import { LoadingSpinner, ProgressBar } from './components/UI';

type AppState = 'idle' | 'entering_name' | 'selecting_quiz_type' | 'loading_questions' | 'quiz' | 'complete';
type QuizType = 'mcq' | 'descriptive' | 'blend';

const HighlightedText: React.FC<{text: string; highlight: string}> = ({ text, highlight }) => {
    if (!highlight || !text.includes(highlight)) {
        return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-sky-200 dark:bg-sky-800 text-slate-800 dark:text-slate-200 rounded px-1">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </p>
    );
};

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareText: string;
    shareSubject: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareText, shareSubject }) => {
    const [copySuccess, setCopySuccess] = useState('');

    if (!isOpen) return null;

    const handleShareByEmail = () => {
        const encodedSubject = encodeURIComponent(shareSubject);
        const encodedBody = encodeURIComponent(shareText);
        window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    };

    const handleShareByWhatsApp = () => {
        const encodedText = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(shareText).then(() => {
            setCopySuccess('Copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy.');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Share Your Results</h3>
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">&times;</button>
                </div>
                <div className="space-y-3">
                    <button onClick={handleShareByEmail} className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                        Share via Email
                    </button>
                    <button onClick={handleShareByWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 px-4 rounded-md hover:bg-green-600 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        Share on WhatsApp
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">For Instagram, Facebook, etc:</p>
                        <button onClick={handleCopyToClipboard} className="w-full flex items-center justify-center gap-2 bg-slate-500 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-600 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                             {copySuccess ? copySuccess : 'Copy to Clipboard'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [appState, setAppState] = useState<AppState>('idle');
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const score = questions.filter(q => q.evaluation?.isCorrect).length;
  const confidence = questions.length > 0 ? (score / questions.length) * 100 : 0;

  const handleStart = () => {
    if (!inputText.trim()) return;
    setAppState('entering_name');
    setError(null);
  };
  
  const handleNameSubmitted = () => {
    if (!userName.trim()) return;
    setAppState('selecting_quiz_type');
  };

  const handleStartAnalysis = useCallback(async (quizType: QuizType) => {
    setAppState('loading_questions');
    try {
      const generatedQuestions = await geminiService.generateGuidedQuestions(inputText, quizType, userName);
      setQuestions(generatedQuestions.map(q => ({ 
        ...q, 
        userAnswer: '', 
        evaluation: null, 
        status: 'unanswered',
        hintVisible: false,
      })));
      setCurrentQuestionIndex(0);
      setAppState('quiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate questions.');
      setAppState('idle');
    }
  }, [inputText, userName]);

  const handleAnswerChange = (text: string) => {
    setQuestions(prev => prev.map((q, i) => i === currentQuestionIndex ? { ...q, userAnswer: text } : q));
  };
  
  const handleToggleHint = () => {
     setQuestions(prev => prev.map((q, i) => i === currentQuestionIndex ? { ...q, hintVisible: !q.hintVisible } : q));
  }

  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion.userAnswer.trim()) return;
    
    setQuestions(prev => prev.map((q, i) => i === currentQuestionIndex ? { ...q, status: 'evaluating' } : q));

    try {
        const evaluation = currentQuestion.questionType === 'mcq'
            ? { isCorrect: currentQuestion.userAnswer === currentQuestion.answer, feedback: currentQuestion.userAnswer === currentQuestion.answer ? 'That is correct!' : 'Not quite, the correct answer is highlighted.' }
            : await geminiService.evaluateUserAnswer(currentQuestion.userAnswer, currentQuestion.answer);

        setQuestions(prev => prev.map((q, i) => i === currentQuestionIndex ? { ...q, status: 'answered', evaluation } : q));
    } catch (e) {
        setQuestions(prev => prev.map((q, i) => i === currentQuestionIndex ? { 
            ...q, 
            status: 'answered',
            evaluation: { isCorrect: false, feedback: 'Could not evaluate your answer. Please try the next question.'}
        } : q));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('complete');
    }
  };

  const handleRestart = () => {
    setAppState('idle');
    setInputText('');
    setUserName('');
    setQuestions([]);
    setError(null);
  }

  const shareText = useMemo(() => {
    const revisedSkills = [...new Set(questions.map(q => q.category))];
    return `Hello,

Here are my results from the Guided Literary Analysis exercise.

Student Name: ${userName}
Score: ${score} out of ${questions.length}
Confidence Level: ${Math.round(confidence)}%

Skills Revised:
${revisedSkills.map(skill => `- ${skill}`).join('\n')}

Original Text Analyzed:
---------------------------------
${inputText}
---------------------------------
`.trim();
  }, [questions, userName, score, confidence, inputText]);

  const shareSubject = useMemo(() => `Literary Analysis Results for ${userName}`, [userName]);


  const renderContent = () => {
    switch (appState) {
      case 'entering_name':
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                 <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">What's your name?</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6">Let's personalize your learning experience.</p>
                 <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full p-3 mb-4 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
                    onKeyDown={(e) => e.key === 'Enter' && !!userName.trim() && handleNameSubmitted()}
                 />
                 <button
                    onClick={handleNameSubmitted}
                    disabled={!userName.trim()}
                    className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                 >
                    Continue
                 </button>
            </div>
        );
      case 'selecting_quiz_type':
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                 <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Choose Your Analysis Style, {userName}</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6">How would you like to be quizzed?</p>
                 <div className="flex flex-col space-y-3">
                     <button onClick={() => handleStartAnalysis('mcq')} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 transition-colors">Multiple Choice</button>
                     <button onClick={() => handleStartAnalysis('descriptive')} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 transition-colors">Descriptive (Written)</button>
                     <button onClick={() => handleStartAnalysis('blend')} className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 transition-colors">A Blend of Both</button>
                 </div>
            </div>
        );
      case 'loading_questions':
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 h-96">
                <LoadingSpinner />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Generating your personalized learning path...</p>
            </div>
        );
      case 'quiz':
        const question = questions[currentQuestionIndex];
        if (!question) return null;
        const isAnswered = question.status === 'answered';
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <ProgressBar value={confidence} />
                <div className="my-6">
                    <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">{`Question ${currentQuestionIndex + 1} of ${questions.length}: ${question.category}`}</p>
                    <p className="mt-2 text-lg text-slate-800 dark:text-slate-200">{question.question}</p>
                </div>
                
                {!isAnswered && (
                  <button onClick={handleToggleHint} className="text-sm text-sky-600 dark:text-sky-400 hover:underline mb-3">
                    {question.hintVisible ? 'Hide Hint' : 'Need a hint?'}
                  </button>
                )}
                
                {question.hintVisible && !isAnswered && (
                  <div className="p-3 mb-4 bg-sky-50 dark:bg-sky-900/50 border-l-4 border-sky-400 text-slate-700 dark:text-slate-300">
                      <p>{question.hint}</p>
                  </div>
                )}
                
                {question.questionType === 'descriptive' ? (
                  <textarea
                      value={question.userAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Your answer here..."
                      className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
                      rows={5}
                      readOnly={isAnswered}
                  />
                ) : (
                  <div className="space-y-3">
                    {question.options?.map((option, index) => (
                      <button 
                        key={index}
                        onClick={() => !isAnswered && handleAnswerChange(option)}
                        disabled={isAnswered}
                        className={`w-full p-3 text-left border rounded-md transition-all ${
                          isAnswered && option === question.answer
                            ? 'bg-green-100 dark:bg-green-900/60 border-green-400 dark:border-green-600 ring-2 ring-green-500'
                            : isAnswered && option === question.userAnswer
                            ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600'
                            : question.userAnswer === option
                            ? 'bg-sky-100 dark:bg-sky-900/70 border-sky-500 ring-2 ring-sky-500'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-900/50'
                        } ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}


                {isAnswered && question.evaluation && (
                    <div className={`mt-4 p-4 rounded-md border-l-4 ${question.evaluation.isCorrect ? 'bg-green-50 dark:bg-green-900/50 border-green-500' : 'bg-amber-50 dark:bg-amber-900/50 border-amber-500'}`}>
                        <h4 className="font-bold">{question.evaluation.isCorrect ? 'Correct!' : "Here's the expert take:"}</h4>
                        <p className="mt-1 text-sm">{question.evaluation.feedback}</p>
                        
                        <div className="mt-4 border-t border-slate-300 dark:border-slate-600 pt-3">
                            <strong className="font-semibold text-sm mb-2 block">Context from the text:</strong>
                            <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                                <HighlightedText text={inputText} highlight={question.relevantText} />
                            </div>
                        </div>

                        <p className="mt-3 text-sm border-t border-slate-300 dark:border-slate-600 pt-3"><strong className="font-semibold">Explanation:</strong> {question.explanation}</p>
                    </div>
                )}

                <button
                    onClick={isAnswered ? handleNextQuestion : handleSubmitAnswer}
                    disabled={question.status === 'evaluating' || !question.userAnswer.trim()}
                    className="mt-4 w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                   {question.status === 'evaluating' ? <><LoadingSpinner /> Evaluating...</> : (isAnswered ? (currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Analysis') : 'Submit Answer')}
                </button>
            </div>
        );
      case 'complete':
        const revisedSkills = [...new Set(questions.map(q => q.category))];
        return (
            <>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareText={shareText}
                shareSubject={shareSubject}
            />
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400">Analysis Complete, {userName}!</h2>
                <p className="mt-2 text-slate-700 dark:text-slate-300">You answered {score} out of {questions.length} questions correctly.</p>
                <div className="my-6">
                    <ProgressBar value={confidence} />
                </div>

                <div className="mt-8 text-left border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 text-center">Skills Revised</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        {revisedSkills.map(skill => (
                            <li key={skill}>{skill}</li>
                        ))}
                    </ul>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button onClick={handleRestart} className="w-full sm:w-auto bg-sky-600 text-white font-bold py-3 px-6 rounded-md hover:bg-sky-700 transition-colors">
                      Start a New Analysis
                  </button>
                  <button onClick={() => setIsShareModalOpen(true)} className="w-full sm:w-auto bg-slate-600 text-white font-bold py-3 px-6 rounded-md hover:bg-slate-700 transition-colors">
                      Share Results
                  </button>
                </div>
            </div>
            </>
        );
      case 'idle':
      default:
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100">Enter Text to Analyze</h2>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-64 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
                    rows={15}
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <button
                    onClick={handleStart}
                    disabled={!inputText.trim()}
                    className="mt-4 w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                   Start Guided Analysis
                </button>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400">
            Guided Literary Analysis
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Your interactive AI tutor for deeper text analysis.
          </p>
        </div>
      </header>
      <main className="container mx-auto p-4 mt-4">
        <div className="max-w-2xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
