
// Next.js API route setup
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const systemPrompt = 'You are an AI assistant designed to respond to user queries with clarity, helpfulness, and accuracy. Your goal is to provide informative and relevant responses in a concise and user-friendly manner. Tailor your answers to meet the users needs, ensuring they receive the best possible assistance.'

export async function POST(req) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
        })
        const data = await req.json()

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                ...data,
            ],
            model: 'gpt-3.5-turbo',
            stream: true,
        })

        const stream = new ReadableStream({
            async start(controller) { 
                const encoder = new TextEncoder()
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content
                        if (content) {
                            const text = encoder.encode(content)
                            controller.enqueue(text)
                        }
                    }
                } catch (err) {
                    console.error('Stream processing error:', err)
                    controller.error(err)
                } finally {
                    controller.close()
                }
            }
        })

        return new NextResponse(stream)
    } catch (error) {
        console.error('API route error:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
