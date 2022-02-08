import Joi from 'joi';
import dayjs from 'dayjs';
import { ObjectId } from 'mongodb';

import dbConnect from './mongoClient.js';

let participantsOnline = [];

const messageSchema = Joi.object({
    from: Joi.string().invalid(...participantsOnline).required(),
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().valid('message','private_message').required(),
    time: Joi.string().pattern(new RegExp(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)).required()
});

async function postMessage(req, res) {
    const message = {
        from: req.header('User'),
        to: req.body.to,
        text: req.body.text,
        type: req.body.type,
        time: dayjs(new Date()).format('HH:mm:ss')
    };
    
    try {
        const { mongoClient, db } = await dbConnect();
        
        const participantsCollection =  db.collection('participants');
        const participantsData = await participantsCollection.find({}).toArray();

        participantsOnline = participantsData.map(participantData => participantData.name);
        
        const validation = messageSchema.validate(message, { abortEarly: false });
        if (validation.error) {
            mongoClient.close();
            res.status(422).send(validation.error.details);
            return;
        }

        const messagesCollection = db.collection('messages');
        await messagesCollection.insertOne(message);
        mongoClient.close();

        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
};

async function getMessages(req, res) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : null;
    const user = req.header('User');
    console.log(limit);
    
    try {
        const { mongoClient, db } = await dbConnect();

        const messagesCollection = db.collection('messages');
        const messagesCursor = messagesCollection.find({$or: [ {type: 'message'}, {to: 'Todos'}, {to: user}, {from: user}]});
        let messages = await messagesCursor.toArray();
        
        if (limit) { messages = messages.slice(Math.max(messages.length - limit, 0)); }

        mongoClient.close();
        res.send(messages).status(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
};

async function deleteMessage(req, res) {
    const user = req.header('User');
    const { id }= req.params;
    
    try {
        const { mongoClient, db } = await dbConnect();

        const messagesCollection = db.collection('messages');
        const message = await messagesCollection.findOne({ _id: new ObjectId(id) });

        if (!message) {
            res.sendStatus(404);
            mongoClient.close();
            return;
        }
        
        if (message.from !== user) {     
            res.sendStatus(401);
            mongoClient.close();
            return;
        }
        
        await messagesCollection.deleteOne({ _id: new ObjectId(id) });

        mongoClient.close();
        res.sendStatus(200);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
};

async function editMessage(req, res) {
    const user = req.header('User');
    const { id }= req.params;
    
    const editedMessage = {
        from: req.header('User'),
        to: req.body.to,
        text: req.body.text,
        type: req.body.type,
        time: dayjs(new Date()).format('HH:mm:ss')
    };
    
    try {
        const { mongoClient, db } = await dbConnect();

        const validation = messageSchema.validate(editedMessage, { abortEarly: false });
        if (validation.error) {
            mongoClient.close();
            res.status(422).send(validation.error.details);
            return;
        }
        const participantsCollection =  db.collection('participants');
        const participantsData = await participantsCollection.find({}).toArray();

        participantsOnline = participantsData.map(participantData => participantData.name);

        const messagesCollection = db.collection('messages');
        const messageToEdit = await messagesCollection.findOne({ _id: new ObjectId(id) });
        
        if (!messageToEdit) {
            console.log('entrou em: !messageToEdit');
            res.sendStatus(404);
            mongoClient.close();
            return;
        }

        if (messageToEdit.from !== user) {
            console.log('entrou em: messageToEdit.from !== user');
            res.sendStatus(401);
            mongoClient.close();
            return;
        }

        await messagesCollection.updateOne({ _id: messageToEdit._id }, { $set: editedMessage });

        mongoClient.close();
        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
};

export { postMessage, getMessages, deleteMessage, editMessage }; 