import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const steps = [
    "Initializing CircuitPilot...",
    "Loading component library...",
    "Setting up canvas...",
    "Ready to design!"
  ];

  const handleContinue = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update step based on progress
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        setCurrentStep(Math.min(stepIndex, steps.length - 1));
        
        if (newProgress >= 100) {
          clearInterval(timer);
          setIsLoadingComplete(true);
          return 100;
        }
        return newProgress;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
      };

  // Circuit board SVG pattern with animated traces
  const CircuitBoardSVG = () => (
    <svg className="absolute inset-0 w-full h-full opacity-15" style={{ filter: 'hue-rotate(200deg) saturate(1.2)' }}>
      <defs>
        <pattern id="circuit" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
          {/* Animated main traces */}
          <path 
            d="M 0,80 Q 75,60 150,90 T 300,120" 
            stroke="url(#traceGradient)" 
            strokeWidth="4" 
            fill="none" 
            opacity="0.8"
            style={{ 
              strokeDasharray: '20, 10',
              animation: 'circuit-flow 3s linear infinite'
            }}
          />
          <path 
            d="M 0,200 Q 100,180 200,210 Q 250,225 300,200" 
            stroke="url(#traceGradient)" 
            strokeWidth="3" 
            fill="none" 
            opacity="0.6"
            style={{ 
              strokeDasharray: '15, 8',
              animation: 'circuit-flow 4s linear infinite reverse',
              animationDelay: '1s'
            }}
          />
          <path d="M 80,0 L 80,300" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2.5" fill="none" opacity="0.5"/>
          <path d="M 220,0 L 220,300" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" fill="none" opacity="0.4"/>
          
          {/* Component pads with glow */}
          <circle cx="80" cy="80" r="12" fill="url(#componentGlow)" opacity="0.8"/>
          <circle cx="220" cy="90" r="10" fill="url(#componentGlow)" opacity="0.6"/>
          <circle cx="150" cy="200" r="11" fill="url(#componentGlow)" opacity="0.7"/>
          
          {/* IC packages */}
          <rect x="100" y="70" width="40" height="20" fill="none" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" opacity="0.6" rx="2"/>
          <rect x="170" y="190" width="30" height="15" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="1.5" opacity="0.5" rx="2"/>
        </pattern>
        
        <linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)"/>
          <stop offset="50%" stopColor="rgba(59, 130, 246, 0.9)"/>
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)"/>
        </linearGradient>
        <radialGradient id="componentGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 1)"/>
          <stop offset="70%" stopColor="rgba(59, 130, 246, 0.6)"/>
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)"/>
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center z-50"
      style={{ perspective: '1000px' }}
    >
      {/* Circuit Board Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <CircuitBoardSVG />
      </motion.div>

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            backgroundColor: `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.2})`,
            filter: 'blur(0.5px)'
          }}
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: 0,
            scale: 0
          }}
          animate={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: [0, 0.7, 0],
            scale: [0, 1, 0]
          }}
          transition={{ 
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4 
          }}
        />
      ))}
      {/* 3D Card Container - mimicking your CSS example */}
      <motion.div
        className="relative"
        style={{ 
          width: '320px', 
          height: '380px', 
          perspective: '1000px' 
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onMouseEnter={(e) => {
          const card = e.currentTarget.querySelector('.card-inner') as HTMLElement;
          if (card) {
            card.style.transform = 'rotate3d(1, 1, 0, 25deg)';
            card.style.boxShadow = '0 40px 60px -20px rgba(59, 130, 246, 0.4), 0 20px 40px rgba(59, 130, 246, 0.2)';
          }
          // Animate social buttons
          const buttons = e.currentTarget.querySelectorAll('.social-btn');
          buttons.forEach((btn: any, i) => {
            setTimeout(() => {
              btn.style.transform = 'translate3d(0, 0, 50px)';
              btn.style.boxShadow = '0 15px 25px rgba(59, 130, 246, 0.3)';
            }, i * 100);
          });
          // Animate logo circles with ripple effect
          const circles = e.currentTarget.querySelectorAll('.logo-circle');
          circles.forEach((circle: any, i) => {
            setTimeout(() => {
              const currentZ = 20 + (i * 20);
              circle.style.transform = `translate3d(0, 0, ${currentZ + 30}px) scale(1.1)`;
              circle.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
              circle.style.boxShadow = '0 0 40px rgba(59, 130, 246, 0.6), rgba(100, 100, 111, 0.3) -10px 10px 30px 0px';
            }, i * 150);
          });
        }}
        onMouseLeave={(e) => {
          const card = e.currentTarget.querySelector('.card-inner') as HTMLElement;
          if (card) {
            card.style.transform = 'rotate3d(1, 1, 0, 0deg)';
            card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px rgba(59, 130, 246, 0.1)';
          }
          // Reset social buttons
          const buttons = e.currentTarget.querySelectorAll('.social-btn');
          buttons.forEach((btn: any) => {
            btn.style.transform = 'translate3d(0, 0, 0px)';
            btn.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
          });
          // Reset logo circles
          const circles = e.currentTarget.querySelectorAll('.logo-circle');
          circles.forEach((circle: any, i) => {
            const currentZ = 20 + (i * 20);
            circle.style.transform = `translate3d(0, 0, ${currentZ}px) scale(1)`;
            circle.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            circle.style.boxShadow = 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px';
          });
        }}
      >
        {/* Main Card */}
        <div 
          className="card-inner relative w-full h-full rounded-[50px] overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px rgba(59, 130, 246, 0.1)'
          }}
        >
          {/* Glass overlay effect */}
          <div 
            className="absolute inset-2 rounded-[45px] border-l border-b border-white/30"
            style={{
              background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.3) 100%)',
              transform: 'translate3d(0px, 0px, 25px)',
              borderTopRightRadius: '100%',
              transformStyle: 'preserve-3d',
              transition: 'all 0.5s ease-in-out'
            }}
          />

          {/* Logo circles in top-right */}
          <div className="absolute top-0 right-0" style={{ transformStyle: 'preserve-3d' }}>
            {[1, 2, 3, 4, 5].map((num, i) => (
              <div
                key={num}
                className={`logo-circle absolute rounded-full transition-all duration-500 ease-in-out`}
                style={{
                  width: `${170 - (i * 30)}px`,
                  height: `${170 - (i * 30)}px`,
                  top: `${8 + (i * 5)}px`,
                  right: `${8 + (i * 5)}px`,
                  background: 'rgba(59, 130, 246, 0.2)',
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)',
                  boxShadow: 'rgba(100, 100, 111, 0.2) -10px 10px 20px 0px',
                  transform: `translate3d(0, 0, ${20 + (i * 20)}px)`,
                  transformStyle: 'preserve-3d',
                  transitionDelay: `${i * 0.1}s`
                }}
              >
                {i === 4 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src="/favicon.ico" alt="930 Logo" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div 
            className="absolute text-white px-8 pt-24"
            style={{
              transform: 'translate3d(0, 0, 26px)',
              transformStyle: 'preserve-3d'
            }}
          >
            <motion.h1 
              className="text-2xl font-black mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: '#ffffff' }}
            >
              CircuitPilot
            </motion.h1>
            <motion.p 
              className="text-white/80 text-sm leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Professional robot wiring design tool for FRC Team 930
            </motion.p>
          </div>

          {/* Progress Section */}
          <motion.div 
            className="absolute left-8 right-8"
            style={{ 
              top: '60%',
              transform: 'translate3d(0, 0, 26px)',
              transformStyle: 'preserve-3d'
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white/20 rounded-full h-2 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-white/70 text-xs">{steps[currentStep]}</p>
          </motion.div>

          {/* Bottom section with buttons */}
          <div 
            className="absolute bottom-5 left-5 right-5 flex items-center justify-between"
            style={{
              transform: 'translate3d(0, 0, 26px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Social buttons */}
            <div className="flex gap-3" style={{ transformStyle: 'preserve-3d' }}>
              {/* GitHub Button */}
              <motion.button
                className="social-btn w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all duration-200 ease-in-out"
                style={{
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  transformStyle: 'preserve-3d',
                  transform: 'translate3d(0, 0, 0px)',
                  transitionDelay: '0.4s'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://github.com/AsherVerLee/930-Wire-Plotting-tool', '_blank');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#3b82f6';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = '#fde047';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#000000';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
              >
                <svg className="w-4 h-4 transition-colors duration-200" viewBox="0 0 24 24" style={{ fill: '#3b82f6' }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.button>

              {/* Team 930 Button */}
              <motion.button
                className="social-btn w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all duration-200 ease-in-out"
                style={{
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  transformStyle: 'preserve-3d',
                  transform: 'translate3d(0, 0, 0px)',
                  transitionDelay: '0.6s'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.team930.com', '_blank');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#3b82f6';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = '#fde047';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#000000';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#ffffff';
                }}
              >
                <span className="text-xs font-bold transition-colors duration-200" style={{ color: '#3b82f6' }}>930</span>
              </motion.button>
            </div>

            {/* Continue Button */}
            {isLoadingComplete && (
              <motion.div
                className="flex items-center"
                style={{
                  transition: 'all 0.2s ease-in-out',
                  transformStyle: 'preserve-3d'
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 10px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px)';
                }}
              >
                <button
                  onClick={handleContinue}
                  className="bg-transparent border-none text-white font-bold text-sm mr-2"
                >
                  Continue
                </button>
                <svg className="w-4 h-4 fill-none stroke-white" strokeWidth="3" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center z-50"
      style={{ 
        perspective: '2000px',
        background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.2) 0%, rgba(15, 23, 42, 1) 100%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)'
      }}
    >
      {/* Enhanced Circuit Board Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateZ: -5 }}
        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }}
      >
        <CircuitBoardSVG />
      </motion.div>

      {/* Enhanced floating particles with depth */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            backgroundColor: `rgba(59, 130, 246, ${Math.random() * 0.6 + 0.2})`,
            filter: 'blur(0.5px)'
          }}
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: 0,
            scale: 0
          }}
          animate={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0]
          }}
          transition={{ 
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3 
          }}
        />
      ))}

      {/* Main 3D Card with dramatic perspective */}
      <motion.div
        className="relative"
        initial={{ scale: 0.6, opacity: 0, rotateX: -25, rotateY: -10, z: -100 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0, rotateY: 0, z: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: 'translateZ(80px)',
          animation: 'float 6s ease-in-out infinite'
        }}
      >
        {/* Glass morphism card with enhanced depth */}
        <div 
          className="relative backdrop-blur-xl rounded-3xl p-10 shadow-2xl max-w-md w-full mx-4 border border-white/30"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(59, 130, 246, 0.1) 100%)',
            boxShadow: `
              0 32px 64px -12px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1),
              0 0 50px rgba(59, 130, 246, 0.2)
            `,
            transformStyle: 'preserve-3d',
            transform: 'translateZ(20px)'
          }}
        >
          {/* Enhanced inner glow effects */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-40"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.4), transparent 60%),
                radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.3), transparent 60%),
                radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1), transparent 70%)
              `
            }}
          />
          
          {/* Animated border glow */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-50"
            style={{
              background: 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
              animation: 'glow 3s ease-in-out infinite alternate'
            }}
          />

          {/* Logo with enhanced 3D effect */}
          <motion.div 
            className="flex items-center justify-center mb-8 relative z-10"
            initial={{ scale: 0, rotateY: 180, z: -50 }}
            animate={{ scale: 1, rotateY: 0, z: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative">
              <img 
                src="/favicon.ico" 
                alt="930 Logo" 
                className="w-16 h-16 drop-shadow-2xl" 
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))',
                  transform: 'translateZ(30px)'
                }}
              />
              <div 
                className="absolute inset-0 rounded-full opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.3) 50%, transparent 70%)',
                  filter: 'blur(12px)',
                  transform: 'translateZ(-10px) scale(1.5)'
                }}
              />
            </div>
          </motion.div>

          {/* Content */}
          <div className="text-center text-white relative z-10">
            <motion.h1 
              className="text-3xl font-bold mb-3"
              initial={{ y: 30, opacity: 0, rotateX: -20 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ 
                textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 30px rgba(59, 130, 246, 0.5)',
                background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #ddd6fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transform: 'translateZ(20px)'
              }}
            >
              CircuitPilot
            </motion.h1>
            <motion.p 
              className="text-white/90 text-base mb-8 font-medium"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{ 
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transform: 'translateZ(15px)'
              }}
            >
              Professional robot wiring design tool for FRC Team 930
            </motion.p>
            
            {/* Enhanced Progress Bar */}
            <motion.div 
              className="mb-8"
              initial={{ scaleX: 0, opacity: 0, rotateX: -10 }}
              animate={{ scaleX: 1, opacity: 1, rotateX: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div 
                className="bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/30"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(255,255,255,0.1)',
                  transform: 'translateZ(10px)'
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(59, 130, 246, 1) 50%, rgba(147, 51, 234, 0.8) 100%)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <motion.p 
                className="text-sm text-white/80 mt-3 font-medium"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ 
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  transform: 'translateZ(5px)'
                }}
              >
                {steps[currentStep]}
              </motion.p>
            </motion.div>

            {/* Buttons */}
            <motion.div 
              className="flex items-center justify-between"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {/* Social Buttons */}
              <div className="flex gap-3">
                {/* GitHub Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://github.com/AsherVerLee/930-Wire-Plotting-tool', '_blank');
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20"
                  style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(0px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
                    e.currentTarget.style.transform = 'translateZ(-3px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)';
                    e.currentTarget.style.transform = 'translateZ(0px) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-8px) scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-3px) scale(1.05)';
                  }}
                >
                  <svg className="w-5 h-5 fill-white drop-shadow-sm" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
                
                {/* Team 930 Website Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://www.team930.com', '_blank');
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20"
                  style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(0px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
                    e.currentTarget.style.transform = 'translateZ(-3px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)';
                    e.currentTarget.style.transform = 'translateZ(0px) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-8px) scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-3px) scale(1.05)';
                  }}
                >
                  <span className="text-sm font-bold text-white drop-shadow-sm">930</span>
                </button>
              </div>

              {/* Continue Button */}
              {isLoadingComplete && (
                <motion.button
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  onClick={handleContinue}
                  className="px-6 py-2 bg-white/90 text-blue-600 rounded-full font-semibold text-sm transition-all duration-200 backdrop-blur-sm border border-white/30"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(0px)',
                    textShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.transform = 'translateZ(-3px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateZ(0px) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-8px) scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-3px) scale(1.05)';
                  }}
                >
                  Continue →
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
