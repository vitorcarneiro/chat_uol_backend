import { MongoClient } from "mongodb";

export default async function dbConnect() {
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
