import dbConnect from './mongoClient.js';

export default async function postStatus(req, res) {
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
};



