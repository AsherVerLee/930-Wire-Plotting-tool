import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const particlesContainerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
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
    }, 1200); // Increased to match the fade duration
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

  // Particle system setup
  useEffect(() => {
    const particlesContainer = particlesContainerRef.current;
    if (!particlesContainer) return;

    const particleCount = 80;
    const particles: HTMLDivElement[] = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }

    function createParticle() {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full bg-white opacity-0 pointer-events-none';
      
      // Random size (small)
      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Initial position
      resetParticle(particle);
      
      particlesContainer.appendChild(particle);
      particles.push(particle);
      
      // Animate
      animateParticle(particle);
    }

    function resetParticle(particle: HTMLDivElement) {
      // Random position
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.opacity = '0';
      
      return { x: posX, y: posY };
    }

    function animateParticle(particle: HTMLDivElement) {
      // Initial position
      const pos = resetParticle(particle);
      
      // Random animation properties
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;
      
      // Animate with timing
      setTimeout(() => {
        particle.style.transition = `all ${duration}s linear`;
        particle.style.opacity = String(Math.random() * 0.3 + 0.1);
        
        // Move in a slight direction
        const moveX = pos.x + (Math.random() * 20 - 10);
        const moveY = pos.y - Math.random() * 30; // Move upwards
        
        particle.style.left = `${moveX}%`;
        particle.style.top = `${moveY}%`;
        
        // Reset after animation completes
        setTimeout(() => {
          animateParticle(particle);
        }, duration * 1000);
      }, delay * 1000);
    }

    // Cleanup function
    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent) => {
    const mouseX = (e.clientX / window.innerWidth) * 100;
    const mouseY = (e.clientY / window.innerHeight) * 100;
    
    setMousePosition({ x: e.clientX, y: e.clientY });

    // Create temporary particle at mouse position
    const particlesContainer = particlesContainerRef.current;
    if (particlesContainer) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full bg-white pointer-events-none';
      
      // Small size
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Position at mouse
      particle.style.left = `${mouseX}%`;
      particle.style.top = `${mouseY}%`;
      particle.style.opacity = '0.6';
      
      particlesContainer.appendChild(particle);
      
      // Animate outward
      setTimeout(() => {
        particle.style.transition = 'all 2s ease-out';
        particle.style.left = `${mouseX + (Math.random() * 10 - 5)}%`;
        particle.style.top = `${mouseY + (Math.random() * 10 - 5)}%`;
        particle.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 2000);
      }, 10);
    }
  };

  // Modern gradient background component
  const ModernGradientBackground = () => {
    const moveX = mousePosition.x && typeof window !== 'undefined' ? (mousePosition.x / window.innerWidth - 0.5) * 5 : 0;
    const moveY = mousePosition.y && typeof window !== 'undefined' ? (mousePosition.y / window.innerHeight - 0.5) * 5 : 0;

    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Spheres */}
        <motion.div
          className="absolute rounded-full blur-[60px]"
          style={{
            width: '40vw',
            height: '40vw',
            background: 'linear-gradient(40deg, rgba(255, 0, 128, 0.3), rgba(255, 102, 0, 0.2))',
            top: '-10%',
            left: '-10%',
            transform: `translate(${moveX}px, ${moveY}px)`,
          }}
          animate={{
            x: ['0%', '10%', '0%'],
            y: ['0%', '10%', '0%'],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute rounded-full blur-[60px]"
          style={{
            width: '45vw',
            height: '45vw',
            background: 'linear-gradient(240deg, rgba(72, 0, 255, 0.3), rgba(0, 183, 255, 0.2))',
            bottom: '-20%',
            right: '-10%',
            transform: `translate(${-moveX}px, ${-moveY}px)`,
          }}
          animate={{
            x: ['0%', '-10%', '0%'],
            y: ['0%', '-5%', '0%'],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute rounded-full blur-[60px]"
          style={{
            width: '30vw',
            height: '30vw',
            background: 'linear-gradient(120deg, rgba(133, 89, 255, 0.25), rgba(98, 216, 249, 0.15))',
            top: '60%',
            left: '20%',
            transform: `translate(${moveX * 0.5}px, ${moveY * 0.5}px)`,
          }}
          animate={{
            x: ['0%', '-5%', '0%'],
            y: ['0%', '10%', '0%'],
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Central Glow */}
        <motion.div
          className="absolute blur-[30px]"
          style={{
            width: '40vw',
            height: '40vh',
            background: 'radial-gradient(circle, rgba(72, 0, 255, 0.15), transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Grid Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundSize: '40px 40px',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
          }}
        />

        {/* Noise Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Particles Container */}
        <div ref={particlesContainerRef} className="absolute inset-0 pointer-events-none" />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isExiting ? 1.2 : 0.5, ease: "easeInOut" }}
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
    >
      {/* Modern Gradient Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isExiting ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        transition={{ duration: isExiting ? 1.2 : 2, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <ModernGradientBackground />
      </motion.div>

      {/* 3D Card Container */}
      <motion.div
        className="parent"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isExiting ? { scale: 0.7, opacity: 0, y: 50 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: isExiting ? 1.2 : 0.8, ease: "easeOut" }}
      >
        <div className="card">
          <div className="logo">
            <span className="circle circle1"></span>
            <span className="circle circle2"></span>
            <span className="circle circle3"></span>
            <span className="circle circle4"></span>
            <span className="circle circle5">
              <span className="team-logo">930</span>
            </span>
          </div>
          <div className="glass"></div>
          <div className="content">
            <motion.span 
              className="title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              CircuitPilot
            </motion.span>
            <motion.span 
              className="text"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Professional robot wiring design tool for FRC Team 930
            </motion.span>
            
            {/* Progress Section */}
            <motion.div 
              className="progress-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="progress-text">{steps[currentStep]}</p>
            </motion.div>
          </div>
          <div className="bottom">
            <div className="social-buttons-container">
              {/* GitHub Button */}
              <motion.button
                className="social-button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://github.com/AsherVerLee/930-Wire-Plotting-tool', '_blank');
                }}
              >
                <svg className="svg" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.button>

              {/* Team 930 Button */}
              <motion.button
                className="social-button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.team930.com', '_blank');
                }}
              >
                <span className="team-number">930</span>
              </motion.button>
            </div>
            
            {/* Continue Button */}
            {isLoadingComplete && (
              <div className="view-more">
                <motion.button
                  className="view-more-button"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  onClick={handleContinue}
                >
                  Continue
                </motion.button>
                <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      <style>{`
        /* Based on Uiverse.io by Smit-Prajapati */
        .parent {
          width: 320px;
          height: 380px;
          perspective: 1000px;
          position: relative;
          z-index: 10;
        }

        .card {
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%);
          transition: all 0.5s ease-in-out;
          transform-style: preserve-3d;
          box-shadow: rgba(59, 130, 246, 0) 40px 50px 25px -40px, rgba(59, 130, 246, 0.2) 0px 25px 25px -5px;
        }

        .glass {
          transform-style: preserve-3d;
          position: absolute;
          inset: 8px;
          border-radius: 45px;
          border-top-right-radius: 100%;
          background: linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.3) 100%);
          transform: translate3d(0px, 0px, 25px);
          border-left: 1px solid white;
          border-bottom: 1px solid white;
          transition: all 0.5s ease-in-out;
        }

        .content {
          padding: 100px 60px 0px 30px;
          transform: translate3d(0, 0, 26px);
        }

        .content .title {
          display: block;
          color: #ffffff;
          font-weight: 900;
          font-size: 20px;
        }

        .content .text {
          display: block;
          color: rgba(255, 255, 255, 0.8);
          font-size: 15px;
          margin-top: 20px;
        }

        .progress-section {
          margin-top: 40px;
        }

        .progress-bar {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: white;
          border-radius: 10px;
          transition: width 0.1s ease;
        }

        .progress-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          margin: 0;
        }

        .bottom {
          padding: 10px 12px;
          transform-style: preserve-3d;
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transform: translate3d(0, 0, 26px);
        }

        .bottom .view-more {
          display: flex;
          align-items: center;
          width: 40%;
          justify-content: flex-end;
          transition: all 0.2s ease-in-out;
        }

        .bottom .view-more:hover {
          transform: translate3d(0, 0, 10px);
        }

        .bottom .view-more .view-more-button {
          background: none;
          border: none;
          color: #ffffff;
          font-weight: bolder;
          font-size: 12px;
          cursor: pointer;
        }

        .bottom .view-more .svg {
          fill: none;
          stroke: #ffffff;
          stroke-width: 3px;
          max-height: 15px;
          width: 15px;
        }

        .bottom .social-buttons-container {
          display: flex;
          gap: 10px;
          transform-style: preserve-3d;
        }

        .bottom .social-buttons-container .social-button {
          width: 40px;
          aspect-ratio: 1;
          padding: 8px;
          background: rgb(255, 255, 255);
          border-radius: 50%;
          border: none;
          display: grid;
          place-content: center;
          box-shadow: rgba(59, 130, 246, 0.5) 0px 7px 5px -5px;
          cursor: pointer;
        }

        .bottom .social-buttons-container .social-button:first-child {
          transition: transform 0.2s ease-in-out 0.4s, box-shadow 0.2s ease-in-out 0.4s, background-color 0.2s ease-in-out;
        }

        .bottom .social-buttons-container .social-button:nth-child(2) {
          transition: transform 0.2s ease-in-out 0.6s, box-shadow 0.2s ease-in-out 0.6s, background-color 0.2s ease-in-out;
        }

        .bottom .social-buttons-container .social-button .svg {
          width: 20px;
          fill: #3b82f6;
        }

        .bottom .social-buttons-container .social-button .team-number {
          color: #3b82f6;
          font-weight: bold;
          font-size: 14px;
        }

        .bottom .social-buttons-container .social-button:hover {
          background: black;
        }

        .bottom .social-buttons-container .social-button:hover .svg {
          fill: white;
        }

        .bottom .social-buttons-container .social-button:hover .team-number {
          color: white;
        }

        .bottom .social-buttons-container .social-button:active {
          background: rgb(255, 234, 0);
        }

        .bottom .social-buttons-container .social-button:active .svg {
          fill: black;
        }

        .bottom .social-buttons-container .social-button:active .team-number {
          color: black;
        }

        .logo {
          position: absolute;
          right: 0;
          top: 0;
          transform-style: preserve-3d;
        }

        .logo .circle {
          display: block;
          position: absolute;
          aspect-ratio: 1;
          border-radius: 50%;
          top: 0;
          right: 0;
          box-shadow: rgba(255, 255, 255, 0.1) -5px 5px 15px 0px;
          -webkit-backdrop-filter: blur(1px);
          backdrop-filter: blur(1px);
          background: transparent;
          transition: all 0.5s ease-in-out;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo .circle1 {
          width: 170px;
          transform: translate3d(0, 0, 20px);
          top: 8px;
          right: 8px;
        }

        .logo .circle2 {
          width: 140px;
          transform: translate3d(0, 0, 40px);
          top: 13px;
          right: 13px;
          transition-delay: 0.4s;
        }

        .logo .circle3 {
          width: 110px;
          transform: translate3d(0, 0, 60px);
          top: 23px;
          right: 23px;
          transition-delay: 0.8s;
        }

        .logo .circle4 {
          width: 80px;
          transform: translate3d(0, 0, 80px);
          top: 33px;
          right: 33px;
          transition-delay: 1.2s;
        }

        .logo .circle5 {
          width: 50px;
          transform: translate3d(0, 0, 100px);
          top: 43px;
          right: 43px;
          display: grid;
          place-content: center;
          transition-delay: 1.6s;
        }

        .logo .circle5 .team-logo {
          color: white;
          font-weight: 900;
          font-size: 16px;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .parent:hover .card {
          transform: rotate3d(1, 1, 0, 30deg);
          box-shadow: rgba(59, 130, 246, 0.3) 30px 50px 25px -40px, rgba(59, 130, 246, 0.1) 0px 25px 30px 0px;
        }

        .parent:hover .card .bottom .social-buttons-container .social-button {
          transform: translate3d(0, 0, 50px);
          box-shadow: rgba(59, 130, 246, 0.2) -5px 20px 10px 0px;
        }

        .parent:hover .card .logo .circle2 {
          transform: translate3d(0, 0, 60px);
        }

        .parent:hover .card .logo .circle3 {
          transform: translate3d(0, 0, 80px);
        }

        .parent:hover .card .logo .circle4 {
          transform: translate3d(0, 0, 100px);
        }

        .parent:hover .card .logo .circle5 {
          transform: translate3d(0, 0, 120px);
        }
      `}</style>
    </motion.div>
  );
};
