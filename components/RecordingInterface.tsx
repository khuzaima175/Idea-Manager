import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Square, Loader2, Sparkles, X } from 'lucide-react';
import { getMimeType } from '../utils/audioUtils';

interface RecordingInterfaceProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
  isProcessing: boolean;
  statusMessage?: string;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({ 
  onRecordingComplete, 
  onCancel, 
  isProcessing,
  statusMessage 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const updateLevel = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a, b) => a + b, 0) / dataArray.length);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.start(100);
      setIsRecording(true);
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => setDuration(Math.floor((Date.now() - startTime) / 1000)), 1000);
    } catch (err) {
      alert("Microphone access is required.");
      onCancel();
    }
  }, [onRecordingComplete, onCancel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isRecording]);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    };
  }, []);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl animate-in fade-in zoom-in duration-300 px-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-[60px] animate-pulse"></div>
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-t-2 border-primary animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 md:w-8 md:h-8 text-primary animate-bounce-small" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{statusMessage || "Magic in progress..."}</h2>
        <p className="text-slate-400 font-medium text-sm md:text-base">Processing your creative sparks with Gemini</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
      <button onClick={onCancel} className="absolute top-6 right-6 md:top-8 md:right-8 p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
        <X className="w-8 h-8" />
      </button>

      <div className="relative flex items-center justify-center mb-16">
        {[0.6, 1.2, 1.8, 2.4].map((s, i) => (
          <div 
            key={i}
            className="absolute rounded-full border border-primary/20 transition-transform duration-75 ease-out"
            style={{ 
              width: `${140 + i * 50}px`, 
              height: `${140 + i * 50}px`,
              transform: `scale(${1 + (audioLevel / 255) * s})`,
              opacity: 0.5 - i * 0.1
            }}
          />
        ))}
        {/* Adjusted size for mobile responsiveness */}
        <div className="z-10 bg-surface/50 p-8 md:p-12 rounded-full border border-primary/30 backdrop-blur-md shadow-[0_0_50px_rgba(56,189,248,0.2)]">
          <div className="text-center">
            <div className="text-4xl md:text-6xl font-mono font-bold text-white mb-2 tracking-tighter">{formatTime(duration)}</div>
            <div className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Capturing Sound</div>
          </div>
        </div>
      </div>

      <button
        onClick={stopRecording}
        className="group relative flex items-center justify-center w-20 h-20 md:w-28 md:h-28 rounded-full bg-red-500 hover:bg-red-600 transition-all hover:scale-110 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
      >
        <Square className="w-8 h-8 md:w-10 md:h-10 text-white fill-current" />
      </button>
      <p className="mt-8 text-slate-500 font-medium text-sm">Click to finalize your idea</p>
    </div>
  );
};

export default RecordingInterface;