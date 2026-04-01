import _ from 'lodash';
import XML2JS from 'xml2js';
import { Request, Response, NextFunction } from 'express';
import Boardgame from '../models/boardgame';
import User from '../models/user';
import { ApiResponse } from '../types';

interface BggBoardgameParams extends Request {
	params: {
		bggUsername: string;
	};
	body: {
		counter?: number;
	};
}

interface UserCollectionParams extends Request {
	params: {
		userId: string;
	};
}

interface BggBoardgameItem {
	$: { objectid: string };
	name: Array<{ _?: string }>;
	thumbnail?: string[];
	yearpublished?: number[];
	stats: Array<{
		$: {
			minplayers?: string;
			maxplayers?: string;
			minplaytime?: string;
			maxplaytime?: string;
		};
		rating: Array<{
			average: Array<{ $: { value: string } }>;
		}>;
	}>;
}

interface ProcessedBoardgame {
	bggId: string;
	title: string;
	imgThumbnail: string;
	avgRating: string;
	yearPublished: number;
	minPlayers: number;
	maxPlayers: number;
	minPlayTime: number;
	maxPlayTime: number;
}

interface BggCollectionResponse {
	errors?: any;
	items?: {
		$: { totalitems: string };
		item: BggBoardgameItem[];
	};
}

const BGG_FETCH_TIMEOUT = 15000; // 15 seconds

export const findBgByUsername = (_req: Request, _res: Response, next: NextFunction, _id: string): void => {
	next();
};

export const getBoardgame = (req: Request, res: Response): Response => {
	return res.json(req.boardgame);
};

const fetchCollection = async (url: string): Promise<{ status: number; data: string } | undefined> => {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(BGG_FETCH_TIMEOUT) });
		const data = await response.text();
		return { status: response.status, data };
	} catch (error) {
		console.error('Error fetching collection:', error);
		return undefined;
	}
};

const processBggBoardgame = (bgItem: BggBoardgameItem): ProcessedBoardgame => {
	const boardgame: ProcessedBoardgame = {
		bggId: bgItem.$.objectid,
		title: bgItem.name[0]._ === undefined ? 'Missing Name' : bgItem.name[0]._,
		imgThumbnail: bgItem.thumbnail === undefined ? '' : bgItem.thumbnail[0],
		avgRating:
			bgItem.stats[0] === undefined || isNaN(parseFloat(bgItem.stats[0].rating[0].average[0].$.value))
				? 'N/A'
				: bgItem.stats[0].rating[0].average[0].$.value,
		yearPublished: bgItem.yearpublished === undefined || isNaN(bgItem.yearpublished[0]) ? -1 : bgItem.yearpublished[0],
		minPlayers:
			bgItem.stats[0] === undefined || isNaN(parseInt(bgItem.stats[0].$.minplayers || '')) ? -1 : parseInt(bgItem.stats[0].$.minplayers || ''),
		maxPlayers:
			bgItem.stats[0] === undefined || isNaN(parseInt(bgItem.stats[0].$.maxplayers || '')) ? -1 : parseInt(bgItem.stats[0].$.maxplayers || ''),
		minPlayTime:
			bgItem.stats[0] === undefined || isNaN(parseInt(bgItem.stats[0].$.minplaytime || ''))
				? -1
				: parseInt(bgItem.stats[0].$.minplaytime || ''),
		maxPlayTime:
			bgItem.stats[0] === undefined || isNaN(parseInt(bgItem.stats[0].$.maxplaytime || ''))
				? -1
				: parseInt(bgItem.stats[0].$.maxplaytime || ''),
	};
	return boardgame;
};

export const getBggBoardgames = async (req: BggBoardgameParams, res: Response): Promise<Response> => {
	try {
		const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(req.params.bggUsername)}&subtype=boardgame&stats=1`;

		if (req.body.counter === undefined) {
			req.body.counter = 0;
		} else {
			req.body.counter += 1;
		}

		if (req.body.counter > 5) {
			return res.status(419).json({
				success: false,
				error: 'Collection too large',
			} as ApiResponse);
		}

		const response = await fetchCollection(url);

		if (!response) {
			return res.status(404).json({
				success: false,
				error: 'Error fetching data.',
			} as ApiResponse);
		}

		if (response.status === 200) {
			let boardgames: ProcessedBoardgame[] = [];

			XML2JS.parseString(response.data, async (err, result: BggCollectionResponse) => {
				if (err) {
					return res.status(500).json({
						success: false,
						error: 'Error parsing BGG response',
					} as ApiResponse);
				}

				if (result.errors && result.items === undefined) {
					return res.status(404).json({
						success: false,
						error: 'Username not found',
					} as ApiResponse);
				}

				if (result.items && result.items.$.totalitems !== '0') {
					result.items.item.forEach((bgItem) => {
						const boardgame = processBggBoardgame(bgItem);
						boardgames.push(boardgame);
					});

					// Save boardgames to database
					const savePromises = boardgames.map(async (bgItem) => {
						try {
							await Boardgame.findOneAndUpdate({ bggId: bgItem.bggId }, bgItem, { upsert: true });
						} catch (error) {
							console.error('Error saving boardgame:', error);
						}
					});

					await Promise.all(savePromises);
				}
			});

			return res.status(200).json({
				success: true,
				data: boardgames,
			} as ApiResponse<ProcessedBoardgame[]>);
		} else if (response.status === 202) {
			return res.status(202).json({
				success: false,
				message: 'BGG is still processing your collection. Please retry in a few seconds.',
			} as ApiResponse);
		}

		return res.status(404).json({
			success: false,
			error: 'Error fetching data.',
		} as ApiResponse);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Internal server error',
		} as ApiResponse);
	}
};

export const getUserCollection = (req: Request, res: Response): Response => {
	if (req.profile) {
		req.profile.salt = undefined;
		req.profile.hashed_password = undefined;
		return res.json({
			success: true,
			data: req.profile.boardgames,
		} as ApiResponse);
	}

	return res.status(400).json({
		success: false,
		error: 'User profile not found',
	} as ApiResponse);
};

export const getUserBggBoardgames = async (req: BggBoardgameParams, res: Response): Promise<Response> => {
	try {
		const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(req.params.bggUsername)}&subtype=boardgame&stats=1`;

		if (req.body.counter === undefined) {
			req.body.counter = 0;
		} else {
			req.body.counter += 1;
		}

		if (req.body.counter > 5) {
			return res.status(419).json({
				success: false,
				error: 'Collection too large',
			} as ApiResponse);
		}

		const response = await fetchCollection(url);

		if (!response) {
			return res.status(404).json({
				success: false,
				error: 'Error fetching data.',
			} as ApiResponse);
		}

		if (response.status === 200) {
			let boardgames: ProcessedBoardgame[] = [];

			XML2JS.parseString(response.data, async (err, result: BggCollectionResponse) => {
				if (err) {
					return res.status(500).json({
						success: false,
						error: 'Error parsing BGG response',
					} as ApiResponse);
				}

				if (result.errors && result.items === undefined) {
					return res.status(404).json({
						success: false,
						error: 'Username not found',
					} as ApiResponse);
				}

				if (result.items && result.items.$.totalitems !== '0') {
					result.items.item.forEach((bgItem) => {
						const boardgame = processBggBoardgame(bgItem);
						boardgames.push(boardgame);
					});

					// Save boardgames to database
					const savePromises = boardgames.map(async (bgItem) => {
						try {
							await Boardgame.findOneAndUpdate(
								{ bggId: bgItem.bggId },
								bgItem,
								{ upsert: true }
							);
						} catch (error) {
							console.error('Error saving boardgame:', error);
						}
					});

					await Promise.all(savePromises);
				}
			});

			return res.status(200).json({
				success: true,
				data: boardgames,
			} as ApiResponse<ProcessedBoardgame[]>);
		} else if (response.status === 202) {
			return res.status(202).json({
				success: false,
				message: 'BGG is processing request, please retry in a few seconds.',
			} as ApiResponse);
		}

		return res.status(404).json({
			success: false,
			error: 'Error fetching data.',
		} as ApiResponse);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Internal server error',
		} as ApiResponse);
	}
};

export const getBGGCounts = async (req: BggBoardgameParams, res: Response): Promise<Response> => {
	try {
		const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(req.params.bggUsername)}&subtype=boardgame&own=0&stats=1`;

		const response = await fetchCollection(url);

		if (!response) {
			return res.status(404).json({
				success: false,
				error: 'Error fetching data.',
			} as ApiResponse);
		}

		if (response.status === 200) {
			XML2JS.parseString(response.data, (err, result: BggCollectionResponse) => {
				if (err) {
					return res.status(500).json({
						success: false,
						error: 'Error parsing BGG response',
					} as ApiResponse);
				}

				if (result.errors) {
					return res.status(404).json({
						success: false,
						error: 'Username not found',
					} as ApiResponse);
				}

				if (result.items && result.items.$.totalitems !== '0') {
					return res.status(200).json({
						success: true,
						data: result.items.$.totalitems,
					} as ApiResponse<string>);
				}

				return res.status(200).json({
					success: true,
					data: '0',
				} as ApiResponse<string>);
			});
		}

		return res.status(404).json({
			success: false,
			error: 'Error fetching data.',
		} as ApiResponse);
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'Internal server error',
		} as ApiResponse);
	}
};

export const checkBggAccountExist = async (req: BggBoardgameParams, res: Response, next: NextFunction): Promise<void> => {
	try {
		const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(req.params.bggUsername)}&subtype=boardgame&stats=1`;

		const response = await fetchCollection(url);

		if (!response) {
			res.status(404).json({
				success: false,
				error: 'Error fetching data.',
			} as ApiResponse);
			return;
		}

		if (response.status === 200) {
			XML2JS.parseString(response.data, (err, result: BggCollectionResponse) => {
				if (err) {
					res.status(500).json({
						success: false,
						error: 'Error parsing BGG response',
					} as ApiResponse);
					return;
				}

				if (result.errors) {
					res.status(404).json({
						success: false,
						error: `Username: ${req.params.bggUsername} not found. Please enter correct information.`,
					} as ApiResponse);
					return;
				}

				if (result.items && result.items.$.totalitems === '0') {
					res.status(404).json({
						success: false,
						error: `Username: ${req.params.bggUsername} does not have a boardgame collection.`,
					} as ApiResponse);
					return;
				}
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			error: 'Internal server error',
		} as ApiResponse);
		return;
	}

	next();
};

export const updateUserCollection = async (req: UserCollectionParams, res: Response): Promise<Response> => {
	try {
		const id = req.params.userId;

		const response = await User.updateOne(
			{ _id: id },
			{
				$set: {
					boardgames: req.body,
				},
			},
			{ runValidators: true }
		);

		if (response.acknowledged) {
			return res.status(200).json({
				success: true,
				message: 'User collection updated successfully',
			} as ApiResponse);
		} else {
			return res.status(400).json({
				success: false,
				error: 'Failed to update user collection',
			} as ApiResponse);
		}
	} catch (error) {
		console.error('Error updating user collection:', error);
		return res.status(400).json({
			success: false,
			error: 'Error updating user collection',
		} as ApiResponse);
	}
};
