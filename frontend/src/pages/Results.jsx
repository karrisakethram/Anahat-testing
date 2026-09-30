import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import Navbar from '../components/Navbar';
import RiskBadge from '../components/RiskBadge';
import ProbabilityCard from '../components/ProbabilityCard';
import RecommendationCard from '../components/RecommendationCard';
import AudioInfo from '../components/AudioInfo';
import TechnicalAnalysis from '../components/TechnicalAnalysis';
import RawJsonViewer from '../components/RawJsonViewer';
import Card from '../components/Card';
import Button from '../components/Button';
import { exportAnalysisReport } from '../utils/exportReport';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ArrowLeft, 
  RotateCcw, 
  FileAudio,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Download,
  Share2,
  BarChart3,
  PieChart,
  Zap,
  Target,
  Activity,
  Award,
  Brain,
} from 'lucide-react';

export default function Results() {
  const { analysisResult, clearSelectedFile } = useAnalysis();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleAnalyzeNew = () => {
    clearSelectedFile();
    navigate('/analyze');
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // If no analysis result exists yet
  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <Card className="p-8 text-center border-slate-800/50">
              <motion.div 
                className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-400"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                <FileAudio className="w-8 h-8" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                No Analysis Record Found
              </h2>
              <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
                Upload and analyze an audio recording to view detailed security telemetry and authenticity insights.
              </p>
              <Button
                onClick={() => navigate('/analyze')}
                variant="primary"
                size="lg"
                icon={ArrowLeft}
                fullWidth
                className="font-semibold"
              >
                Go to Analyzer
              </Button>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  const isSpoof = analysisResult.prediction === 'Spoof';
  const spoofPercent = Math.round((analysisResult.spoofProbability || 0) * 100);

  // Quick stats for the header
  const quickStats = [
    { label: 'Confidence', value: `${Math.max(spoofPercent, 100 - spoofPercent)}%`, icon: Target },
    { label: 'Risk Level', value: analysisResult.riskLevel || 'Unknown', icon: ShieldAlert },
    { label: 'Processing Time', value: '1.2s', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.02] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/[0.015] blur-3xl" />
      </div>

      <Navbar />

      <main className="relative max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Page Header */}
        <motion.div 
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                Security Analysis Report
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                Page 03
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-400">
                Complete acoustic telemetry and probability classification
              </span>
              <span className="w-px h-4 bg-slate-700" />
              <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              onClick={() => navigate('/analyze')}
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              className="flex-1 lg:flex-none"
            >
              Back
            </Button>
            <Button
              onClick={handleAnalyzeNew}
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              className="flex-1 lg:flex-none"
            >
              New Analysis
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="bg-slate-900/50 border border-slate-800/70 rounded-xl p-3.5"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className={`text-sm font-bold mt-1 ${
                  stat.label === 'Risk Level' && stat.value === 'High' ? 'text-red-400' :
                  stat.label === 'Risk Level' && stat.value === 'Low' ? 'text-emerald-400' :
                  'text-slate-200'
                }`}>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* 1. PREDICTION BANNER */}
        <motion.div
          className={`relative overflow-hidden p-6 sm:p-8 rounded-2xl border shadow-xl ${
            isSpoof
              ? 'bg-gradient-to-br from-red-950/30 to-slate-950 border-red-800/50'
              : 'bg-gradient-to-br from-emerald-950/30 to-slate-950 border-emerald-800/50'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Animated background glow */}
          <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl ${
            isSpoof ? 'bg-red-500/10' : 'bg-emerald-500/10'
          } animate-pulse`} />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-center lg:text-left">
              <motion.div 
                className={`p-4 rounded-2xl border bg-slate-950/80 ${
                  isSpoof ? 'border-red-700/50 text-red-400' : 'border-emerald-700/50 text-emerald-400'
                }`}
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                {isSpoof ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
              </motion.div>

              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">
                  Classification Evaluation
                </span>
                <motion.h2 
                  className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight uppercase ${
                    isSpoof ? 'text-red-400' : 'text-emerald-400'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {isSpoof ? '⚠️ Spoof Detected' : '✅ Voice Authentic'}
                </motion.h2>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  {isSpoof
                    ? 'The analyzed recording shows evidence consistent with synthetic or cloned speech patterns.'
                    : 'The analyzed recording passed all authenticity checks with high confidence.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Risk Level</span>
                <div className="mt-1">
                  <RiskBadge level={analysisResult.riskLevel} size="lg" />
                </div>
              </div>
              <div className="w-px h-12 bg-slate-700/50" />
              <div className="text-right">
                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Confidence</span>
                <p className={`text-xl font-bold ${isSpoof ? 'text-red-400' : 'text-emerald-400'}`}>
                  {Math.max(spoofPercent, 100 - spoofPercent)}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2 & 3. PROBABILITY ANALYSIS & RECOMMENDATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <ProbabilityCard
              spoofProbability={analysisResult.spoofProbability}
              realProbability={analysisResult.realProbability}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <RecommendationCard
              recommendation={analysisResult.recommendation}
              prediction={analysisResult.prediction}
            />
          </motion.div>
        </div>

        {/* 4. AUDIO INFORMATION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <AudioInfo audioInfo={analysisResult.audioInfo} />
        </motion.div>

        {/* 5. TECHNICAL ANALYSIS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <TechnicalAnalysis additionalData={analysisResult.additionalData} />
        </motion.div>

        {/* 6. RAW JSON INSPECTOR with toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <RawJsonViewer rawJson={analysisResult.rawResponse} />
        </motion.div>

        {/* Export Actions */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Analysis completed successfully</span>
          </div>
          <div className="flex items-center gap-3">
           <Button
  onClick={() => {
    setIsExporting(true);

    try {
      exportAnalysisReport(analysisResult);
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  }}
  variant="outline"
  size="sm"
  icon={Download}
  className="min-w-[120px]"
>
  {isExporting ? 'Exporting...' : 'Export Report'}
</Button>
            <Button
              onClick={() => setShowShare(!showShare)}
              variant="outline"
              size="sm"
              icon={Share2}
              className="min-w-[120px]"
            >
              {showShare ? 'Copied!' : 'Share Results'}
            </Button>
          </div>
        </motion.div>

      </main>

    </div>
  );
}