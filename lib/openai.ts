import OpenAI  from 'openai'
const openai = new OpenAI()

/**
 * @param system The system prompt 
 * @param prompt The prompt text to send.
 */
export async function streamChatCompletion(
        system: string, prompt: string,
    ): Promise<string> {
        const response = await openai.chat.completions.create(
        {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: prompt }
            ],
            stream: false,
        }
    )
    if(response.choices === undefined)
        return ''
    if(!response.choices || response.choices.length == 0)
        return ''
    if(!response.choices[0].message.content)
        return ''
   
    return response?.choices[0]?.message.content
}
