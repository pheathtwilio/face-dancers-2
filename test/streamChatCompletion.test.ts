import OpenAI from 'openai'
import { streamChatCompletion } from '../lib/openai'

jest.mock('openai') 

describe('streamChatCompletion', () => {
    let openaiMock: jest.Mocked<OpenAI>

    beforeEach(() => {

        openaiMock = new OpenAI() as jest.Mocked<OpenAI>
        (openaiMock.chat.completions.create as jest.Mock).mockResolvedValue({
            choices: [
                { message: { content: 'Hello! How can I help you?' } }
            ]
        })
    })

    it('should return a valid response from OpenAI', async () => {
        const response = await streamChatCompletion(
            'You are a helpful AI',
            'Hi there!'
        )

        expect(response).toBe('Hello! How can I help you?')
    })

    it('should return an empty string if OpenAI response is missing content', async () => {
        const createMock = (OpenAI as unknown as jest.Mock).mock.results[0].value.chat.completions.create;
        createMock.mockImplementationOnce(() =>
            Promise.resolve({
                choices: [
                    { message: { content: '' } }
                ]
            })
        )

        const response = await streamChatCompletion('', '')
        expect(response).toBe('')
    })

    it('should handle a case where choices array is empty', async () => {
        const createMock = (OpenAI as unknown as jest.Mock).mock.results[0].value.chat.completions.create;
        createMock.mockImplementationOnce(() =>
            Promise.resolve({
                choices: [ 
                    { message: { content: ''}}
                ]
            })
        )

        const response = await streamChatCompletion('', '')
        expect(response).toBe('')
    })

    it('should handle a case where choices array is undefined', async () => {
        const createMock = (OpenAI as unknown as jest.Mock).mock.results[0].value.chat.completions.create;
        createMock.mockImplementationOnce(() =>
            Promise.resolve({
                choices: undefined as any
            })
        )

        const response = await streamChatCompletion('', '')
        expect(response).toBe('')
    })
})
