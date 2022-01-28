import express, { json } from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors(), json());

const participantSchema = joi.object({
    name: joi.string().required(),
    lastStatus: joi.number().required()
});

const mongoClient = new MongoClient(process.env.MONGO_URI);

async function dbConnect() {
    let db;
    try {
        mongoClient.connect(() => {
            db = mongoClient.db("chatUol");
        });
        return {mongoClient, db};

    } catch (error) {
        console.log('\ndeu erro ae\n');
        console.error(error);
        return;
    }
}

server.post('/participants', async (req, res) => {
    try {
        const participant = {name: req.body.name, lastStatus: Date.now()};
        const validation = participantSchema.validate(participant, { abortEarly: false });
    
        if (validation.error) {
            console.log(validation.error.details);
            res.status(422).send(validation.error.details);
        }
    
        const { mongoClient, db } = await dbConnect();
        const participantsCollection = await db.collection('participants');
    
        const participantExist = await participantsCollection.findOne({name: participant.name});

        if (participantExist) {
            res.status(409).send('Usuário já cadastrado.');
        }

        await participantsCollection.insertOne(participant);
        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
      }
});

server.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
});