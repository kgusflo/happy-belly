import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F9D7B5 0%, #EEBD94 40%, #E2A06F 100%)',
          borderRadius: 8,
          fontSize: 22,
        }}
      >
        🤤
      </div>
    ),
    { width: 32, height: 32 }
  );
}
