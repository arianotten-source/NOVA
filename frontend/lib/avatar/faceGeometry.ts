import type { AvatarExpressionId } from '@/types/avatar';

export type EyeStyle = 'open' | 'closed' | 'half' | 'heart' | 'laugh' | 'wide';
export type MouthStyle = 'smile' | 'bigSmile' | 'flat' | 'frown' | 'o' | 'skew' | 'smileSoft';

export interface FaceGeometry {
  leftEye: EyeStyle;
  rightEye: EyeStyle;
  mouth: MouthStyle;
  browTilt: number;
}

export const FACE_GEOMETRY: Record<AvatarExpressionId, FaceGeometry> = {
  blij: { leftEye: 'open', rightEye: 'open', mouth: 'smile', browTilt: 0 },
  heel_blij: { leftEye: 'laugh', rightEye: 'laugh', mouth: 'bigSmile', browTilt: -2 },
  tevreden: { leftEye: 'open', rightEye: 'open', mouth: 'smileSoft', browTilt: 0 },
  knipoog: { leftEye: 'closed', rightEye: 'open', mouth: 'smile', browTilt: -1 },
  neutraal: { leftEye: 'open', rightEye: 'open', mouth: 'flat', browTilt: 0 },
  verrast: { leftEye: 'wide', rightEye: 'wide', mouth: 'o', browTilt: -4 },
  nieuwsgierig: { leftEye: 'open', rightEye: 'open', mouth: 'skew', browTilt: -2 },
  verdrietig: { leftEye: 'open', rightEye: 'open', mouth: 'frown', browTilt: 3 },
  bezorgd: { leftEye: 'open', rightEye: 'open', mouth: 'frown', browTilt: 4 },
  enthousiast: { leftEye: 'laugh', rightEye: 'laugh', mouth: 'bigSmile', browTilt: -3 },
  slaperig: { leftEye: 'half', rightEye: 'half', mouth: 'smileSoft', browTilt: 1 },
  liefdevol: { leftEye: 'heart', rightEye: 'heart', mouth: 'smile', browTilt: -1 },
};

export function getFaceGeometry(id: AvatarExpressionId): FaceGeometry {
  return FACE_GEOMETRY[id] ?? FACE_GEOMETRY.blij;
}
