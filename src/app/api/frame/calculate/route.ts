import { abi } from '@/abi/ERC20';
import { CHAIN, CONTRACT_ADDRESS, SITE_URL } from '@/config';
import { NextRequest, NextResponse } from 'next/server';
import {
  Address,
  Hex,
  TransactionExecutionError,
  createPublicClient,
  createWalletClient,
  http,
  formatUnits
} from 'viem';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

const transport = http(process.env.RPC_URL);

const publicClient = createPublicClient({
  chain: CHAIN,
  transport,
});

let fid: string | null, power_badge: boolean, tokens: number, time: number;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body: { trustedData?: { messageBytes?: string } } = await req.json();

    // Check if frame request is valid
    const status = await validateFrameRequest(body.trustedData?.messageBytes);

    if (!status?.valid) {
      console.error(status);
      throw new Error('Invalid frame request');
    }

    fid = status?.action?.interactor?.fid ? JSON.stringify(status.action.interactor.fid) : null;
    power_badge = status?.action?.interactor?.power_badge ? status.action.interactor.power_badge : null;

    const address1: Address | undefined =
        status?.action?.interactor?.verifications?.[0];
    const address2: Address | undefined =
        status?.action?.interactor?.verifications?.[1];

    let rawBalance1: any, rawBalance2: any;
    let balance1: bigint;
    let balance2: bigint;
    if (!address1) {
        return getResponse(ResponseType.NO_ADDRESS);
    } else {
        // Check if user has a balance
        rawBalance1 = await publicClient.readContract({
            abi: abi,
            address: CONTRACT_ADDRESS,
            functionName: 'balanceOf',
            args: [address1],
            });
        balance1 = BigInt(rawBalance1 as unknown as string);
    }
    if (!address2) {balance2 = BigInt(0);}
    else {
        rawBalance2 = await publicClient.readContract({
            abi: abi,
            address: CONTRACT_ADDRESS,
            functionName: 'balanceOf',
            args: [address2],
            });
        balance2 = BigInt(rawBalance2 as unknown as string)
    }

    const balanceInTokens1: number = parseInt(formatUnits(balance1, 18));
    const balanceInTokens2: number = parseInt(formatUnits(balance2, 18));
    const threshold: number = 200000;
	
    if (balanceInTokens1 >= threshold || balanceInTokens2 >= threshold) {
        // console.warn(balanceInTokens1);
        // console.warn(balanceInTokens2);
        if (balanceInTokens1 >= threshold) {
        	tokens = balanceInTokens1;
        } else if (balanceInTokens2 >= threshold) {
        	tokens = balanceInTokens2;
        }
    }

    time = Math.floor(Date.now() / 1000);

    return getResponse(ResponseType.SUCCESS);
  } catch (error) {
    console.error(error);
    return getResponse(ResponseType.ERROR);
  }
}

enum ResponseType {
  SUCCESS,
  ERROR,
  NO_ADDRESS
}

function getResponse(type: ResponseType) {
  const IMAGE = {
    [ResponseType.SUCCESS]: 'status/success.png',
    [ResponseType.ERROR]: 'status/error.png',
    [ResponseType.NO_ADDRESS]: 'status/no-address.png',
  }[type];
  const shouldRetry =
    type === ResponseType.ERROR;
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${SITE_URL}/api/frame/get-calculate?fid=${fid}&power=${power_badge}&tokens=${tokens}&time=${time}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:post_url" content="${SITE_URL}/api/frame" />
    ${
      shouldRetry
        ? `<meta property="fc:frame:button:1" content="Try again" />`
        : `
          <meta name="fc:frame:button:1" content="Claim rewards" />
          <meta name="fc:frame:button:1:action" content="post" />
          <meta name="fc:frame:button:1:target" content="${SITE_URL}/api/frame/mint/" />
        `
    }
  </head></html>`);
}

async function validateFrameRequest(data: string | undefined) {
  if (!NEYNAR_API_KEY) throw new Error('NEYNAR_API_KEY is not set');
  if (!data) throw new Error('No data provided');

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      api_key: NEYNAR_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message_bytes_in_hex: data }),
  };

  return await fetch(
    'https://api.neynar.com/v2/farcaster/frame/validate',
    options,
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));
}
