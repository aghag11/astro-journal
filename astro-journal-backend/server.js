require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5004;

// use CORS middleware
app.use(cors());

app.use(express.json());

// logging journal entries
let journalEntries = [];

app.post('/journal', (req, res) => {
    const { entry } = req.body;
    const newEntry = { entry, timestamp: new Date().toISOString() };
    journalEntries.push(newEntry);
    res.json({ message: 'Journal entry logged successfully!', entry: newEntry });
});

// getting all journal entries
app.get('/journal', (req, res) => {
    res.json(journalEntries);
});

// deleting a journal entry
app.delete('/journal/:timestamp', (req, res) => {
    const { timestamp } = req.params;
    journalEntries = journalEntries.filter(entry => entry.timestamp !== timestamp);
    res.json({ message: 'Journal entry deleted successfully!' });
});

// getting recommendations based on ur journal entry
app.post('/journal/recommendations', async (req, res) => {
    const { entry } = req.body;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are Astro-Companion, a supportive chatbot designed to help astronauts with their mental health. Provide recommendations based on their journal entries.`
                    },
                    { role: 'user', content: entry }
                ],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        const recommendations = response.data.choices[0].message.content;
        res.json({ recommendations });
    } catch (error) {
        console.error('Error generating recommendations:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error generating recommendations' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});