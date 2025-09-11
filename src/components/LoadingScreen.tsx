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

  // Simple circuit board with 45-degree and straight traces like real PCBs
  const CircuitBoardSVG = () => (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" preserveAspectRatio="none">
      <defs>
        <linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#93c5fd"/>
        </linearGradient>
      </defs>
      
      {/* Circuit board traces - 45 degree and straight lines */}
      <g stroke="url(#traceGradient)" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round">
        {/* Horizontal traces */}
        <line x1="0" y1="150" x2="1200" y2="150" />
        <line x1="0" y1="250" x2="1200" y2="250" />
        <line x1="0" y1="350" x2="1200" y2="350" />
        <line x1="0" y1="450" x2="1200" y2="450" />
        <line x1="0" y1="550" x2="1200" y2="550" />
        <line x1="0" y1="650" x2="1200" y2="650" />
        
        {/* Vertical traces */}
        <line x1="200" y1="0" x2="200" y2="800" />
        <line x1="350" y1="0" x2="350" y2="800" />
        <line x1="500" y1="0" x2="500" y2="800" />
        <line x1="650" y1="0" x2="650" y2="800" />
        <line x1="800" y1="0" x2="800" y2="800" />
        <line x1="950" y1="0" x2="950" y2="800" />
        
        {/* 45-degree diagonal traces */}
        <line x1="0" y1="0" x2="400" y2="400" />
        <line x1="200" y1="0" x2="600" y2="400" />
        <line x1="400" y1="0" x2="800" y2="400" />
        <line x1="600" y1="0" x2="1000" y2="400" />
        <line x1="800" y1="0" x2="1200" y2="400" />
        
        {/* -45-degree diagonal traces */}
        <line x1="400" y1="0" x2="0" y2="400" />
        <line x1="600" y1="0" x2="200" y2="400" />
        <line x1="800" y1="0" x2="400" y2="400" />
        <line x1="1000" y1="0" x2="600" y2="400" />
        <line x1="1200" y1="0" x2="800" y2="400" />
        
        {/* More 45-degree traces for density */}
        <line x1="0" y1="400" x2="400" y2="800" />
        <line x1="200" y1="400" x2="600" y2="800" />
        <line x1="400" y1="400" x2="800" y2="800" />
        <line x1="600" y1="400" x2="1000" y2="800" />
        <line x1="800" y1="400" x2="1200" y2="800" />
        
        <line x1="400" y1="400" x2="0" y2="800" />
        <line x1="600" y1="400" x2="200" y2="800" />
        <line x1="800" y1="400" x2="400" y2="800" />
        <line x1="1000" y1="400" x2="600" y2="800" />
        <line x1="1200" y1="400" x2="800" y2="800" />
      </g>
      
      {/* Connection points at intersections */}
      <g fill="#60a5fa" opacity="0.8">
        {/* Grid intersection points */}
        {[150, 250, 350, 450, 550, 650].map(y => 
          [200, 350, 500, 650, 800, 950].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />
          ))
        )}
      </g>
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center z-50"
      style={{ perspective: '1000px' }}
    >
      {/* Enhanced circuit board background with layered gradients */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 75%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, rgba(30, 64, 175, 0.2) 70%, rgba(15, 23, 42, 0.4) 100%)
          `
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
        className="relative card-container"
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
            card.style.transform = 'rotate3d(1, 1, 0, 30deg)';
            card.style.boxShadow = '0 50px 80px -20px rgba(59, 130, 246, 0.4), 0 30px 60px rgba(59, 130, 246, 0.3)';
          }
          // Animate social buttons with staggered delays
          const buttons = e.currentTarget.querySelectorAll('.social-btn');
          buttons.forEach((btn: any, i) => {
            setTimeout(() => {
              btn.style.transform = 'translate3d(0, 0, 15px)';
              btn.style.boxShadow = '0 20px 25px rgba(59, 130, 246, 0.4)';
            }, i * 100 + 100); // Much faster staggered timing
          });
          // Animate logo circles with subtle movement
          const circles = e.currentTarget.querySelectorAll('.logo-circle');
          circles.forEach((circle: any, i) => {
            if (i === 0) {
              // Circle 1: 20px -> 35px
              circle.style.transform = 'translate3d(0, 0, 35px)';
            } else if (i === 1) {
              // Circle 2: 40px -> 50px
              circle.style.transform = 'translate3d(0, 0, 50px)';
            } else if (i === 2) {
              // Circle 3: 60px -> 70px
              circle.style.transform = 'translate3d(0, 0, 70px)';
            } else if (i === 3) {
              // Circle 4: 80px -> 90px
              circle.style.transform = 'translate3d(0, 0, 90px)';
            } else if (i === 4) {
              // Circle 5: 100px -> 110px
              circle.style.transform = 'translate3d(0, 0, 110px)';
            }
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
          // Reset logo circles to original positions
          const circles = e.currentTarget.querySelectorAll('.logo-circle');
          circles.forEach((circle: any, i) => {
            if (i === 0) {
              // Circle 1
              circle.style.transform = 'translate3d(0, 0, 20px)';
            } else if (i === 1) {
              // Circle 2
              circle.style.transform = 'translate3d(0, 0, 40px)';
            } else if (i === 2) {
              // Circle 3
              circle.style.transform = 'translate3d(0, 0, 60px)';
            } else if (i === 3) {
              // Circle 4
              circle.style.transform = 'translate3d(0, 0, 80px)';
            } else if (i === 4) {
              // Circle 5
              circle.style.transform = 'translate3d(0, 0, 100px)';
            }
          });
        }}
      >
        {/* Main Card */}
        <div 
          className="card-inner relative w-full h-full rounded-[50px] transition-all duration-500 ease-in-out"
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

          {/* Logo bubbles - positioned more on the card */}
          <div className="absolute" style={{ 
            top: '10px', 
            right: '10px', 
            transformStyle: 'preserve-3d',
            width: '200px',
            height: '200px'
          }}>
            {/* Circle 1 - largest */}
            <div
              className="logo-circle absolute rounded-full"
              style={{
                width: '170px',
                height: '170px',
                top: '5px',
                right: '5px',
                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.25) 100%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'rgba(255, 255, 255, 0.1) -5px 5px 15px 0px',
                transform: 'translate3d(0, 0, 20px)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.5s ease-in-out'
              }}
            />
            
            {/* Circle 2 */}
            <div
              className="logo-circle absolute rounded-full"
              style={{
                width: '140px',
                height: '140px',
                top: '20px',
                right: '20px',
                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.25) 100%)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'rgba(255, 255, 255, 0.1) -5px 5px 15px 0px',
                transform: 'translate3d(0, 0, 40px)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.5s ease-in-out',
                transitionDelay: '0.4s'
              }}
            />
            
            {/* Circle 3 */}
            <div
              className="logo-circle absolute rounded-full"
              style={{
                width: '110px',
                height: '110px',
                top: '35px',
                right: '35px',
                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.25) 100%)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'rgba(255, 255, 255, 0.1) -5px 5px 15px 0px',
                transform: 'translate3d(0, 0, 60px)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.5s ease-in-out',
                transitionDelay: '0.8s'
              }}
            />
            
            {/* Circle 4 */}
            <div
              className="logo-circle absolute rounded-full"
              style={{
                width: '80px',
                height: '80px',
                top: '50px',
                right: '50px',
                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.25) 100%)',
                backdropFilter: 'blur(1px)',
                WebkitBackdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'rgba(255, 255, 255, 0.1) -5px 5px 15px 0px',
                transform: 'translate3d(0, 0, 80px)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.5s ease-in-out',
                transitionDelay: '1.2s'
              }}
            />
            
            {/* Circle 5 - smallest with logo (no blur for text readability) */}
            <div
              className="logo-circle absolute rounded-full flex items-center justify-center"
              style={{
                width: '50px',
                height: '50px',
                top: '65px',
                right: '65px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
                backdropFilter: 'blur(0.5px)',
                WebkitBackdropFilter: 'blur(0.5px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: 'rgba(255, 255, 255, 0.1) -5px 5px 15px 0px, inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                transform: 'translate3d(0, 0, 100px)',
                transformStyle: 'preserve-3d',
                transition: 'all 0.5s ease-in-out',
                transitionDelay: '1.6s',
                color: '#ffffff'
              }}
            >
              <motion.span
                className="text-xs font-black"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.5, ease: "easeOut" }}
              >
                930
              </motion.span>
            </div>
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
                className="social-btn w-12 h-12 bg-white rounded-full flex items-center justify-center border border-white/10"
                style={{
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  transformStyle: 'preserve-3d',
                  transform: 'translate3d(0, 0, 0px)',
                  transition: 'transform 0.2s ease-in-out 0.4s, box-shadow 0.2s ease-in-out 0.4s, background-color 0.2s ease-in-out'
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
                className="social-btn w-12 h-12 bg-white rounded-full flex items-center justify-center border border-white/10"
                style={{
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  transformStyle: 'preserve-3d',
                  transform: 'translate3d(0, 0, 0px)',
                  transition: 'transform 0.2s ease-in-out 0.6s, box-shadow 0.2s ease-in-out 0.6s, background-color 0.2s ease-in-out'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.3 }}
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

            {/* Continue Button - Oval button like social buttons */}
            {isLoadingComplete && (
              <motion.button
                className="social-btn flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-white/10"
                style={{
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  transformStyle: 'preserve-3d',
                  transform: 'translate3d(0, 0, 0px)',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out'
                }}
                initial={{ opacity: 0, x: 20, scale: 0 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 1.4 }}
                onClick={handleContinue}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 10px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.4)';
                  const span = e.currentTarget.querySelector('span');
                  const svg = e.currentTarget.querySelector('svg');
                  if (span) span.style.color = '#ffffff';
                  if (svg) svg.style.stroke = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0px) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
                  const span = e.currentTarget.querySelector('span');
                  const svg = e.currentTarget.querySelector('svg');
                  if (span) span.style.color = '#3b82f6';
                  if (svg) svg.style.stroke = '#3b82f6';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 5px) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translate3d(0, 0, 10px) scale(1.05)';
                }}
              >
                <span className="font-bold text-sm transition-colors duration-200" style={{ color: '#3b82f6' }}>
                  Continue
                </span>
                <svg 
                  className="w-4 h-4 fill-none transition-colors duration-200" 
                  strokeWidth="3" 
                  viewBox="0 0 24 24" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ stroke: '#3b82f6' }}
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
      
      <style>{`
        .logo-circle {
          backface-visibility: hidden;
        }
        
        .card-container:hover .logo-circle:nth-child(1) {
          transform: translate3d(5px, -5px, 35px) scale(1.05) !important;
        }
        
        .card-container:hover .logo-circle:nth-child(2) {
          transform: translate3d(4px, -4px, 50px) scale(1.04) !important;
        }
        
        .card-container:hover .logo-circle:nth-child(3) {
          transform: translate3d(3px, -3px, 70px) scale(1.03) !important;
        }
        
        .card-container:hover .logo-circle:nth-child(4) {
          transform: translate3d(2px, -2px, 90px) scale(1.02) !important;
        }
        
        .card-container:hover .logo-circle:nth-child(5) {
          transform: translate3d(0px, 0px, 110px) scale(1.01) !important;
        }
        
        /* Enhanced card hover effect */
        .card-container:hover .card-inner {
          transform: perspective(800px) rotate3d(1, 1, 0, 35deg) !important;
          box-shadow: 
            0 0 120px rgba(59, 130, 246, 0.4),
            0 40px 80px rgba(0, 0, 0, 0.6) !important;
        }
      `}</style>
    </motion.div>
  );
};
