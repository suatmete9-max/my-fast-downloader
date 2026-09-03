const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const requestedQuality = req.query.quality || '360';
    
    if (!videoUrl) {
        return res.status(400).send("Link missing!");
    }

    const rapidApiHost = 'social-download-all-in-one.p.rapidapi.com';
    const rapidApiUrl = `https://${rapidApiHost}/v1/social/autolink`;

    // Aapki dono RapidAPI keys yahan set kar di gayi hain
    const apiKeys = [
        'a79029a42amsh34dd30872ea2f85p183dcbjsn3e284363d40b', // API Key 1 (Pehle yeh try hogi)
        '5790f8a63dmsh9d28171653380fep1aa04fjsne748a9af912c'  // API Key 2 (Limit khatam hone par yeh chalegi)
    ];

    let downloadUrl = "";
    let success = false;

    // Loop ke zariye ek-ek karke keys check hongi
    for (let i = 0; i < apiKeys.length; i++) {
        try {
            console.log(`Trying API Key Index: ${i}`);

            const apiResponse = await axios.post(rapidApiUrl, {
                url: videoUrl
            }, {
                headers: {
                    'x-rapidapi-key': apiKeys[i], 
                    'x-rapidapi-host': rapidApiHost,
                    'Content-Type': 'application/json'
                }
            });

            if (apiResponse.data) {
                if (apiResponse.data.medias && apiResponse.data.medias.length > 0) {
                    downloadUrl = apiResponse.data.medias[0].url;
                } else {
                    downloadUrl = apiResponse.data.url || apiResponse.data.link || apiResponse.data.download;
                }
            }

            if (downloadUrl) {
                success = true;
                break; // Link milte hi loop rok diya jayega
            }
        } catch (error) {
            console.warn(`API Key ${i} failed or limit reached. Switching to next API...`);
        }
    }

    if (!success || !downloadUrl) {
        return res.status(404).send("Sabhi APIs ki limit khatam ho chuki hai ya video link nahi mila!");
    }

    try {
        // Video stream download karke user ko bhejna
        const videoStream = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename="Video_${requestedQuality}p.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        videoStream.data.pipe(res);

    } catch (streamError) {
        console.error("Stream Error:", streamError.message);
        res.status(500).send("Server Error while streaming video!");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
});
