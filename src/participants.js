import Joi from 'joi';
import dayjs from 'dayjs';

import dbConnect from './mongoClient.js';


const participantSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    lastStatus: Joi.number().required()
});

async function logParticipant(req, res) {
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
        await removeInactiveParticipant();
        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
};

async function getParticipants(req, res) {
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
};

async function removeInactiveParticipant() {
    setInterval( async () => {
        try {
        const { mongoClient, db } = await dbConnect();

        const participantsCollection =  db.collection('participants');
        const participantsCursor = participantsCollection.find({});
        const participants = await participantsCursor.toArray();

        const messagesCollection = db.collection('messages');

        for (const participant of participants) {
            if (participant.lastStatus < Date.now() - 10000) {
                await participantsCollection.deleteOne({});
                        await messagesCollection.insertOne({
                            from: participant.name,
                            to: 'Todos',
                            text: 'sai da sala...',
                            type: 'status',
                            time: dayjs(new Date()).format('HH:mm:ss')
                        });
            }
        }

        mongoClient.close();

        } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
        }
        
    }, 15000);
}

export { logParticipant, getParticipants };