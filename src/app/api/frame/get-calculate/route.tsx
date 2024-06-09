import { SITE_URL } from '@/config';
import { ImageResponse } from 'next/og';
import Image from 'next/image';
//import { getTopPlayers, getUser, getUserPosition } from '../types';
// App router includes @vercel/og.
// No need to install it.

let fid: string, username: string, points: number, position: number;

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
		const fid = hasFid ? searchParams.get('fid') : null;

		// const user = await getUser(fid);
		// position = Number(await getUserPosition(fid));

		// console.log(typeof position);

		// if (!user) {
		// 	points = 0;
		// } else {
		// 	username = (user.username).replace(/"/g, '');
		// 	points = user.points;
		// }

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
						justifyContent: 'flex-start',
						alignItems: 'center',
						flexDirection: 'column',
						flexWrap: 'nowrap',
					}}
				>
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
						}}
					>
						Calculation
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
                        }}
                    >
                        {fid}
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
						<Image
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