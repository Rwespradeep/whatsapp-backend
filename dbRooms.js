import mongoose from "mongoose";

const roomSchema = mongoose.Schema({
    GroupName: String,
    // GroupLastmessage: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "messagecontent"
    // },
    LastMessage: String,

})

export default mongoose.model('Roomcontent', roomSchema)