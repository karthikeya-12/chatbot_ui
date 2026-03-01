import { useState } from 'react';

export function useChatStream() {
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);

    const sendMessage = async (userPrompt) => {
        // Add user message
        const newUserMessage = { role: 'user', content: userPrompt };
        setMessages((prev) => [...prev, newUserMessage]);

        // Add an empty assistant message that we will populate via stream
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        setIsStreaming(true);

        try {
            const response = await fetch('/llm/chat', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: userPrompt })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Iteratively extract JSON-like chunks: {"response": "..."} or {'response': '...'}
                while (true) {
                    // Match a dictionary object structure: {'response': 'content'}
                    // It handles single or double quotes for both the key and the value
                    const match = buffer.match(/\{\s*['"]response['"]\s*:\s*(['"])(.*?)(?<!\\)\1\s*\}/s);

                    if (!match) {
                        break;
                    }

                    const fullMatchString = match[0];
                    const quoteChar = match[1];
                    let rawContent = match[2];

                    if (rawContent) {
                        // Unescape characters
                        rawContent = rawContent.replace(/\\n/g, '\n')
                            .replace(/\\t/g, '\t')
                            .replace(new RegExp('\\\\' + quoteChar, 'g'), quoteChar)
                            .replace(/\\\\/g, '\\');

                        setMessages((prev) => {
                            // Instead of modifying the array in place which violates React state rules,
                            // create a truly new array with a new last message object
                            const newMessages = [...prev];
                            const lastIndex = newMessages.length - 1;
                            newMessages[lastIndex] = {
                                ...newMessages[lastIndex],
                                content: newMessages[lastIndex].content + rawContent
                            };
                            return newMessages;
                        });
                    }

                    // Remove processed chunk from buffer
                    const matchIndex = buffer.indexOf(fullMatchString);
                    buffer = buffer.slice(matchIndex + fullMatchString.length);
                }
            }
        } catch (error) {
            console.error('Error fetching stream:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '**Error**: Failed to connect to backend\\n' + error.message }
            ]);
        } finally {
            setIsStreaming(false);
        }
    };

    return { messages, isStreaming, sendMessage };
}
