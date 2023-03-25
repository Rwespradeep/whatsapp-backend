//all my imports
import express from "express";
import mongoose from "mongoose";
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from 'cors';
import Rooms from "./dbRooms.js";
//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1573120",
    key: "9ac8b522e12bbf9060da",
    secret: "53d85877a2f6cd838759",
    cluster: "mt1",
    useTLS: true
});



//middleware
app.use(express.json());  // to send and get json responses back both into the db and on to the console
app.use(cors());  // to allow requests from any origin and headers

//DB configuration
mongoose.connect('mongodb+srv://pradeepindiacwc2015:3319@whatsapp-cluster.2uv5ikh.mongodb.net/?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

///??

const db = mongoose.connection;

db.once('open', () => {                                                 // change stream to watch our mongodb collection, to monitor and fetch for realtime data
    console.log('db is connected and i am watching message collection');

    const messageCollection = db.collection('messagecontents');
    const changeStream = messageCollection.watch();

    changeStream.on('change', (change) => {

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                recieved: messageDetails.recieved
            });
        } else {
            console.log('Error triggering pusher..')
        }
    })
})


db.once('open', () => {                                                 // change stream to watch our mongodb collection, to monitor and fetch for realtime data
    console.log('db is connected and i am watching room collection');

    const roomCollection = db.collection('roomcontents');
    const changeStream = roomCollection.watch();

    changeStream.on('change', (change) => {

        if (change.operationType === 'insert') {
            const roomDetails = change.fullDocument;
            pusher.trigger('rooms', 'inserted', {
                GroupName: roomDetails.GroupName,
                LastMessage: roomDetails.LastMessage,
            });
        } else {
            console.log('Error triggering pusher..')
        }
    })
})


//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

//sending messages

app.post('/messages/new', async (req, res) => {
    const dbMessage = new Messages(req.body)
    try {
        const newMessage = await dbMessage.save();
        res.status(201).send(newMessage);
    } catch (err) {
        res.status(500).send(err);
    }
})

//getting messages

app.get('/messages/sync', async (req, res) => {
    try {
        const getMsg = await Messages.find();
        res.status(200).json(getMsg);
    } catch (err) {
        res.status(500).send(err);
    }
})

// //creating rooms

app.post('/rooms/new', async (req, res) => {
    const dbRoom = new Rooms(req.body)
    try {
        const newRoom = await dbRoom.save();
        res.status(201).send(newRoom);
    } catch (err) {
        res.status(500).send(err);
    }
})

//getting rooms

app.get('/rooms/sync', async (req, res) => {
    try {
        const Roomdata = await Rooms.find();
        res.status(200).json(Roomdata);
    } catch (err) {
        res.status(500).send(err);
    }
})

//testing to map room and msg collection

app.get('/rooms/all', async (req, res) => {
    try {
        const dbRoom = Rooms.aggregate([
            {
                '$lookup': {
                    from: messageCollection,
                    localField: 'chatRoomId',
                    foreignField: doc._id,
                    as: 'chatRoomId'
                },

                '$project': {
                    "chatRoomId": ""
                }
            }
        ])
        res.status(200).json(dbRoom);
    } catch (err) {
        res.status(500).send(err);
    }
})

//listen
app.listen(port, () => console.log(`Backend started on: ${port}`));