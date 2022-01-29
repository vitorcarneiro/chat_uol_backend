import Joi from 'joi';
import dayjs from 'dayjs';

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
        const messagesCursor = await messagesCollection.find({$or: [ {type: 'message'}, {to: user}, {from: user}]});
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

export { postMessage, getMessages };