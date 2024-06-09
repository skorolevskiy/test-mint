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
  formatUnits,
  parseEther
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getUser, updateRecieveDrop } from './../types';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY as Hex | undefined;

const transport = http(process.env.RPC_URL);

const publicClient = createPublicClient({
  chain: CHAIN,
  transport,
});

const walletClient = createWalletClient({
  chain: CHAIN,
  transport,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    if (!MINTER_PRIVATE_KEY) throw new Error('MINTER_PRIVATE_KEY is not set');

    const body: { trustedData?: { messageBytes?: string } } = await req.json();

    // Check if frame request is valid
    const status = await validateFrameRequest(body.trustedData?.messageBytes);

    if (!status?.valid) {
      console.error(status);
      throw new Error('Invalid frame request');
    }

    // // Check if user has an address connected
    // const address1: Address | undefined =
    //     status?.action?.interactor?.verifications?.[0];
    // const address2: Address | undefined =
    //     status?.action?.interactor?.verifications?.[1];

    // let rawBalance1: any, rawBalance2: any;
    // let balance1: bigint;
    // let balance2: bigint;
    // if (!address1) {
    //     return getResponse(ResponseType.NO_ADDRESS);
    // } else {
    //     // Check if user has a balance
    //     rawBalance1 = await publicClient.readContract({
    //         abi: abi,
    //         address: CONTRACT_ADDRESS,
    //         functionName: 'balanceOf',
    //         args: [address1],
    //         });
    //     balance1 = BigInt(rawBalance1 as unknown as string);
    // }
    // if (!address2) {balance2 = BigInt(0);}
    // else {
    //     rawBalance2 = await publicClient.readContract({
    //         abi: abi,
    //         address: CONTRACT_ADDRESS,
    //         functionName: 'balanceOf',
    //         args: [address2],
    //         });
    //     balance2 = BigInt(rawBalance2 as unknown as string)
    // }

    // const balanceInTokens1: number = parseInt(formatUnits(balance1, 18));
    // const balanceInTokens2: number = parseInt(formatUnits(balance2, 18));
    // const threshold: number = 24000;
	
    // if (balanceInTokens1 >= threshold || balanceInTokens2 >= threshold) {
    //     console.warn(balanceInTokens1);
    //     console.warn(balanceInTokens2);
    //     // if (balanceInTokens1 >= threshold) {
    //     // 	await updateWallet(fid_new, JSON.stringify(address1));
    //     // } else if (balanceInTokens2 >= threshold) {
    //     // 	await updateWallet(fid_new, JSON.stringify(address2));
    //     // }
    // } else {
    //     console.warn('1 need more token ' + balanceInTokens1 + ' - ' + address1);
    //     console.warn('2 need more token ' + balanceInTokens2 + ' - ' + address2);
    //     return getResponse(ResponseType.NEED_TOKEN);
    // }

    const fid_new = status?.action?.interactor?.fid ? JSON.stringify(status.action.interactor.fid) : null;
    const power_badge = status?.action?.interactor?.power_badge ? status.action.interactor.power_badge : null;

    const User = await getUser(fid_new);
    let wallet;
    if (!User) {
        return getResponse(ResponseType.ERROR);
    } else {
        wallet = User.wallet.slice(1, -1);
    }

    console.warn(MINTER_PRIVATE_KEY);

    const account = privateKeyToAccount(MINTER_PRIVATE_KEY); 

    const request: any = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: 'transfer',
        args: [ wallet, parseEther("100")],
        account: account,
      })
       
      //const serializedTransaction = await walletClient.signTransaction(request);

    if (!request) {
      throw new Error('Could not simulate contract');
    }

    try {
        const hash = await walletClient.writeContract(request);

        if (hash) {
            await updateRecieveDrop(fid_new, true);
        }
    //   if (HAS_KV) {
    //     await kv.set(`mint:${address}`, hash);
    //   }
    } catch (error) {
        return getResponse(ResponseType.ERROR);
    }

    return getResponse(ResponseType.SUCCESS);
  } catch (error) {
    console.error(error);
    return getResponse(ResponseType.ERROR);
  }
}

enum ResponseType {
  SUCCESS,
  NEED_TOKEN,
  ERROR,
  NO_ADDRESS,
}

function getResponse(type: ResponseType) {
  const IMAGE = {
    [ResponseType.SUCCESS]: 'status/success.png',
    [ResponseType.ERROR]: 'status/error.png',
    [ResponseType.NEED_TOKEN]: 'status/error.png',
    [ResponseType.NO_ADDRESS]: 'status/no-address.png',
  }[type];
  const shouldRetry =
    type === ResponseType.ERROR;
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${SITE_URL}/${IMAGE}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:post_url" content="${SITE_URL}/api/frame" />
    ${
      shouldRetry
        ? `<meta property="fc:frame:button:1" content="Try again" />`
        : ``
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
