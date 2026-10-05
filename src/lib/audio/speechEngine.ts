/**
 * Speech Engine: STT (Speech-to-Text) and TTS (Text-to-Speech)
 * Resilient Web Speech API implementation with auto-restart, pause detection, and language support.
 */

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
  private shouldBeListening = false;
  private synth: SpeechSynthesis | null = null;
  private indonesianVoice: SpeechSynthesisVoice | null = null;

  private onInterimCallback: ((text: string) => void) | null = null;
  private onFinalCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStatusCallback: ((active: boolean) => void) | null = null;

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

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusCallback?.(true);
      };

      this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim && this.onInterimCallback) {
          this.onInterimCallback(interim);
        }
        if (final && this.onFinalCallback) {
          this.onFinalCallback(final.trim());
        }
      };

      this.recognition.onerror = (event: { error: string }) => {
        // Silently handle normal pauses or no-speech events
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition event error:', event.error);
          this.onErrorCallback?.(event.error);
        }
        this.isListening = false;
        this.onStatusCallback?.(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStatusCallback?.(false);

        // Auto-reconnect if it ended due to timeout while user should still be listening
        if (this.shouldBeListening) {
          try {
            setTimeout(() => {
              if (this.shouldBeListening && !this.isListening && this.recognition) {
                this.recognition.start();
              }
            }, 250);
          } catch (e) {
            console.warn('Could not auto-restart recognition:', e);
          }
        }
      };
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError?: (error: string) => void,
    onStatus?: (active: boolean) => void
  ) {
    this.onInterimCallback = onInterim;
    this.onFinalCallback = onFinal;
    this.onErrorCallback = onError || null;
    this.onStatusCallback = onStatus || null;
    this.shouldBeListening = true;

    if (!this.recognition) {
      this.onErrorCallback?.('Browser tidak mendukung Speech Recognition Web API (gunakan Google Chrome / Edge).');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (e) {
      // If already started or transitioning, ignore
      console.warn('Recognition start caught:', e);
    }
  }

  stopListening() {
    this.shouldBeListening = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      this.isListening = false;
      this.onStatusCallback?.(false);
    }
  }

  speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      // Temporarily pause speech recognition while AI speaks to prevent feedback loop
      this.stopListening();

      if (!this.synth) {
        onStart?.();
        setTimeout(() => {
          onEnd?.();
          resolve();
        }, 1500);
        return;
      }

      this.synth.cancel(); // Stop any previous speech

      // Clean markdown characters from text for TTS
      const cleanText = text.replace(/[*_#`~]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.indonesianVoice) {
        utterance.voice = this.indonesianVoice;
      }
      utterance.lang = 'id-ID';
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
