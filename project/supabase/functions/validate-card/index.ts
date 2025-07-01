import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CardValidationRequest {
  cardNumber: string;
  ccv: string;
  expiryMonth: number;
  expiryYear: number;
}

interface CardValidationResponse {
  valid: boolean;
  message: string;
  cardholderName?: string;
  balance?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ valid: false, message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cardData: CardValidationRequest = await req.json();

    // Validate required fields
    if (!cardData.cardNumber || !cardData.ccv || !cardData.expiryMonth || !cardData.expiryYear) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Missing card information' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean card number (remove spaces)
    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');

    // Find card in database
    const { data: card, error } = await supabase
      .from('cards')
      .select('name, ccv, expire_month, expire_year, balance')
      .eq('card_id', cleanCardNumber)
      .single();

    if (error || !card) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Card not found' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate card details
    if (card.ccv !== cardData.ccv) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Invalid security code' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (card.expire_month !== cardData.expiryMonth || card.expire_year !== cardData.expiryYear) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Invalid expiry date' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if card is expired
    const currentDate = new Date();
    const cardExpiryDate = new Date(cardData.expiryYear, cardData.expiryMonth - 1);
    if (cardExpiryDate < currentDate) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Card has expired' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const response: CardValidationResponse = {
      valid: true,
      message: 'Card is valid',
      cardholderName: card.name,
      balance: card.balance
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Card validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: 'Validation service error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});