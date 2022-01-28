import express, { json } from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dayjs from 'dayjs';
import Joi from 'joi';
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors(), json());

const participantSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    lastStatus: Joi.number().required()
});

const messageSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().valid('message','private_message').required(),
    time: Joi.string().pattern(new RegExp(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)).required()
});


async function dbConnect() {
    const mongoClient = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    try {
        await mongoClient.connect();
        const db = mongoClient.db("chatUol");

        return {mongoClient, db};

    } catch (error) {
        console.error(error);
        mongoClient.close();
        return;
    }
}

server.post('/participants', async (req, res) => {
    if (!req.body.name) { return };
    const participant = {name: req.body.name, lastStatus: Date.now()};
    
    try {    
        const validation = participantSchema.validate(participant, { abortEarly: false });
        if (validation.error) {
            res.status(422).send(validation.error.details);
            return;
        }
    
        const { mongoClient, db } = await dbConnect();

        const participantsCollection =  db.collection('participants');
        const participantExist = await participantsCollection.findOne({name: participant.name});
        if (participantExist) {
            res.status(409).send('Usuário já cadastrado.');
            mongoClient.close();
        }

        await participantsCollection.insertOne(participant);

        const message = {
            from: participant.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(new Date()).format('HH:mm:ss')
        };
        const messagesCollection = db.collection('messages');
        await messagesCollection.insertOne(message);
        
        mongoClient.close();
        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
});

server.post('/messages', async (req, res) => {
    const message = {
        from: req.header('User'),
        to: req.body.to,
        text: req.body.text,
        type: req.body.type,
        time: dayjs(new Date()).format('HH:mm:ss')
    };
    
    try {

        const validation = messageSchema.validate(message, { abortEarly: false });
        if (validation.error) {
            mongoClient.close();
            res.status(422).send(validation.error.details);
            return;
        }
    
        const { mongoClient, db } = await dbConnect();

        const messagesCollection = db.collection('messages');
        await messagesCollection.insertOne(message);
        mongoClient.close();

        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
});

server.get('/messages', async (req, res) => {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : null;
    const user = req.header('User');
    
    try {
        const { mongoClient, db } = await dbConnect();

        const messagesCollection = db.collection('messages');
        const messagesCursor = await messagesCollection.find({$or: [ {to: 'Todos'}, {to: user}, {from: user}]});
        const messages = await messagesCursor.toArray();
        
        if (limit) {
            messages = messages.slice(Math.max(messages.length - limit, 0));
        }

        mongoClient.close();
        res.send(messages).status(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
});

server.get('/participants', async (req, res) => {
    try {
        const { mongoClient, db } = await dbConnect();

        const participantsCollection =  db.collection('participants');
        const participantsCursor = await participantsCollection.find({});
        const participants = await participantsCursor.toArray();

        mongoClient.close();
        res.send(participants).status(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
});


server.post('/status', async (req, res) => {
    const user = req.header('User');
    
    try {
        const { mongoClient, db } = await dbConnect();

        const participantsCollection =  db.collection('participants');
        const userExist = await participantsCollection.findOne({name: user});

        if (!userExist) {
            res.sendStatus(404);
            mongoClient.close();
        }

        await participantsCollection.updateOne({ 
                name: user 
            }, 
            {
                $set: { lastStatus: Date.now() } 
            });

        mongoClient.close();
        res.sendStatus(200);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
});

server.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
});