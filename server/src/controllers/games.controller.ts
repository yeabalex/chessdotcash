import type { Game, User } from "@chessu/types";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";

import GameModel, { activeGames } from "../db/models/game.model.js";

export const getGames = async (req: Request, res: Response) => {
    try {
        if (!req.query.id && !req.query.userid) {
            // get all active games
            res.status(200).json(activeGames.filter((g) => !g.unlisted && !g.winner && !(g.black && g.white)));
            return;
        }

        let id, userid;
        if (req.query.id) {
            id = parseInt(req.query.id as string);
        }
        if (req.query.userid) {
            userid = parseInt(req.query.userid as string);
        }

        if (id && !isNaN(id)) {
            // get finished game by id
            const game = await GameModel.findById(id);
            if (!game) {
                res.status(404).end();
            } else {
                res.status(200).json(game);
            }
        } else if (userid && !isNaN(userid)) {
            // get finished games by user id
            const games = await GameModel.findByUserId(userid);
            if (!games) {
                res.status(404).end();
            } else {
                res.status(200).json(games);
            }
        } else {
            res.status(400).end();
        }
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};

export const getActiveGame = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.code) {
            res.status(400).end();
            return;
        }

        const game = activeGames.find((g) => g.code === req.params.code);
        /*const index = activeGames.findIndex((g) => g.code === req.params.code);
        if (index !== -1) {
            activeGames.splice(index, 1);
        }
*/
        if (!game) {
            res.status(404).end();
        } else {
            res.status(200).json(game);
        }
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};

export const createGame = async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.id) {
            console.log("unauthorized createGame");
            res.status(401).end();
            return;
        }
        const user: User = {
            id: req.session.user.id,
            name: req.session.user.name,
            connected: false
        };
        const unlisted: boolean = req.body.unlisted ?? false;
        const game: Game = {
            code: nanoid(6),
            unlisted,
            host: user,
            pgn: "",
            bidAmount: req.body.bidAmount,
        };
        if (req.body.side === "white") {
            game.white = user;
        } else if (req.body.side === "black") {
            game.black = user;
        } else {
            // random
            if (Math.floor(Math.random() * 2) === 0) {
                game.white = user;
            } else {
                game.black = user;
            }
        }
        activeGames.push(game);

        res.status(201).json({ code: game.code });
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};


export const leaveGame = async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.id) {
            console.log("unauthorized leaveGame");
            res.status(401).end();
            return;
        }

        if (!req.params || !req.params.code) {
            res.status(400).end();
            return;
        }

        const gameIndex = activeGames.findIndex((g) => g.code === req.params.code);
        if (gameIndex === -1) {
            res.status(404).end();
            return;
        }

        // Optional: add your TODO logic here to handle transfer of money

        // Remove the game from the array
        activeGames.splice(gameIndex, 1);

        res.status(200).json({ message: 'Game successfully removed.' });
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};
