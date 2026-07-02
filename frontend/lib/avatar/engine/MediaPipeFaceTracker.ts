export interface FaceTrackResult {
  faceDetected: boolean;
  faceX: number;
  faceY: number;
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/** Max gaze offset — ~±15° visual range */
const MAX_GAZE = 0.38;

export class MediaPipeFaceTracker {
  private landmarker: import('@mediapipe/tasks-vision').FaceLandmarker | null = null;
  private ready = false;

  async init(): Promise<boolean> {
    if (this.ready) return true;
    try {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          });
          this.ready = true;
          return true;
        } catch {
          /* try CPU */
        }
      }
    } catch (err) {
      console.warn('[MediaPipe] init failed', err);
    }
    return false;
  }

  isReady() {
    return this.ready && this.landmarker != null;
  }

  detect(video: HTMLVideoElement, timestampMs: number): FaceTrackResult | null {
    if (!this.landmarker || video.readyState < 2) return null;

    try {
      const result = this.landmarker.detectForVideo(video, timestampMs);
      const landmarks = result.faceLandmarks?.[0];
      if (!landmarks?.length) {
        return { faceDetected: false, faceX: 0, faceY: 0 };
      }

      // Nose tip + eye centers for gaze offset
      const nose = landmarks[1] ?? landmarks[0];
      let minX = 1;
      let maxX = 0;
      let minY = 1;
      let maxY = 0;
      for (const p of landmarks) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rawX = ((nose.x - cx) / Math.max(0.08, (maxX - minX) / 2)) * 0.5;
      const rawY = ((nose.y - cy) / Math.max(0.08, (maxY - minY) / 2)) * 0.5;

      return {
        faceDetected: true,
        faceX: Math.max(-MAX_GAZE, Math.min(MAX_GAZE, rawX)),
        faceY: Math.max(-MAX_GAZE * 0.7, Math.min(MAX_GAZE * 0.7, rawY)),
      };
    } catch (err) {
      console.warn('[MediaPipe] detect error', err);
      return null;
    }
  }

  close() {
    this.landmarker?.close();
    this.landmarker = null;
    this.ready = false;
  }
}
