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
import { privateKeyToAccount } from 'viem/accounts';
import { getUser } from './types';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

const transport = http(process.env.RPC_URL);

const publicClient = createPublicClient({
  chain: CHAIN,
  transport,
});

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

    // Check if user has liked and recasted
    // const hasLikedAndRecasted =
    //   !!status?.action?.cast?.viewer_context?.liked &&
    //   !!status?.action?.cast?.viewer_context?.recasted;

    // if (!hasLikedAndRecasted) {
    //   return getResponse(ResponseType.RECAST);
    // }

    const fid_new = status?.action?.interactor?.fid ? JSON.stringify(status.action.interactor.fid) : null;
    let address: string, recieveDrop: boolean;
    // Check if user has an address connected
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
    const threshold: number = 24000;
	
    if (balanceInTokens1 >= threshold || balanceInTokens2 >= threshold) {
        console.warn(balanceInTokens1);
        console.warn(balanceInTokens2);
        if (balanceInTokens1 >= threshold) {
        	//await updateWallet(fid_new, JSON.stringify(address1));
            address = JSON.stringify(address1);
        } else if (balanceInTokens2 >= threshold) {
        	//await updateWallet(fid_new, JSON.stringify(address2));
            address = JSON.stringify(address2);
        }
    } else {
        console.warn('1 need more token ' + balanceInTokens1 + ' - ' + address1);
        console.warn('2 need more token ' + balanceInTokens2 + ' - ' + address2);
        return getResponse(ResponseType.NEED_TOKEN);
    }

    const User = await getUser(fid_new);

    if (!User) {
        return getResponse(ResponseType.ERROR);
    } else {
        recieveDrop = User.recievedrop;
    }

    if (recieveDrop) {
        return getResponse(ResponseType.ALREADY_MINTED);
    }

    return getResponse(ResponseType.SUCCESS);
  } catch (error) {
    console.error(error);
    return getResponse(ResponseType.ERROR);
  }
}

enum ResponseType {
  SUCCESS,
  RECAST,
  ALREADY_MINTED,
  NO_ADDRESS,
  ERROR,
  NEED_TOKEN
}

function getResponse(type: ResponseType) {
  const IMAGE = {
    [ResponseType.SUCCESS]: 'status/end.png',
    [ResponseType.RECAST]: 'status/recast.png',
    [ResponseType.ALREADY_MINTED]: 'status/congrats.gif',
    [ResponseType.NO_ADDRESS]: 'status/no-address.png',
    [ResponseType.NEED_TOKEN]: 'status/need-token.png',
    [ResponseType.ERROR]: 'status/error.png',
  }[type];
  const shouldRetry =
    type === ResponseType.ERROR || type === ResponseType.RECAST || type === ResponseType.ALREADY_MINTED;
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${SITE_URL}/${IMAGE}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:post_url" content="${SITE_URL}/api/frame" />
    
    ${
      shouldRetry
        ? `<meta property="fc:frame:button:1" content="Try again" />
				    <meta name="fc:frame:button:2" content="Buy PILL" />
        		<meta name="fc:frame:button:2:action" content="link" />
        		<meta name="fc:frame:button:2:target" content="https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=0x388e543a5a491e7b42e3fbcd127dd6812ea02d0d" />
				`
			: `
        <meta name="fc:frame:button:1" content="Check eligible" />
        <meta name="fc:frame:button:1:action" content="post" />
        <meta name="fc:frame:button:1:target" content="${SITE_URL}/api/frame/eligible/" />
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
