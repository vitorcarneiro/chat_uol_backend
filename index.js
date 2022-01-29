import express, { json } from 'express';
import cors from 'cors';
import dotenv from "dotenv";
dotenv.config();

import { logParticipant, getParticipants } from './src/participants.js';
import { postMessage, getMessages, deleteMessage } from './src/messages.js';
import postStatus from './src/status.js';

const server = express();
server.use(cors(), json());

server.post(server.post('/participants', async (req, res) => logParticipant(req, res)));

server.get('/participants', async (req, res) => getParticipants(req, res));

server.post('/messages', async (req, res) => postMessage(req, res));

server.get('/messages', async (req, res) => getMessages(req, res));

server.post('/status', async (req, res) => postStatus(req, res));

server.delete('/messages/:id', async (req, res) => deleteMessage(req, res));


server.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
});