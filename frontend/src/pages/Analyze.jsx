import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AudioWaveform,
  ShieldCheck,
  ShieldAlert,
  ScanSearch,
  Activity,
  LockKeyhole,
  ArrowDown,
  Server,
  CircleCheck,
  Zap,
  Mic,
  Radio,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Play,
  Pause,
  Volume2,
  Gauge,
  Target,
  Brain,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Shield,
} from 'lucide-react';

import { useAnalysis } from '../context/AnalysisContext';
import Navbar from '../components/Navbar';
import AudioUploader from '../components/AudioUploader';
import PredictionCard from '../components/PredictionCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

function SectionLabel({ children, icon: Icon = Activity }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase">
      <Icon className="w-3.5 h-3.5 text-emerald-400" />
      <span>{children}</span>
    </div>
  );
}

function CapabilityCard({ icon: Icon, title, text, badge, color = 'emerald' }) {
  const colorMap = {
    emerald: 'hover:border-emerald-500/40 bg-emerald-500/5',
    blue: 'hover:border-blue-500/40 bg-blue-500/5',
    purple: 'hover:border-purple-500/40 bg-purple-500/5',
  };

  return (
    <motion.div 
      className={`group border border-slate-800 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg ${colorMap[color]}`}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-semibold text-emerald-400 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-200 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        {text}
      </p>
    </motion.div>
  );
}

function LiveStatusIndicator() {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
      <div className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </div>
      <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-wider">
        Live Analysis Ready
      </span>
      <span className="w-px h-4 bg-emerald-500/20" />
      <span className="text-[8px] text-emerald-400/60">v3.2</span>
    </div>
  );
}

export default function Analyze() {
  const {
    analysisStatus,
    analysisResult,
    error,
    runAnalysis,
    clearSelectedFile,
  } = useAnalysis();
const navigate = useNavigate();
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const isProcessing = analysisStatus === 'processing';
  const hasResult = analysisStatus === 'success' && analysisResult;
  const hasError = analysisStatus === 'error';

  // Simulate processing progress and step animation
  useEffect(() => {
    if (isProcessing) {
      let step = 0;
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + 1.5;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Update active step based on progress
          const newStep = Math.min(Math.floor(newProgress / 25), 3);
          setActiveStep(newStep);
          return newProgress;
        });
      }, 80);
      return () => clearInterval(interval);
    } else {
      setProcessingProgress(0);
      setActiveStep(0);
    }
  }, [isProcessing]);

  const quickStats = [
    { label: 'Model Accuracy', value: '96.4%', change: '+1.2%', icon: Target },
    { label: 'Avg Processing', value: '0.8s', change: '-0.2s', icon: Gauge },
    { label: 'Threats Blocked', value: '1.2K', change: '+8%', icon: ShieldAlert },
  ];

  const pipelineSteps = [
    { id: 0, icon: Upload, title: 'Ingestion', description: 'Audio received & normalized' },
    { id: 1, icon: Brain, title: 'Detection', description: 'Synthetic speech analysis' },
    { id: 2, icon: Gauge, title: 'Assessment', description: 'Risk evaluation' },
    { id: 3, icon: ShieldCheck, title: 'Protection', description: 'Actionable insights' },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SectionLabel icon={ScanSearch}>
                  Anahat / Analysis Engine
                </SectionLabel>
                <LiveStatusIndicator />
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Voice Authenticity
                <span className="text-emerald-400"> Analysis</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
                Real-time detection of synthetic speech, voice cloning, and impersonation 
                threats. Upload a recording or monitor a live stream for instant protection.
              </p>
            </div>

           
          </div>
        </motion.section>

        {/* Result / Processing / Ready State */}
        {hasResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PredictionCard
              result={analysisResult}
              onReset={clearSelectedFile}
            />
          </motion.div>
        ) : isProcessing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <LoadingState />
            
            {/* Unified Pipeline Visualization */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-semibold tracking-[0.15em] text-slate-300 uppercase">
                    Processing Pipeline
                  </span>
                  <span className="ml-auto text-[9px] text-slate-500">{Math.round(processingProgress)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Pipeline Steps */}
                <div className="grid grid-cols-4 gap-3">
                  {pipelineSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isComplete = idx < activeStep;
                    const isActive = idx === activeStep;
                    
                    return (
                      <div key={step.id} className="relative">
                        <div className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                          isComplete ? 'bg-emerald-500/10 border border-emerald-500/20' :
                          isActive ? 'bg-emerald-500/5 border border-emerald-500/30' :
                          'bg-slate-800/30 border border-slate-800'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                            isComplete ? 'bg-emerald-500/20 text-emerald-400' :
                            isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            'bg-slate-800/50 text-slate-600'
                          }`}>
                            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>
                          <p className={`text-[10px] font-semibold tracking-wide ${
                            isComplete || isActive ? 'text-slate-200' : 'text-slate-500'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-[8px] text-slate-500 mt-0.5 leading-tight">
                            {step.description}
                          </p>
                          {isActive && (
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                          {isComplete && (
                            <span className="mt-2 text-[8px] text-emerald-400 font-medium uppercase tracking-wider">Done</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : hasError ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ErrorState error={error} onRetry={runAnalysis} />
          </motion.div>
        ) : (
          /* Ready State */
          <div className="space-y-8">

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4"
            >
              {quickStats.map((stat, idx) => {
                const Icon = stat.icon;
                const isPositive = stat.change.startsWith('+');
                return (
                  <motion.div
                    key={stat.label}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4"
                    whileHover={{ y: -2 }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Main Workspace */}
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6"
            >
              {/* Upload Panel */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <AudioWaveform className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.15em] text-slate-300 uppercase">
                      Audio Input
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] font-mono text-slate-500">READY</span>
                  </div>
                </div>

                {/* Upload Area */}
                <div className="p-6 sm:p-8">
                  <AudioUploader />
                </div>
              </div>

              {/* Analysis Info Panel */}
              <div className="space-y-4">
                {/* Capabilities Preview */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <SectionLabel icon={Activity}>Core Capabilities</SectionLabel>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Voice Signal Analysis</p>
                        <p className="text-[9px] text-slate-500">Advanced waveform pattern detection</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Synthetic Detection</p>
                        <p className="text-[9px] text-slate-500">AI-powered clone identification</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Target className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Threat Response</p>
                        <p className="text-[9px] text-slate-500">Instant risk classification</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Enterprise-grade security
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Status */}
                <motion.div
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-200">Live Detection Active</p>
                      <p className="text-[10px] text-slate-500">Monitoring for voice threats in real-time</p>
                    </div>
                   <motion.button
  type="button"
  onClick={() => navigate('/live')}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
>
  View
</motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.section>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1"
            >
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <ArrowDown className="w-3 h-3 text-emerald-400" />
                <span>Upload a recording to begin authenticity analysis</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span className="tracking-wider">Near-real-time analysis pipeline</span>
              </div>
            </motion.div>
          </div>
        )}
      </main>
      
    </div>
  );
}