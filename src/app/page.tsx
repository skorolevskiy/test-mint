import {
  CHAIN,
  CONTRACT_ADDRESS,
  FRAME_METADATA,
  SITE_URL,
} from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: 'Pill Claim Frame',
  other: FRAME_METADATA,
};

export default function Home() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex' }}>
        <a
          href={`https://warpcast.com/~/channel/pill`}
          style={{ color: 'inherit' }}
        >
          Claim your airdrop
        </a>
    </div>
  );
}
