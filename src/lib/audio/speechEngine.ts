/**
 * Speech Engine: STT (Speech-to-Text) and TTS (Text-to-Speech)
 * Uses Web Speech API with fallback resilience and Indonesian/English language support.
 */

// Define SpeechRecognition interface for browsers
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export class SpeechEngine {
  private recognition: SpeechRecognitionLike | null = null;
  private isListening = false;
  private synth: SpeechSynthesis | null = null;
  private indonesianVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSynth();
      this.initRecognition();
    }
  }

  private initSynth() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      const loadVoices = () => {
        const voices = this.synth?.getVoices() || [];
        // Look for Indonesian voice (id-ID), fallback to any standard voice
        this.indonesianVoice = 
          voices.find(v => v.lang.startsWith('id') || v.lang.includes('Indonesian')) ||
          voices.find(v => v.lang.startsWith('en')) || 
          voices[0] || 
          null;
      };

      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  private initRecognition() {
    const windowObj = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    const RecognitionClass = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

    if (RecognitionClass) {
      this.recognition = new RecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'id-ID';
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError?: (error: string) => void
  ) {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      return;
    }

    this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) onInterim(interim);
      if (final) onFinal(final.trim());
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error);
        onError?.(event.error);
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      this.isListening = false;
    }
  }

  speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        onStart?.();
        setTimeout(() => {
          onEnd?.();
          resolve();
        }, 1500);
        return;
      }

      this.synth.cancel(); // Stop any previous speech

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.indonesianVoice) {
        utterance.voice = this.indonesianVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        onEnd?.();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
