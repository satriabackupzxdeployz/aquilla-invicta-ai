const axios = require('axios');

async function turboseekLogic(question) {
    try {
        if (!question) throw new Error('Question is required.');

        const inst = axios.create({
            baseURL: 'https://www.turboseek.io/api',
            headers: {
                origin: 'https://www.turboseek.io',
                referer: 'https://www.turboseek.io/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        const { data: sources } = await inst.post('/getSources', { question: question });
        const { data: similarQuestions } = await inst.post('/getSimilarQuestions', { question: question, sources: sources });
        const { data: answer } = await inst.post('/getAnswer', { question: question, sources: sources });

        const cleanAnswer = answer.match(/<p>(.*?)<\/p>/gs)?.map(match => {
            return match.replace(/<\/?p>/g, '').replace(/<\/?strong>/g, '').replace(/<\/?em>/g, '').replace(/<\/?b>/g, '').replace(/<\/?i>/g, '').replace(/<\/?u>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();
        }).join('\n\n') || answer.replace(/<\/?[^>]+(>|$)/g, '').trim();

        return {
            answer: cleanAnswer,
            sources: sources.map(s => s.url),
            similarQuestions
        };
    } catch (error) {
        throw error;
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { question } = req.query || req.body;

    if (!question) {
        return res.status(400).json({ error: 'Please provide a question' });
    }

    try {
        const result = await turboseekLogic(question);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};