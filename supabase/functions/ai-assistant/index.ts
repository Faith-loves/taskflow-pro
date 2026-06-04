import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const apiKey = Deno.env.get("XAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ answer: "Grok is connected, but XAI_API_KEY is not set in Supabase secrets yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          {
            role: "system",
            content:
              "You are TaskFlow AI, a friendly assistant inside the TaskFlow Pro project management app. You can answer normal conversational or random questions, but always connect your answer back to the current workspace, project, tasks, deadlines, team workload, meetings, or productivity when useful. Be concise, practical, and natural. If asked to generate tasks, return a numbered task breakdown with suggested priorities and next steps. Do not claim to access data outside the provided workspace context.",
          },
          {
            role: "user",
            content: `Workspace context:\n${JSON.stringify(context)}\n\nUser message: ${message}`,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ answer: "The AI service could not respond right now." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ answer: data.choices?.[0]?.message?.content ?? "I could not read the Grok response." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ answer: "I could not process that request." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
