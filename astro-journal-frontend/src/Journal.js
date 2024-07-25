import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Journal.css';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function Journal() {
    const [entry, setEntry] = useState('');
    const [logMessage, setLogMessage] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [journalEntries, setJournalEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    useEffect(() => {
        fetchJournalEntries();
    }, []);

    useEffect(() => {
        setEntry(transcript);
    }, [transcript]);

    const fetchJournalEntries = async () => {
        try {
            const response = await axios.get('http://localhost:5004/journal');
            setJournalEntries(response.data);
        } catch (error) {
            console.error('Error fetching journal entries', error);
        }
    };

    const logEntry = async () => {
        try {
            const response = await axios.post('http://localhost:5004/journal', { entry });
            setLogMessage(response.data.message);
            setEntry('');
            resetTranscript();
            fetchJournalEntries(); // refresh entries
        } catch (error) {
            console.error('Error logging journal entry', error);
        }
    };

    const getRecommendations = async (entryContent) => {
        try {
            const response = await axios.post('http://localhost:5004/journal/recommendations', { entry: entryContent });
            setRecommendations(response.data.recommendations);
        } catch (error) {
            console.error('Error getting recommendations', error);
        }
    };

    const deleteEntry = async (timestamp) => {
        try {
            const response = await axios.delete(`http://localhost:5004/journal/${encodeURIComponent(timestamp)}`);
            setLogMessage(response.data.message);
            fetchJournalEntries(); // refresh entries
        } catch (error) {
            console.error('Error deleting journal entry', error);
        }
    };

    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    return (
        <div className="Journal">
            <h2>Astro-Journal</h2>
            <div className="container">
                <div className="sidebar">
                    <h3>Previous Entries</h3>
                    {journalEntries.map((entry, index) => (
                        <div
                            key={index}
                            className="entry"
                        >
                            <p onClick={() => setSelectedEntry(entry)}>
                                <strong>{new Date(entry.timestamp).toLocaleString()}:</strong> {entry.entry.substring(0, 20)}...
                            </p>
                            <button onClick={() => deleteEntry(entry.timestamp)}>Delete</button>
                        </div>
                    ))}
                </div>
                <div className="main">
                    <textarea
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        placeholder="Log your thoughts here..."
                    ></textarea>
                    <div className="buttons">
                        <button onClick={logEntry}>Log Entry</button>
                        <button onClick={() => getRecommendations(entry)}>Get Recommendations</button>
                        <button onClick={SpeechRecognition.startListening}>Start Listening</button>
                    </div>
                    {logMessage && <p>{logMessage}</p>}
                    {recommendations && (
                        <div className="recommendations">
                            <button className="close" onClick={() => setRecommendations('')}>X</button>
                            <h3>Recommendations</h3>
                            <p>{recommendations}</p>
                        </div>
                    )}
                    {selectedEntry && (
                        <div className="selected-entry">
                            <button className="close" onClick={() => setSelectedEntry(null)}>X</button>
                            <h3>Selected Entry</h3>
                            <textarea
                                value={selectedEntry.entry}
                                onChange={(e) => setSelectedEntry({ ...selectedEntry, entry: e.target.value })}
                            ></textarea>
                            <button onClick={() => getRecommendations(selectedEntry.entry)}>Get Recommendations</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Journal;