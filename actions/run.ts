import {
	ActionFn,
	Context,
	Event,
} from '@tenderly/actions';

import { ethers } from 'ethers';
// import * as fs from 'fs';
import { sendMessage } from './telegramNotifier';

const poolServiceABI = [
	{
		"inputs": [
			{
				"internalType": "contract IStablecoin",
				"name": "stablecoin",
				"type": "address"
			}
		],
		"name": "toLiquidation",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const poolABI = [
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "vaultID",
				"type": "uint256"
			}
		],
		"name": "checkCollateralPercentage",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "vaultID",
				"type": "uint256"
			}
		],
		"name": "ownerOf",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const Networks = [
	'1',
	'250',
	'56'
];

const NetworkName: { [id: string]: string; } = {
	'1': 'eth',
	'250': 'fantom',
	'56': 'bsc',
};

const PoolServices: { [id: string]: string; } = {
	'1': '0x6427d25FFBA919fB9DEd4B3407129Eb7Fd3a88B9',
	'250': '0x1BA3dF9462d8D3dBE0894378ae9A53D3176a55DD',
	'56': '0x45317963330689A658a88D2EF131A668287034c8'
}

const Pools: { [id: string]: string[]; } = {
	'1': [
		'0xe98405b2dc90A7c6365912A441BE310C9Ce7e3C3',
		'0xec24FAFa1B64A607E683a1Ea83975ef3317221Aa'
	],

	'250': [
		'0x45317963330689A658a88D2EF131A668287034c8',
		'0xD1999a501899e72f9E49A4e642f9C4e78C252A72',
		'0xd61c25bB27ba61F5067B99c7d10D373f4C23F699',
		'0xBdaa6f73c7d96F800dAE9B39c84cA82396a2CEf6',
		'0xabe671bced7df40434db43f198fd725f177a8582'
	],

	'56': [
		'0x9f8a13d31a2d2fe771c05b38d344719641647443',
		'0x73C4D4CB2e0EbF834936E5a6DA1DF9dE8624e95c'
	]
}

const OK_MESSAGE = '✅ There is no liquidatable vaults';

type VaultInfo = {
	id: number,
	collateralPercentage: number,
	owner?: string,
}

type LiquidatableVault = {
	vaults: VaultInfo[],
	network: string
	address: string,
	name: string,
}

export const runFn: ActionFn = async (context: Context, event: Event) => {
	const answer = await allLiquidatableVaults();
	const message = constructMessage(answer);

	const tg_key = await context.secrets.get("TG_BOT_API_KEY");
	const dest_chat = await context.secrets.get("TG_CHAT_ID");

	await sendMessage(message, tg_key, dest_chat, message === OK_MESSAGE);
}

const allLiquidatableVaults = async (): Promise<LiquidatableVault[][]> => {
	let answers: LiquidatableVault[][] = [];
	for (let i = 0; i < Networks.length; i++) {
		const liquidatableVaults = await liquidatableVaultForNetwork(Networks[i]);
		answers.push(liquidatableVaults);
	}

	return answers;
}

const liquidatableVaultForNetwork = async (network: string): Promise<LiquidatableVault[]> => {
	const provider = new ethers.JsonRpcProvider(`https://rpc.ankr.com/${NetworkName[network]}/`)
	const contract = new ethers.Contract(PoolServices[network], poolServiceABI, provider);
	var liquidatableVaults: LiquidatableVault[] = [];

	for (let i = 0; i < Pools[network].length; i++) {
		const pool = new ethers.Contract(Pools[network][i], poolABI, provider);
		let vaultsObject = {
			vaults: [] as VaultInfo[],
			network: NetworkName[network].toUpperCase(),
			address: Pools[network][i],
			name: await pool.name(),
		}

		const liquidatableVaultIDs = await contract.toLiquidation(Pools[network][i]);
		console.log(liquidatableVaultIDs);
		for (let i = 0; i < liquidatableVaultIDs.length; i++) {
			const vaultInfo: VaultInfo = {
				id: liquidatableVaultIDs[i],
				collateralPercentage: await pool.checkCollateralPercentage(liquidatableVaultIDs[i]),
				owner: await pool.ownerOf(liquidatableVaultIDs[i]),
			}
			vaultsObject.vaults.push(vaultInfo);
		}

		liquidatableVaults.push(vaultsObject);
	}

	return liquidatableVaults;
}

const constructMessage = (vaults: LiquidatableVault[][]): string => {
	let message: string = '*USDV Liquidatable Vaults*:\n\n';
	for (let networkVaults of vaults) {
		for (let poolVaults of networkVaults) {
			if (poolVaults.vaults.length == 0) { continue; }

			message += `🌐 *Network*: ${poolVaults.network}\n`+
								`🏦 *Pool*: ${poolVaults.name}\n`+
								`🎯 *Pool Address*: ${poolVaults.address}\n`;
			
			for (let i = 0; i < poolVaults.vaults.length; i++) {
				message += `╔ 🔑 *Vault ID*: ${poolVaults.vaults[i].id}\n`+
									 `╠ ⚠️ *Collateral Percentage*: ${poolVaults.vaults[i].collateralPercentage}%\n`+
									 `╚ 👤 *Owner*: ${poolVaults.vaults[i].owner}\n`;
			}
								
			message += '\n';
		}
	}

	return message != '' ? message : OK_MESSAGE;
}