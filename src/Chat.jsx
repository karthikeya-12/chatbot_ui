import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStream } from './hooks/useChatStream';

function Chat() {
    const [input, setInput] = useState('');
    const { messages, isStreaming, sendMessage } = useChatStream();
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isStreaming]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <h1>AI Chatbot</h1>
                <p>Real-time streaming UI</p>
            </header>

            <div className="messages-area">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✨</div>
                        <h2>How can I help you today?</h2>
                        <p>Send a message to start the stream.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`message-wrapper ${msg.role}`}>
                            <div className="avatar">
                                {msg.role === 'user' ? 'U' : 'AI'}
                            </div>
                            <div className="message-content">
                                {msg.role === 'user' ? (
                                    <p>{msg.content}</p>
                                ) : (
                                    <div className="markdown-body">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <form onSubmit={handleSubmit} className="input-form">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isStreaming}
                        className="chat-input"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className={`send-button ${isStreaming ? 'streaming' : ''}`}
                    >
                        {isStreaming ? (
                            <span className="loader"></span>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Chat;
