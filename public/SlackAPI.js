const SLACK_UPLOAD_URL = "https://slack.com/api/files.upload";

const fs = require("fs");
const request = require("request");

class SlackAPI{

    constructor(token, channelId){
        this.token = token;
        this.id = channelId;
    }

    postImage(imagePath, imageTitle, onUploadFinish){
        const options = {
            url: SLACK_UPLOAD_URL,
            formData: {
                token: this.token,
                title: imageTitle,
                filename: imageTitle,
                filetype: "auto",
                channels: this.id,
                file: fs.createReadStream(imagePath)
            }
        };

        request.post(options, (error, response) => {
            if(error){
                console.log("Error by uploading file.");
                console.log(error);
                return;
            }

            console.log("upload is Succeeded!");
            onUploadFinish();
        });
    }
}

module.exports = SlackAPI;