import { SITE_URL } from '@/config';
import { ImageResponse } from 'next/og';
import { getUser } from '../types';
// App router includes @vercel/og.
// No need to install it.

let fid: string | null, username: string, points: number, power: string | null, tokens: number;

interface Player {
	fid: string;
	username: string,
	points: number;
}

export async function GET(request: Request) {
	const fontData = await fetch(
		new URL(SITE_URL + '/assets/GeistMonoRegular.ttf', import.meta.url),
	  ).then((res) => res.arrayBuffer());

	try {
		const { searchParams } = new URL(request.url);

		const hasFid = searchParams.has('fid');
		fid = hasFid ? searchParams.get('fid') : null;

        const hasPower = searchParams.has('power');
		power = hasPower ? searchParams.get('power') : null;

		const user = await getUser(fid);

		if (!user) {
			points = 0;
		} else {
			points = user.points;
		}

        if(power === "true") {
            tokens = points * 2;
        } else {
            tokens = points;
        }

		// const topPlayers: Player[] = await getTopPlayers();

		return new ImageResponse(
			(
				<div
					style={{
						fontFamily: 'Geist, GeistSans, Inter, "Material Icons"',
						fontSize: 40,
						color: 'black',
						background: '#0052FF',
						width: '100%',
						height: '100%',
						padding: '50px 50px',
						textAlign: 'center',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexDirection: 'column',
						flexWrap: 'nowrap',
					}}
				>
					<div
						style={{
							fontFamily: 'Geist, GeistSans, Inter, "Material Icons"',
							fontSize: 60,
							fontStyle: 'normal',
							fontWeight: 700,
							letterSpacing: '-0.025em',
							color: 'white',
							lineHeight: 1,
							whiteSpace: 'pre-wrap',
						}}
					>
						Calculation rewards
					</div>

                    <div
                        style={{
                            fontFamily: 'Geist, GeistSans, Inter, "Material Icons"',
                            fontSize: 40,
                            fontStyle: 'normal',
                            fontWeight: 700,
                            letterSpacing: '-0.025em',
                            color: 'white',
                            lineHeight: 1,
                            whiteSpace: 'pre-wrap',
                            display: 'flex',
                            flexDirection: 'column',
                            width: '560px',
                            gap: '24px'
                        }}
                    >
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{display: 'flex',}}>Your fid:</div> 
                            <div style={{display: 'flex',}}>{fid}</div>
                        </div>

                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{display: 'flex',}}>Your points:</div>
                            <div style={{display: 'flex',}}>{points}</div>
                        </div>

                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            flexDirection: 'column',
                            gap: '24px'
                        }}>
                            <div style={{display: 'flex',}}>Your multipliers: </div>
                            <div style={{
                                display: 'flex',
                                paddingLeft: '100px'
                            }}>
                                {power === "true" ? '✅' : '❌'} power badge
                            </div>
                            <div style={{
                                display: 'flex',
                                paddingLeft: '100px'
                            }}>
                                {power === "true" ? '✅' : '❌'} over 200k tokens
                            </div>
                        </div>

                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{display: 'flex',}}>Your tokens:</div>
                            <div style={{display: 'flex',}}>{tokens}</div>
                        </div>
                        
                    </div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							width: '100%',
							fontFamily: 'Geist, GeistSans, Inter, "Material Icons"',
							fontSize: 20,
							fontStyle: 'normal',
							letterSpacing: '-0.025em',
							color: 'white',
							lineHeight: 1.4,
							whiteSpace: 'pre-wrap',
						}}
					>
						<p>Build by PILL, dev @eat</p>
						<img
							alt="pill"
							width="64"
							height="64"
							src={SITE_URL + '/status/pill.png'}
							/>
					</div>
				</div>
			),
			{
				width: 960,
				height: 960,
				fonts: [
					{
					  name: 'Geist',
					  data: fontData,
					  style: 'normal',
					},
				  ],
			},
		);
	} catch (e: any) {
		console.log(`${e.message}`);
		return new Response(`Failed to generate the image`, {
			status: 500,
		});
	}
}