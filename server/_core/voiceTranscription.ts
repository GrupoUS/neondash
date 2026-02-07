/**
 * Voice transcription helper
 *
 * NOTE: The legacy Whisper proxy (LLM_API_URL) has been removed.
 * This module now returns a SERVICE_ERROR if called.
 * For voice transcription, consider using the Gemini API multimodal
 * capabilities or Google Cloud Speech-to-Text directly.
 */

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse;

export type TranscriptionError = {
  error: string;
  code:
    | "FILE_TOO_LARGE"
    | "INVALID_FORMAT"
    | "TRANSCRIPTION_FAILED"
    | "UPLOAD_FAILED"
    | "SERVICE_ERROR";
  details?: string;
};

/**
 * Transcribe audio to text.
 *
 * Currently returns SERVICE_ERROR since the legacy proxy has been removed.
 * Migrate to Gemini multimodal or Google Cloud Speech-to-Text.
 */
export async function transcribeAudio(
  _options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  return {
    error: "Voice transcription service is not configured",
    code: "SERVICE_ERROR",
    details:
      "The legacy Whisper proxy (LLM_API_URL) has been removed. " +
      "Configure Gemini multimodal or Google Cloud Speech-to-Text.",
  };
}
