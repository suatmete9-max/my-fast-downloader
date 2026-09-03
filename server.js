const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json()); // JSON body parse karne ke liye zaroori hai
app.use(express.static(__dirname));

app.get('/download', async (req, res) => {
    const ytUrl = req.query.url;
    // Frontend se aayi quality uthana, agar nahi aayi toh default 360p rakhna
    const requestedQuality = req.query.quality || '360';
    
    if (!ytUrl) {
        return res.status(400).send("Link missing!");
    }

    try {
        // Nayi RapidAPI Request (POST Method)
        const rapidApiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';
        
        const apiResponse = await axios.post(rapidApiUrl, {
            url: ytUrl
        }, {
            headers: {
                'x-rapidapi-key': 'a79029a42amsh34dd30872ea2f85p183dcbjsn3e284363d40b', 
                'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
                'Content-Type': 'application/json'
            }
        });

        let downloadUrl = "";
        if (apiResponse.data && apiResponse.data.medias && apiResponse.data.medias.length > 0) {
            downloadUrl = apiResponse.data.medias[0].url;
        } else {
            downloadUrl = apiResponse.data.url || apiResponse.data.link || apiResponse.data.download;
        }

        if (!downloadUrl) {
            return res.status(404).send("Video download link nahi mila.");
        }

        // Direct download stream pipe karna
        const videoStream = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        // File ke naam mein quality add karna
        res.setHeader('Content-Disposition', `attachment; filename="YouTube_Video_${requestedQuality}p.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Video data ko seedha user ke computer mein bhejna
        videoStream.data.pipe(res);

    } catch (error) {
        console.error("Backend Error:", error.response?.data || error.message);
        res.status(500).send("Server Error!");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
});