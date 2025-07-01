import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CardAuthRequest {
  cardNumber: string;
  ccv: string;
  expiryMonth: number;
  expiryYear: number;
  phoneNumber?: string;
}

interface CardAuthResponse {
  authenticated: boolean;
  message: string;
  cardholderName?: string;
  balance?: number;
  cardId?: string;
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
        JSON.stringify({ authenticated: false, message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authData: CardAuthRequest = await req.json();

    // Validate required fields
    if (!authData.cardNumber || !authData.ccv || !authData.expiryMonth || !authData.expiryYear) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Missing required card information' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean and validate card number format
    const cleanCardNumber = authData.cardNumber.replace(/\s/g, '');
    
    if (!/^[0-9]{16}$/.test(cleanCardNumber)) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Invalid card number format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate CCV format
    if (!/^[0-9]{3}$/.test(authData.ccv)) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Invalid security code format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate expiry date
    if (authData.expiryMonth < 1 || authData.expiryMonth > 12 || authData.expiryYear < 2024) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Invalid expiry date' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find card in database
    const { data: card, error } = await supabase
      .from('cards')
      .select('id, name, card_id, ccv, expire_month, expire_year, phone_number, balance')
      .eq('card_id', cleanCardNumber)
      .single();

    if (error || !card) {
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          message: 'Card not registered in our system. Only registered cards can purchase tickets.' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate card details
    if (card.ccv !== authData.ccv) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Invalid security code' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (card.expire_month !== authData.expiryMonth || card.expire_year !== authData.expiryYear) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Invalid expiry date' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if card is expired
    const currentDate = new Date();
    const cardExpiryDate = new Date(authData.expiryYear, authData.expiryMonth - 1);
    if (cardExpiryDate < currentDate) {
      return new Response(
        JSON.stringify({ authenticated: false, message: 'Card has expired' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate phone number if provided
    if (authData.phoneNumber && card.phone_number) {
      const cleanPhoneNumber = authData.phoneNumber.replace(/\s/g, '');
      if (card.phone_number !== cleanPhoneNumber) {
        return new Response(
          JSON.stringify({ authenticated: false, message: 'Phone number does not match our records' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if card has sufficient balance for minimum transaction
    if (card.balance <= 0) {
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          message: 'Card has insufficient balance for transactions' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const response: CardAuthResponse = {
      authenticated: true,
      message: 'Card authenticated successfully',
      cardholderName: card.name,
      balance: card.balance,
      cardId: card.card_id
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Card authentication error:', error);
    return new Response(
      JSON.stringify({ 
        authenticated: false, 
        message: 'Authentication service error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});