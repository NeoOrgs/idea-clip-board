import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    const { message } = await req.json();
    console.log('AI Assistant request from user:', user.id, 'Message:', message);

    // Analyze the request with Gemini
    const analysis = await analyzeRequest(message);
    console.log('Gemini analysis:', analysis);
    
    // Execute the task based on analysis
    const result = await executeTask(analysis, user, supabaseAdmin);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI assistant:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      response: "I encountered an error processing your request. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeRequest(message: string) {
  const prompt = `You are an AI assistant for a Pinterest-like social platform called PinBoard. Analyze this user request and determine what action to take.

Available actions:
1. CREATE_GROUP - Create a new group and optionally generate invite links
2. GENERATE_CONTENT - Generate content templates for posts/pins  
3. CREATE_PIN - Create a new pin with AI-generated content
4. GENERAL_CHAT - General conversation/help

User request: "${message}"

Respond with a JSON object containing:
- action: one of the actions above
- params: object with relevant parameters
- response: a friendly response to the user

Examples:
- "create a group named neem and give invitation link" -> {"action": "CREATE_GROUP", "params": {"name": "neem", "generateInvite": true}, "response": "I'll create the 'neem' group and generate an invitation link for you!"}
- "make a template for img post with description for phrolova wuthering waves" -> {"action": "GENERATE_CONTENT", "params": {"type": "image_post", "topic": "phrolova wuthering waves"}, "response": "I'll create a template for your Phrolova Wuthering Waves image post!"}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      }
    }),
  });

  const data = await response.json();
  const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    return JSON.parse(aiResponse);
  } catch (e) {
    // Fallback if JSON parsing fails
    return {
      action: "GENERAL_CHAT",
      params: {},
      response: aiResponse || "I'm here to help you with creating groups, generating content, and managing your pins!"
    };
  }
}

async function executeTask(analysis: any, user: any, supabase: any) {
  const { action, params, response } = analysis;
  
  switch (action) {
    case 'CREATE_GROUP':
      return await createGroup(params, user, supabase, response);
    
    case 'GENERATE_CONTENT':
      return await generateContent(params, response);
    
    case 'CREATE_PIN':
      return await createPin(params, user, supabase, response);
    
    default:
      return {
        success: true,
        response: response,
        data: null
      };
  }
}

async function createGroup(params: any, user: any, supabase: any, response: string) {
  try {
    // Create the group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: params.name,
        description: params.description || `Group created by AI assistant`,
        is_private: params.private || false,
        created_by: user.id
      })
      .select()
      .single();

    if (groupError) throw groupError;

    let inviteLink = null;
    
    if (params.generateInvite) {
      // Generate invite code
      const { data: inviteCode, error: codeError } = await supabase
        .rpc('generate_invite_code');
      
      if (codeError) throw codeError;

      // Create invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupData.id,
          created_by: user.id,
          invite_code: inviteCode,
          expires_at: null, // No expiry
          max_uses: null // No limit
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      inviteLink = `${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'lovable.app')}/join/${inviteCode}`;
    }

    return {
      success: true,
      response: response + (inviteLink ? `\n\nHere's your invite link: ${inviteLink}` : ''),
      data: {
        group: groupData,
        inviteLink: inviteLink
      }
    };
  } catch (error) {
    console.error('Error creating group:', error);
    return {
      success: false,
      error: error.message,
      response: "Sorry, I couldn't create the group. Please try again."
    };
  }
}

async function generateContent(params: any, response: string) {
  try {
    let contentPrompt = '';
    
    if (params.type === 'image_post' && params.topic) {
      contentPrompt = `Create a compelling social media post template for "${params.topic}". Include:
1. An engaging title
2. A detailed description (2-3 sentences)
3. 5-8 relevant hashtags
4. A call-to-action

Make it suitable for a Pinterest-like platform focused on visual content.`;
    } else {
      contentPrompt = `Create a social media content template based on: ${JSON.stringify(params)}`;
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: contentPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    const data = await geminiResponse.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      success: true,
      response: response + "\n\nHere's your content template:\n\n" + content,
      data: {
        template: content,
        topic: params.topic
      }
    };
  } catch (error) {
    console.error('Error generating content:', error);
    return {
      success: false,
      error: error.message,
      response: "Sorry, I couldn't generate the content template. Please try again."
    };
  }
}

async function createPin(params: any, user: any, supabase: any, response: string) {
  // This would be implemented to create actual pins with AI-generated content
  return {
    success: true,
    response: "Pin creation feature is coming soon! For now, I can help you create groups and generate content templates.",
    data: null
  };
}