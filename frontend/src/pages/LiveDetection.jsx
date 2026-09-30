import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';

import {
  Activity,
  AlertTriangle,
  AudioWaveform,
  CheckCircle2,
  Lock,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| DEMO TIMELINE
|--------------------------------------------------------------------------
| 0 - 4s   : Waiting for incoming call
| 4 - 5.5s : Call detected
| 5.5 - 7s : Establishing audio
| 7 - 9s   : Preparing analysis
| 9s+      : Actual analysis begins
| 20s      : Critical alert
|--------------------------------------------------------------------------
*/

const DEMO_STAGES = [
  {
    time: 9,
    risk: 8,
    voice: 6,
    acoustic: 8,
    behavioral: 4,
    context: 7,
    level: 'LOW',
    label: 'Normal interaction',
    transcript: 'Hello, are you available?',
    indicators: ['No immediate threat indicators'],
  },
  {
    time: 10,
    risk: 11,
    voice: 9,
    acoustic: 10,
    behavioral: 6,
    context: 9,
    level: 'LOW',
    label: 'Normal interaction',
    transcript: 'I wanted to discuss something with you.',
    indicators: [
      'Voice authenticity analysis active',
      'Audio quality: Good',
    ],
  },
  {
    time: 11,
    risk: 14,
    voice: 12,
    acoustic: 13,
    behavioral: 9,
    context: 11,
    level: 'LOW',
    label: 'No significant anomaly detected',
    transcript:
      'I am travelling right now and need your help with something.',
    indicators: [
      'No strong synthetic-speech evidence',
      'Audio quality: Good',
    ],
  },
  {
    time: 12,
    risk: 18,
    voice: 16,
    acoustic: 15,
    behavioral: 13,
    context: 15,
    level: 'LOW',
    label: 'Monitoring continues',
    transcript:
      'I need to discuss something important with you.',
    indicators: [
      'Temporal analysis active',
      'No immediate action required',
    ],
  },
  {
    time: 13,
    risk: 23,
    voice: 21,
    acoustic: 20,
    behavioral: 18,
    context: 20,
    level: 'LOW',
    label: 'Early anomaly signal detected',
    transcript:
      'I need you to process something for me as soon as possible.',
    indicators: [
      'Minor voice irregularities',
      'Request urgency increasing',
    ],
  },
  {
    time: 14,
    risk: 29,
    voice: 27,
    acoustic: 25,
    behavioral: 29,
    context: 27,
    level: 'SUSPICIOUS',
    label: 'Risk indicators beginning to accumulate',
    transcript:
      'I need you to process the transfer as soon as possible.',
    indicators: [
      'Moderate synthetic-speech indicators',
      'Financial intent detected',
      'Urgency pattern detected',
    ],
  },
  {
    time: 15,
    risk: 35,
    voice: 33,
    acoustic: 29,
    behavioral: 38,
    context: 34,
    level: 'SUSPICIOUS',
    label: 'Cross-pipeline evidence increasing',
    transcript:
      'It is important that you handle the transfer immediately.',
    indicators: [
      'Voice risk increasing',
      'Financial intent detected',
      'Behavioral risk increasing',
    ],
  },
  {
    time: 16,
    risk: 43,
    voice: 40,
    acoustic: 35,
    behavioral: 48,
    context: 42,
    level: 'SUSPICIOUS',
    label: 'Suspicious interaction detected',
    transcript:
      'Please process the transfer immediately.',
    indicators: [
      'Synthetic voice indicators increasing',
      'High urgency detected',
      'Context risk increasing',
    ],
  },
  {
    time: 17,
    risk: 51,
    voice: 48,
    acoustic: 42,
    behavioral: 59,
    context: 51,
    level: 'SUSPICIOUS',
    label: 'Evidence fusion indicates elevated risk',
    transcript:
      'I cannot take another call right now. Please just process it.',
    indicators: [
      'Cross-pipeline agreement increasing',
      'Verification avoidance detected',
      'Financial action requested',
    ],
  },
  {
    time: 18,
    risk: 63,
    voice: 59,
    acoustic: 51,
    behavioral: 70,
    context: 65,
    level: 'HIGH',
    label: 'High-risk interaction detected',
    transcript:
      'Please process the transfer immediately. I cannot take another call right now.',
    indicators: [
      'Synthetic voice indicators detected',
      'High-risk financial intent',
      'Caller verification avoidance',
    ],
  },
  {
    time: 19,
    risk: 72,
    voice: 68,
    acoustic: 58,
    behavioral: 81,
    context: 76,
    level: 'HIGH',
    label: 'Potential impersonation attack',
    transcript:
      'Do not call me back. Just complete the transfer.',
    indicators: [
      'Strong synthetic voice indicators',
      'Verification bypass requested',
      'High-risk caller context',
      'Multiple pipelines agree',
    ],
  },
  {
    time: 20,
    risk: 84,
    voice: 78,
    acoustic: 64,
    behavioral: 91,
    context: 88,
    level: 'CRITICAL',
    label: 'Potential voice impersonation attack',
    transcript:
      'Do not call me back. Just complete the transfer and confirm once it is done.',
    indicators: [
      'Strong synthetic voice indicators',
      'Financial transaction request',
      'Verification bypass requested',
      'High-risk caller context',
    ],
  },
];

const RISK_STYLES = {
  LOW: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    solid: 'bg-emerald-500',
  },
  SUSPICIOUS: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    solid: 'bg-amber-500',
  },
  HIGH: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    solid: 'bg-orange-500',
  },
  CRITICAL: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    solid: 'bg-red-500',
  },
};

const LIFECYCLE = {
  idle: {
    label: 'Ready for incoming call',
    description: 'Monitoring call channels',
  },
  waiting: {
    label: 'Waiting for incoming call',
    description: 'Monitoring call channels • no active call',
  },
  detected: {
    label: 'Incoming call detected',
    description: 'New call session identified',
  },
  connecting: {
    label: 'Establishing audio stream',
    description: 'Negotiating secure audio channel',
  },
  preparing: {
    label: 'Preparing analysis pipeline',
    description: 'Initializing voice and acoustic analysis',
  },
  monitoring: {
    label: 'Live analysis active',
    description: 'Continuous multi-pipeline analysis',
  },
  critical: {
    label: 'Security intervention required',
    description: 'Critical risk threshold reached',
  },
};

function Waveform({ active, connecting = false }) {
  const bars = [
    28, 44, 34, 62, 46, 76, 38, 58, 82, 48,
    68, 35, 72, 54, 86, 42, 64, 30, 58, 76,
    44, 66, 36, 80, 52, 70, 40, 60, 32, 74,
    48, 84, 38, 62, 46, 72, 34, 56, 78, 42,
  ];

  const isActive = active || connecting;

  return (
    <div className="h-28 w-full flex items-center justify-center gap-[3px] overflow-hidden px-3">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className={`w-1 rounded-full ${active
              ? 'bg-emerald-400/80'
              : connecting
                ? 'bg-blue-400/60'
                : 'bg-slate-700'
            }`}
          animate={
            isActive
              ? {
                height: [
                  `${Math.max(10, height - 15)}%`,
                  `${height}%`,
                  `${Math.max(12, height - 8)}%`,
                ],
              }
              : {
                height: `${height * 0.35}%`,
              }
          }
          transition={{
            duration: active
              ? 0.7 + (index % 4) * 0.12
              : 1.2 + (index % 3) * 0.15,
            repeat: isActive ? Infinity : 0,
            delay: index * 0.025,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function ScoreBar({ label, value, color = 'emerald', helper }) {
  const colors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    orange: 'bg-orange-400',
    red: 'bg-red-400',
    blue: 'bg-blue-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-xs font-medium text-slate-300">
            {label}
          </span>

          {helper && (
            <span className="ml-2 text-[9px] text-slate-600">
              {helper}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-200">
          {value}%
        </span>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function PipelineCard({
  icon: Icon,
  title,
  subtitle,
  score,
  status,
  phase,
}) {
  const style = RISK_STYLES[status] || RISK_STYLES.LOW;

  const isReady = score !== null;

  return (
    <motion.div
      layout
      className="border border-slate-800 bg-[#0c1017] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 ${isReady ? style.bg : 'bg-slate-800/60'
              } border ${isReady ? style.border : 'border-slate-700'
              }`}
          >
            <Icon
              className={`w-4 h-4 ${isReady ? style.text : 'text-slate-500'
                }`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-200">
              {title}
            </p>

            <p className="text-[9px] text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <span
          className={`text-[9px] font-semibold ${isReady ? style.text : 'text-slate-600'
            }`}
        >
          {isReady ? `${score}%` : '—'}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-1 bg-slate-800 overflow-hidden">
          {isReady ? (
            <motion.div
              className={`h-full ${style.solid}`}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.7 }}
            />
          ) : (
            <motion.div
              className="h-full bg-slate-700"
              animate={{ width: phase === 'preparing' ? ['20%', '65%', '35%'] : '18%' }}
              transition={{
                duration: 1.2,
                repeat: phase === 'preparing' ? Infinity : 0,
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isReady ? style.solid : 'bg-slate-600'
            }`}
        />

        <span className="text-[9px] text-slate-500">
          {!isReady
            ? phase === 'preparing'
              ? 'Initializing'
              : phase === 'connecting'
                ? 'Connecting'
                : 'Standby'
            : status === 'LOW'
              ? 'No strong anomaly'
              : status === 'SUSPICIOUS'
                ? 'Evidence under review'
                : 'Security attention required'}
        </span>
      </div>
    </motion.div>
  );
}

export default function LiveDetection() {
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoState, setDemoState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | REAL-TIME BROWSER MEETING AUDIO CAPTURE & WEBSOCKET ENGINE
  |--------------------------------------------------------------------------
  */
  const [isLiveCaptureActive, setIsLiveCaptureActive] = useState(false);
  const [liveCaptureStatus, setLiveCaptureStatus] = useState('idle'); // idle | connecting | buffering | active | error
  const [liveStatusMessage, setLiveStatusMessage] = useState('Ready for meeting audio capture');
  const [liveResultPayload, setLiveResultPayload] = useState(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [rollingWindowHistory, setRollingWindowHistory] = useState([]);

  const mediaStreamRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const webSocketRef = React.useRef(null);

  // Live capture clock
  useEffect(() => {
    let timer;
    if (isLiveCaptureActive) {
      timer = setInterval(() => {
        setLiveElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setLiveElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isLiveCaptureActive]);

  const stopLiveAnalysis = React.useCallback((reason) => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    setIsLiveCaptureActive(false);
    setLiveCaptureStatus('idle');
    if (reason) {
      setLiveStatusMessage(reason);
    } else {
      setLiveStatusMessage('Live meeting analysis stopped.');
    }
  }, []);

  const startLiveAnalysis = async () => {
    try {
      stopLiveAnalysis();
      setShowAlert(false);
      setLiveResultPayload(null);
      setRollingWindowHistory([]);
      setLiveCaptureStatus('connecting');
      setLiveStatusMessage('Prompting browser tab audio sharing...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        setLiveCaptureStatus('error');
        setLiveStatusMessage(
          "No audio track found in shared media. Ensure 'Share tab audio' is enabled in the browser picker."
        );
        return;
      }

      mediaStreamRef.current = stream;
      const audioTrack = audioTracks[0];

      audioTrack.onended = () => {
        stopLiveAnalysis('Browser tab sharing stopped by user.');
      };

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      await audioCtx.audioWorklet.addModule('/audio-processor.js');

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'live-audio-processor');

      sourceNode.connect(workletNode);
      sourceNode.connect(audioCtx.destination);

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const apiHost = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
        : 'localhost:8000';
      const wsUrl = `${wsProtocol}//${apiHost}/ws/live`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      webSocketRef.current = ws;

      ws.onopen = () => {

        ws.send(JSON.stringify({
          sample_rate: audioCtx.sampleRate
        }));
        setIsLiveCaptureActive(true);
        setLiveCaptureStatus('buffering');
        setLiveStatusMessage('Capturing meeting audio. Buffering initial 4s window...');
      };

      workletNode.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(event.data);
          ws.send(event.data);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'success') {
            setLiveResultPayload(data);
            setLiveCaptureStatus('active');
            setLiveStatusMessage('Continuous live meeting analysis active.');

            setRollingWindowHistory((prev) => {
              const newEntry = {
                index: data.frame_index || prev.length + 1,
                timestamp: data.timestamp_label || `00:${String(prev.length).padStart(2, '0')} - 00:${String(prev.length + 4).padStart(2, '0')}`,
                instantSpoof: data.instant_spoof_probability ?? data.spoof_probability,
                instantReal: data.instant_real_probability ?? data.real_probability,
                rollingSpoof: data.spoof_probability,
                riskLevel: data.risk_level,
                prediction: data.prediction,
              };
              const updated = [...prev, newEntry];
              return updated.slice(-30);
            });

            if (data.risk_level === 'CRITICAL') {
              setShowAlert(true);
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket JSON:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setLiveStatusMessage('WebSocket connection error. Ensure FastAPI backend is running on port 8000.');
      };

      ws.onclose = () => {
        setIsLiveCaptureActive(false);
      };
    } catch (err) {
      console.error('Start Live Analysis Error:', err);
      setLiveCaptureStatus('error');
      if (err.name === 'NotAllowedError') {
        setLiveStatusMessage('Tab capture permission was denied by user.');
      } else {
        setLiveStatusMessage(`Capture failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LEGACY DEMO CLOCK (FALLBACK)
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!demoRunning) return;

    const timer = setInterval(() => {
      setElapsed((previous) => {
        const next = Number((previous + 0.5).toFixed(1));

        if (next < 4) {
          setDemoState('waiting');
        } else if (next < 5.5) {
          setDemoState('detected');
        } else if (next < 7) {
          setDemoState('connecting');
        } else if (next < 9) {
          setDemoState('preparing');
        } else if (next < 18) {
          setDemoState('monitoring');
        } else if (next < 20) {
          setDemoState('monitoring');
        } else {
          setDemoState('critical');
          setDemoRunning(false);
          setShowAlert(true);
          return 20;
        }

        if (next >= 9) {
          let closestIndex = 0;
          DEMO_STAGES.forEach((item, index) => {
            if (item.time <= next) {
              closestIndex = index;
            }
          });
          setStageIndex(closestIndex);
        }

        return next;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [demoRunning]);

  const resetDemo = () => {
    setDemoRunning(false);
    setDemoState('idle');
    setElapsed(0);
    setStageIndex(0);
    setShowAlert(false);
  };

  /*
  |--------------------------------------------------------------------------
  | CURRENT ANALYSIS DATA
  |--------------------------------------------------------------------------
  */

  const isRealActive = isLiveCaptureActive || liveResultPayload !== null;
  const analysisActive = isRealActive ? liveCaptureStatus === 'active' || liveCaptureStatus === 'buffering' : elapsed >= 9;

  const stage = DEMO_STAGES[stageIndex];

  // Resolve current score data from real WebSocket payload if live active, else fallback to DEMO_STAGES
  const currentData = useMemo(() => {
    if (isRealActive && liveResultPayload) {
      const spoofPct = Math.round(liveResultPayload.spoof_probability * 100);
      return {
        risk: spoofPct,
        voice: spoofPct,
        acoustic: stage.acoustic,
        behavioral: stage.behavioral,
        context: stage.context,
        level: liveResultPayload.risk_level,
        label: `Genuine AI Model Result (${liveResultPayload.prediction})`,
        transcript: stage.transcript,
        indicators: [
          `Authenticity Score: ${spoofPct}% Spoof Probability`,
          `Model Verdict: ${liveResultPayload.prediction}`,
          liveResultPayload.recommendation,
        ],
      };
    }

    if (isRealActive && liveCaptureStatus === 'buffering') {
      return {
        risk: null,
        voice: null,
        acoustic: null,
        behavioral: null,
        context: null,
        level: 'LOW',
        label: 'Analyzing meeting audio (Buffering initial 4s window)...',
        transcript: 'Capturing browser tab audio. Preparing model inference...',
        indicators: ['Tab audio stream established', 'Buffering 4-second audio window'],
      };
    }

    return analysisActive
      ? stage
      : {
        risk: null,
        voice: null,
        acoustic: null,
        behavioral: null,
        context: null,
        level: null,
        label: LIFECYCLE[demoState]?.label || 'Ready',
        transcript:
          demoState === 'detected'
            ? 'Incoming call detected. Establishing connection…'
            : demoState === 'connecting'
              ? 'Establishing secure audio stream…'
              : demoState === 'preparing'
                ? 'Audio stream established. Preparing analysis…'
                : 'Waiting for incoming call…',
        indicators:
          demoState === 'waiting'
            ? ['No active call detected']
            : demoState === 'detected'
              ? ['Incoming call identified']
              : demoState === 'connecting'
                ? ['Audio channel negotiation in progress']
                : ['Analysis pipeline initialization in progress'],
      };
  }, [isRealActive, liveResultPayload, liveCaptureStatus, stage, analysisActive, demoState]);

  const riskLevel = currentData.level || 'LOW';

  const riskStyle =
    RISK_STYLES[riskLevel] || {
      text: 'text-slate-400',
      bg: 'bg-slate-900/40',
      border: 'border-slate-800',
      solid: 'bg-slate-600',
    };

  const phase = isRealActive
    ? {
      label: liveCaptureStatus === 'buffering' ? 'Analyzing...' : liveCaptureStatus === 'active' ? 'Live Meeting Analysis Active' : 'Connecting...',
      description: liveStatusMessage,
    }
    : LIFECYCLE[demoState] || LIFECYCLE.idle;

  /*
  |--------------------------------------------------------------------------
  | SECURITY ACTION
  |--------------------------------------------------------------------------
  */

  const actionText = useMemo(() => {
    if (isRealActive && liveResultPayload) {
      return liveResultPayload.recommendation;
    }
    if (isRealActive && liveCaptureStatus === 'buffering') {
      return 'Analyzing meeting audio stream... Initial results will appear shortly.';
    }
    if (!analysisActive) {
      return 'Click Start Live Analysis and select browser meeting tab to begin continuous verification.';
    }
    return stage.level === 'LOW'
      ? 'Continue normal verification.'
      : stage.level === 'SUSPICIOUS'
        ? 'Request additional verification before proceeding.'
        : stage.level === 'HIGH'
          ? 'Perform independent caller verification.'
          : 'Do not authorize requested action. Trigger MFA & callback.';
  }, [isRealActive, liveResultPayload, liveCaptureStatus, analysisActive, stage]);

  const displaySeconds = isRealActive ? liveElapsed : Math.floor(elapsed);
  const seconds = String(displaySeconds % 60).padStart(2, '0');

  const getPipelineStatus = (score) => {
    if (!analysisActive || score === null) return 'LOW';
    if (score >= 65) return 'HIGH';
    if (score >= 40) return 'SUSPICIOUS';
    return 'LOW';
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <Navbar />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">

        {/* ================================================================
            HEADER
        ================================================================= */}

        <motion.div
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-7 border-b border-slate-800/70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-medium tracking-[0.18em] text-emerald-400 uppercase">
                Security Operations
              </span>

              <span className={`px-2 py-1 border text-[8px] font-semibold tracking-wider uppercase ${isRealActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                }`}>
                {isRealActive ? 'Real Meeting Audio' : 'Live Mode'}
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Live Voice Detection
            </h1>

            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              {liveStatusMessage}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 border border-slate-800 bg-slate-900/50 px-3 py-2">
              <span
                className={`w-2 h-2 rounded-full ${isRealActive
                    ? 'bg-emerald-400 animate-pulse'
                    : demoRunning
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-600'
                  }`}
              />
              {phase.label}
            </div>

            {!isRealActive ? (
              <motion.button
                onClick={startLiveAnalysis}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <PhoneCall className="w-4 h-4" />
                Start Live Analysis
              </motion.button>
            ) : (
              <motion.button
                onClick={() => stopLiveAnalysis()}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <PhoneOff className="w-4 h-4" />
                Stop Analysis
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ================================================================
            CALL LIFECYCLE STRIP
        ================================================================= */}

        <motion.div
          className="mt-5 border border-slate-800 bg-[#0a0e14] px-5 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${demoState === 'critical'
                    ? 'bg-red-400'
                    : demoState === 'monitoring'
                      ? 'bg-emerald-400 animate-pulse'
                      : demoState === 'waiting'
                        ? 'bg-slate-500'
                        : 'bg-blue-400 animate-pulse'
                  }`}
              />

              <div>
                <p className="text-xs font-medium text-slate-300">
                  {phase.label}
                </p>

                <p className="text-[9px] text-slate-600 mt-0.5">
                  {phase.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[9px] text-slate-600">
              <span>
                Session {demoRunning || elapsed > 0 ? 'active' : 'idle'}
              </span>

              <span className="text-slate-800">•</span>

              <span>
                {analysisActive
                  ? 'Analysis active'
                  : 'Analysis pending'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ================================================================
            LIVE CALL
        ================================================================= */}

        <motion.section
          className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] border border-slate-800 bg-[#0a0e14]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >

          {/* Caller / waveform */}

          <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800">

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-slate-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {demoState === 'waiting'
                      ? 'No active caller'
                      : 'Executive Caller'}
                  </p>

                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {demoState === 'waiting'
                      ? 'Monitoring call channels'
                      : '+91 ••••• •••••'}
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <Wifi className="w-3.5 h-3.5" />

                {demoState === 'connecting'
                  ? 'Negotiating'
                  : '16 kHz'}

                <span className="text-slate-700">•</span>

                {demoState === 'waiting'
                  ? 'Standby'
                  : 'Mono'}
              </div>

            </div>

            {/* Waveform */}

            <div className="mt-5 border border-slate-800 bg-[#070a0f]">

              <div className="px-4 pt-3 flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <AudioWaveform className="w-4 h-4 text-emerald-400" />

                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    Incoming audio stream
                  </span>
                </div>

                <div className="flex items-center gap-2">

                  <span
                    className={`w-1.5 h-1.5 rounded-full ${demoState === 'monitoring'
                        ? 'bg-emerald-400 animate-pulse'
                        : demoState === 'connecting'
                          ? 'bg-blue-400 animate-pulse'
                          : 'bg-slate-600'
                      }`}
                  />

                  <span className="text-[9px] text-slate-500">
                    {demoState === 'monitoring'
                      ? 'LIVE'
                      : demoState === 'connecting'
                        ? 'CONNECTING'
                        : demoState === 'preparing'
                          ? 'INITIALIZING'
                          : demoState === 'detected'
                            ? 'DETECTED'
                            : 'STANDBY'}
                  </span>

                </div>

              </div>

              <Waveform
                active={
                  demoState === 'monitoring' ||
                  demoState === 'critical'
                }
                connecting={demoState === 'connecting'}
              />

              <div className="px-4 pb-3 flex justify-between text-[9px] text-slate-600">
                <span>
                  {analysisActive
                    ? 'Rolling analysis window'
                    : 'Awaiting analysis'}
                </span>

                <span>3–4 sec</span>
              </div>

            </div>
          </div>

          {/* Risk */}

          <div
            className={`p-5 sm:p-6 ${analysisActive ? riskStyle.bg : 'bg-slate-900/20'
              }`}
          >

            <div className="flex items-center gap-2">
              <ShieldAlert
                className={`w-4 h-4 ${analysisActive
                    ? riskStyle.text
                    : 'text-slate-500'
                  }`}
              />

              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Security Risk
              </span>
            </div>

            <div className="mt-6 flex items-end gap-2">

              <motion.span
                key={currentData.risk ?? 'waiting'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-5xl font-semibold tracking-tight ${analysisActive
                    ? riskStyle.text
                    : 'text-slate-600'
                  }`}
              >
                {analysisActive ? currentData.risk : '—'}
              </motion.span>

              {analysisActive && (
                <span className="text-sm text-slate-500 mb-2">
                  /100
                </span>
              )}

            </div>

            <div
              className={`mt-1 text-sm font-semibold ${analysisActive
                  ? riskStyle.text
                  : 'text-slate-500'
                }`}
            >
              {analysisActive
                ? currentData.level
                : demoState === 'waiting'
                  ? 'WAITING'
                  : demoState === 'detected'
                    ? 'CALL DETECTED'
                    : demoState === 'connecting'
                      ? 'CONNECTING'
                      : 'INITIALIZING'}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              {currentData.label}
            </p>

            <div className="mt-5 h-1.5 bg-slate-800/80 overflow-hidden">

              {analysisActive ? (
                <motion.div
                  className={`h-full ${riskStyle.solid}`}
                  animate={{
                    width: `${currentData.risk}%`,
                  }}
                  transition={{
                    duration: 0.7,
                  }}
                />
              ) : (
                <motion.div
                  className="h-full bg-slate-700"
                  animate={{
                    width:
                      demoState === 'preparing'
                        ? ['15%', '65%', '30%']
                        : '8%',
                  }}
                  transition={{
                    duration: 1.3,
                    repeat:
                      demoState === 'preparing'
                        ? Infinity
                        : 0,
                  }}
                />
              )}

            </div>

            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
              <span>
                00:{seconds}
              </span>

              <span>
                {analysisActive
                  ? 'Temporal risk'
                  : 'Session state'}
              </span>
            </div>

          </div>
        </motion.section>

        {/* ================================================================
            PIPELINES
        ================================================================= */}

        <motion.section
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="flex items-end justify-between mb-3">

            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-emerald-400">
                Multi-pipeline analysis
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Evidence sources
              </h2>
            </div>

            <div className="text-[9px] text-slate-600">
              {analysisActive
                ? 'Updated continuously'
                : 'Awaiting call'}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-800 border border-slate-800">

            <PipelineCard
              icon={Shield}
              title="Voice Authenticity"
              subtitle="Wav2Vec2 / XLS-R"
              score={currentData.voice}
              status={getPipelineStatus(currentData.voice)}
              phase={demoState}
            />

            <PipelineCard
              icon={AudioWaveform}
              title="Acoustic / Physics"
              subtitle="Voice characteristics"
              score={currentData.acoustic}
              status={getPipelineStatus(currentData.acoustic)}
              phase={demoState}
            />

            <PipelineCard
              icon={Sparkles}
              title="Speech & Behavior"
              subtitle="Whisper + semantic analysis"
              score={currentData.behavioral}
              status={getPipelineStatus(currentData.behavioral)}
              phase={demoState}
            />

          </div>
        </motion.section>

        {/* ================================================================
            ROLLING 30-WINDOW TIMESTAMP BREAKDOWN LOG
        ================================================================= */}

        <motion.section
          className="mt-6 border border-slate-800 bg-[#0a0e14] p-5 sm:p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Rolling 30-Window Analysis Log
                </h3>
                <p className="text-[9px] text-slate-500">
                  Instant raw uninfluenced spoof probabilities per 4-second timeframe (capped at 30 entries)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400">
              {rollingWindowHistory.length} / 30 Windows
            </span>
          </div>

          <div className="mt-4 max-h-72 overflow-y-auto pr-1 space-y-2 font-mono text-xs">
            {rollingWindowHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-600 text-xs font-sans">
                {isRealActive ? 'Buffering initial 4-second audio window...' : 'Start live meeting analysis to stream window log timestamps.'}
              </div>
            ) : (
              rollingWindowHistory.slice().reverse().map((entry) => {
                const spoofPercent = Math.round(entry.instantSpoof * 100);
                const isSpoof = spoofPercent >= 50;
                return (
                  <div
                    key={`${entry.index}-${entry.timestamp}`}
                    className="flex items-center justify-between p-2.5 rounded border border-slate-800/60 bg-slate-900/40 hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">
                        #{String(entry.index).padStart(2, '0')}
                      </span>
                      <span className="text-slate-300 font-semibold">
                        ⏱️ {entry.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Instant Spoof</span>
                        <span className={`font-bold ${isSpoof ? 'text-red-400' : 'text-emerald-400'}`}>
                          {spoofPercent}%
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isSpoof ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        {isSpoof ? 'SPOOF' : 'REAL'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* ================================================================
            TRANSCRIPT + REASONING
        ================================================================= */}

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">

          {/* Transcript */}

          <motion.div
            className="border border-slate-800 bg-[#0a0e14] p-5 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-200">
                  Live Transcript
                </h3>
              </div>

              <span className="text-[8px] uppercase tracking-wider text-slate-600">
                Whisper / STT
              </span>

            </div>

            <AnimatePresence mode="wait">

              <motion.p
                key={currentData.transcript}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-6 text-base sm:text-lg leading-relaxed text-slate-200"
              >
                "{currentData.transcript}"
              </motion.p>

            </AnimatePresence>

            {analysisActive && (
              <div className="mt-6 flex flex-wrap gap-2">

                {currentData.level !== 'LOW' && (
                  <>
                    <span className="px-2.5 py-1 text-[9px] text-amber-300 bg-amber-500/10 border border-amber-500/20">
                      Financial intent
                    </span>

                    <span className="px-2.5 py-1 text-[9px] text-orange-300 bg-orange-500/10 border border-orange-500/20">
                      Urgency
                    </span>
                  </>
                )}

                {currentData.risk >= 70 && (
                  <span className="px-2.5 py-1 text-[9px] text-red-300 bg-red-500/10 border border-red-500/20">
                    Verification bypass
                  </span>
                )}

              </div>
            )}

          </motion.div>

          {/* Reasoning */}

          <motion.div
            className="border border-slate-800 bg-[#0a0e14] p-5 sm:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />

              <h3 className="text-sm font-semibold text-slate-200">
                Risk Reasoning
              </h3>
            </div>

            <div className="mt-5 space-y-3">

              {currentData.indicators.map(
                (indicator, index) => (
                  <motion.div
                    key={`${elapsed}-${indicator}`}
                    initial={{
                      opacity: 0,
                      x: -6,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    className="flex items-start gap-3"
                  >

                    <div className="mt-0.5">

                      {currentData.level === 'LOW' ||
                        !analysisActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}

                    </div>

                    <span className="text-xs leading-relaxed text-slate-400">
                      {indicator}
                    </span>

                  </motion.div>
                )
              )}

            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">

              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                Context risk
              </p>

              <div className="mt-3">

                <ScoreBar
                  label="Caller / action context"
                  value={
                    currentData.context ?? 0
                  }
                  color={
                    !analysisActive
                      ? 'blue'
                      : currentData.context >= 70
                        ? 'red'
                        : currentData.context >= 40
                          ? 'amber'
                          : 'emerald'
                  }
                />

              </div>
            </div>

          </motion.div>

        </section>

        {/* ================================================================
            RISK ORCHESTRATOR
        ================================================================= */}

        <motion.section
          className="mt-6 border border-slate-800 bg-[#0a0e14] p-5 sm:p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-400">
                Risk orchestration
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Evidence fusion
              </h2>
            </div>

            <div className="flex items-center gap-2 text-[9px] text-slate-500">

              <Zap className="w-3.5 h-3.5 text-emerald-400" />

              {analysisActive
                ? 'Temporal aggregation active'
                : 'Awaiting evidence'}

            </div>

          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">

            <ScoreBar
              label="Voice"
              value={currentData.voice ?? 0}
              color="emerald"
            />

            <ScoreBar
              label="Acoustic"
              value={currentData.acoustic ?? 0}
              color="blue"
            />

            <ScoreBar
              label="Behavior"
              value={currentData.behavioral ?? 0}
              color="amber"
            />

            <ScoreBar
              label="Context"
              value={currentData.context ?? 0}
              color="orange"
            />

            <ScoreBar
              label="Final Risk"
              value={currentData.risk ?? 0}
              color={
                currentData.risk >= 70
                  ? 'red'
                  : 'emerald'
              }
            />

          </div>

        </motion.section>

        {/* ================================================================
            SECURITY ACTION
        ================================================================= */}

        <motion.section
          className={`mt-6 border ${analysisActive
              ? riskStyle.border
              : 'border-slate-800'
            } ${analysisActive
              ? riskStyle.bg
              : 'bg-[#0a0e14]'
            } p-5 sm:p-6`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

            <div className="flex items-start gap-4">

              <div
                className={`p-3 border ${analysisActive
                    ? riskStyle.border
                    : 'border-slate-800'
                  } ${analysisActive
                    ? riskStyle.bg
                    : 'bg-slate-900/40'
                  }`}
              >

                {analysisActive &&
                  currentData.level !== 'LOW' ? (
                  <ShieldAlert
                    className={`w-5 h-5 ${riskStyle.text}`}
                  />
                ) : (
                  <ShieldCheck
                    className={`w-5 h-5 ${analysisActive
                        ? riskStyle.text
                        : 'text-slate-500'
                      }`}
                  />
                )}

              </div>

              <div>

                <p
                  className={`text-[10px] uppercase tracking-wider ${analysisActive
                      ? riskStyle.text
                      : 'text-slate-500'
                    }`}
                >
                  Recommended security action
                </p>

                <h3 className="mt-1 text-base font-semibold text-white">
                  {actionText}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Decision based on current multi-pipeline evidence.
                </p>

              </div>

            </div>

            {analysisActive &&
              currentData.level !== 'LOW' && (
                <div className="flex flex-wrap gap-2">

                  <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-950 text-xs font-semibold transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    Verify Caller
                  </button>

                  <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    Independent Callback
                  </button>

                </div>
              )}

          </div>

        </motion.section>

        {/* ================================================================
            DEMO INFORMATION
        ================================================================= */}

        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[9px] text-slate-600">

          <div className="flex items-center gap-2">

            <Radio className="w-3.5 h-3.5" />

            <span>
              Demonstration uses a controlled simulated call stream.
            </span>

          </div>

          <span>
            Production integration: SIP / WebRTC / WebSocket
          </span>

        </div>

      </main>

      {/* ================================================================
          CRITICAL ALERT
      ================================================================= */}

      <AnimatePresence>

        {showAlert && (

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 30,
              scale: 0.96,
            }}
            className="fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-32px))] border border-red-500/30 bg-[#0d1118] shadow-2xl shadow-red-500/10"
          >

            <div className="p-4 border-b border-slate-800 flex items-center gap-3">

              <div className="p-2 bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>

              <div>

                <p className="text-sm font-semibold text-white">
                  High-Risk Impersonation Detected
                </p>

                <p className="text-[9px] text-slate-500 mt-0.5">
                  Anahat security alert
                </p>

              </div>

            </div>

            <div className="p-4">

              <p className="text-xs leading-relaxed text-slate-400">
                Multiple evidence sources indicate a potentially synthetic
                voice combined with a high-risk request.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <div className="p-3 bg-slate-900 border border-slate-800">

                  <p className="text-[8px] uppercase tracking-wider text-slate-600">
                    Final risk
                  </p>

                  <p className="mt-1 text-lg font-semibold text-red-400">
                    84%
                  </p>

                </div>

                <div className="p-3 bg-slate-900 border border-slate-800">

                  <p className="text-[8px] uppercase tracking-wider text-slate-600">
                    Action
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-200">
                    Verify
                  </p>

                </div>

              </div>

              <button
                onClick={() => setShowAlert(false)}
                className="mt-4 w-full py-2.5 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold transition-colors"
              >
                Acknowledge Alert
              </button>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
}