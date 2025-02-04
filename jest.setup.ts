import OpenAI from 'openai';

// Mock OpenAI API
jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [
                            {
                                message: { content: "Hello! How can I help you?" }
                            }
                        ]
                    })
                }
            }
        }))
    };
});
