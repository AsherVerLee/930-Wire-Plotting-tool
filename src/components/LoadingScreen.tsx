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

  // Simple circuit board with light blue angular traces and animated electrons
  const CircuitBoardSVG = () => (
    <svg className="absolute inset-0 w-full h-full opacity-20">
      <defs>
        <pattern id="circuit" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
          {/* Angular circuit traces in light blue */}
          <path 
            d="M 0,80 L 60,80 L 100,40 L 160,40 L 200,80 L 300,80" 
            stroke="rgba(147, 197, 253, 0.8)" 
            strokeWidth="1.5" 
            fill="none"
          />
          <path 
            d="M 0,150 L 40,150 L 80,110 L 140,110 L 180,150 L 220,110 L 280,110 L 300,150" 
            stroke="rgba(147, 197, 253, 0.6)" 
            strokeWidth="1.2" 
            fill="none"
          />
          <path 
            d="M 0,220 L 80,220 L 120,180 L 180,180 L 220,220 L 300,220" 
            stroke="rgba(147, 197, 253, 0.7)" 
            strokeWidth="1.3" 
            fill="none"
          />
          
          {/* Vertical traces */}
          <path 
            d="M 100,0 L 100,40 M 100,60 L 100,110 M 100,130 L 100,180 M 100,200 L 100,300" 
            stroke="rgba(147, 197, 253, 0.5)" 
            strokeWidth="1" 
            fill="none"
          />
          <path 
            d="M 200,0 L 200,40 M 200,60 L 200,110 M 200,130 L 200,180 M 200,200 L 200,300" 
            stroke="rgba(147, 197, 253, 0.4)" 
            strokeWidth="1" 
            fill="none"
          />
          
          {/* Animated electrons */}
          <circle r="2" fill="rgba(59, 130, 246, 0.9)">
            <animateMotion dur="4s" repeatCount="indefinite">
              <path d="M 0,80 L 60,80 L 100,40 L 160,40 L 200,80 L 300,80"/>
            </animateMotion>
          </circle>
          <circle r="1.5" fill="rgba(59, 130, 246, 0.7)">
            <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
              <path d="M 0,150 L 40,150 L 80,110 L 140,110 L 180,150 L 220,110 L 280,110 L 300,150"/>
            </animateMotion>
          </circle>
          <circle r="1.8" fill="rgba(59, 130, 246, 0.8)">
            <animateMotion dur="3.5s" repeatCount="indefinite" begin="0.5s">
              <path d="M 0,220 L 80,220 L 120,180 L 180,180 L 220,220 L 300,220"/>
            </animateMotion>
          </circle>
          
          {/* Simple connection nodes */}
          <circle cx="100" cy="80" r="3" fill="rgba(59, 130, 246, 0.6)" opacity="0.8"/>
          <circle cx="200" cy="150" r="2.5" fill="rgba(59, 130, 246, 0.5)" opacity="0.7"/>
          <circle cx="180" cy="220" r="2.8" fill="rgba(59, 130, 246, 0.6)" opacity="0.7"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)"/>
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center z-50"
      style={{ perspective: '1000px' }}
    >
      {/* Lighter blue circuit board background */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, rgba(30, 64, 175, 0.3) 100%)'
        }}
      >
        <CircuitBoardSVG />
      </motion.div>

      {/* Enhanced floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1 + 'px',
            height: Math.random() * 4 + 1 + 'px',
            backgroundColor: `rgba(0, 191, 255, ${Math.random() * 0.6 + 0.3})`,
            filter: 'blur(0.8px)',
            boxShadow: '0 0 6px rgba(0, 191, 255, 0.8)'
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
            duration: 10 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3 
          }}
        />
      ))}

      {/* 3D Card Container with stylish entrance */}
      <motion.div
        className="relative"
        style={{ 
          width: '320px', 
          height: '380px', 
          perspective: '1000px' 
        }}
        initial={{ 
          scale: 0.3, 
          opacity: 0, 
          rotateX: -90, 
          rotateY: 45,
          z: -200
        }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          rotateX: 0, 
          rotateY: 0,
          z: 0
        }}
        transition={{ 
          duration: 1.5, 
          ease: [0.175, 0.885, 0.32, 1.275],
          delay: 0.5
        }}
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
          // Animate logo circles with enhanced ripple effect
          const circles = e.currentTarget.querySelectorAll('.logo-circle');
          circles.forEach((circle: any, i) => {
            setTimeout(() => {
              const currentZ = 30 + (i * 25);
              circle.style.transform = `translate3d(${(i * 2) - 5}px, ${(i * 2) - 5}px, ${currentZ + 40}px) scale(1.15)`;
              circle.style.background = `
                linear-gradient(145deg, 
                  rgba(255, 255, 255, 0.4) 0%,
                  rgba(255, 255, 255, 0.2) 25%,
                  rgba(0, 191, 255, 0.3) 50%,
                  rgba(255, 255, 255, 0.1) 75%,
                  rgba(0, 191, 255, 0.4) 100%
                )
              `;
              circle.style.boxShadow = `
                0 12px 48px rgba(0, 191, 255, 0.4),
                inset 0 2px 0 rgba(255, 255, 255, 0.5),
                inset 0 -2px 0 rgba(0, 0, 0, 0.2),
                0 0 40px rgba(0, 191, 255, 0.6)
              `;
            }, i * 100);
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
            const currentZ = 30 + (i * 25);
            circle.style.transform = `translate3d(${i * 2}px, ${i * 2}px, ${currentZ}px) scale(1)`;
            circle.style.background = `
              linear-gradient(145deg, 
                rgba(255, 255, 255, 0.25) 0%,
                rgba(255, 255, 255, 0.1) 25%,
                rgba(0, 191, 255, 0.15) 50%,
                rgba(255, 255, 255, 0.05) 75%,
                rgba(0, 191, 255, 0.2) 100%
              )
            `;
            circle.style.boxShadow = `
              0 8px 32px rgba(0, 191, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1),
              0 0 20px rgba(0, 191, 255, 0.3)
            `;
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

          {/* Enhanced glassy logo circles that pop off the card */}
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
                  background: `
                    linear-gradient(145deg, 
                      rgba(255, 255, 255, 0.25) 0%,
                      rgba(255, 255, 255, 0.1) 25%,
                      rgba(0, 191, 255, 0.15) 50%,
                      rgba(255, 255, 255, 0.05) 75%,
                      rgba(0, 191, 255, 0.2) 100%
                    )
                  `,
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 8px 32px rgba(0, 191, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                    0 0 20px rgba(0, 191, 255, 0.3)
                  `,
                  transform: `translate3d(${i * 2}px, ${i * 2}px, ${30 + (i * 25)}px)`,
                  transformStyle: 'preserve-3d',
                  transitionDelay: `${i * 0.1}s`
                }}
              >
                {i === 4 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.img 
                      src="/favicon.ico" 
                      alt="CircuitPilot Logo" 
                      className="w-10 h-10"
                      style={{ 
                        filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                    />
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
            {/* Social buttons - made larger */}
            <div className="flex gap-4" style={{ transformStyle: 'preserve-3d' }}>
              {/* GitHub Button */}
              <motion.button
                className="social-btn w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-200 ease-in-out border border-white/10"
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
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#3b82f6';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = '#fde047';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(0.95)';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#000000';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1.1)';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
              >
                <svg className="w-6 h-6 transition-colors duration-200" viewBox="0 0 24 24" style={{ fill: '#3b82f6' }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.button>

              {/* Team 930 Button */}
              <motion.button
                className="social-btn w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-200 ease-in-out border border-white/10"
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
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#3b82f6';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = '#fde047';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(0.95)';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#000000';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1.1)';
                  const span = e.currentTarget.querySelector('span');
                  if (span) span.style.color = '#ffffff';
                }}
              >
                <span className="text-sm font-bold transition-colors duration-200" style={{ color: '#3b82f6' }}>930</span>
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
};
