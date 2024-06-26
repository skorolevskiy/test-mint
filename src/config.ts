import { base } from 'viem/chains';
import { FrameImageMetadata, getFrameMetadata } from '@coinbase/onchainkit/frame';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const CHAIN = base;
export const CONTRACT_ADDRESS = '0x388e543a5a491e7b42e3fbcd127dd6812ea02d0d';
//export const TOKEN_ID = 1n; // First collection is 1

const imageData: FrameImageMetadata = {
	src: `${SITE_URL}/opengraph-image3.png`,
	aspectRatio: '1:1' // или '1.91:1'
};

export const FRAME_METADATA = getFrameMetadata({
  buttons: [{
		label: 'Eligibility Checker',
	},],
  image: imageData,
  post_url: `${SITE_URL}/api/frame`,
});
