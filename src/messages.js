import Joi from 'joi';
import dayjs from 'dayjs';
import { ObjectId } from 'mongodb';

import dbConnect from './mongoClient.js';

const messageSchema = Joi.object({
    from: Joi.string().required(),
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
};

async function getMessages(req, res) {
    const limit = (req.query.limit) ? parseInt(req.query.limit) : null;
    const user = req.header('User');
    
    try {
        const { mongoClient, db } = await dbConnect();

        const messagesCollection = db.collection('messages');
        const messagesCursor = await messagesCollection.find({$or: [ {type: 'message'}, {to: 'Todos'}, {to: user}, {from: user}]});
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
        
        const deletedMessage = await messagesCollection.deleteOne({ _id: new ObjectId(id) });

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

        const validation = messageSchema.validate(editedMessage, { abortEarly: false });
        if (validation.error) {
            mongoClient.close();
            res.status(422).send(validation.error.details);
            return;
        }
    
        const { mongoClient, db } = await dbConnect();

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
        console.log('tudo certo');

        mongoClient.close();
        res.sendStatus(201);

      } catch (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
};

export { postMessage, getMessages, deleteMessage, editMessage }; 