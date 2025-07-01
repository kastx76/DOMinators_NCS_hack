import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PaymentRequest {
  cardNumber: string;
  ccv: string;
  expiryMonth: number;
  expiryYear: number;
  phoneNumber: string;
  amount: number;
  passengerName: string;
  tripDetails: {
    from: string;
    to: string;
    date: string;
    trainNumber: string;
    departureTime: string;
    arrivalTime: string;
  };
}

interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  remainingBalance?: number;
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
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentData: PaymentRequest = await req.json();

    // Validate required fields
    if (!paymentData.cardNumber || !paymentData.ccv || !paymentData.amount || 
        !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required payment information' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid payment amount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean card number (remove spaces)
    const cleanCardNumber = paymentData.cardNumber.replace(/\s/g, '');

    // Find user's card
    const { data: userCard, error: userCardError } = await supabase
      .from('cards')
      .select('*')
      .eq('card_id', cleanCardNumber)
      .single();

    if (userCardError || !userCard) {
      return new Response(
        JSON.stringify({ success: false, message: 'Card not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate card details
    if (userCard.ccv !== paymentData.ccv) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid security code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (userCard.expire_month !== paymentData.expiryMonth || 
        userCard.expire_year !== paymentData.expiryYear) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid expiry date' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if card is expired
    const currentDate = new Date();
    const cardExpiryDate = new Date(paymentData.expiryYear, paymentData.expiryMonth - 1);
    if (cardExpiryDate < currentDate) {
      return new Response(
        JSON.stringify({ success: false, message: 'Card has expired' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check sufficient balance
    if (userCard.balance < paymentData.amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Insufficient balance. Available: ${userCard.balance} DA` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get admin card
    const { data: adminCard, error: adminCardError } = await supabase
      .from('cards')
      .select('*')
      .eq('card_id', 'ADMIN001')
      .single();

    if (adminCardError || !adminCard) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment processing error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Perform atomic transaction
    const newUserBalance = userCard.balance - paymentData.amount;
    const newAdminBalance = adminCard.balance + paymentData.amount;

    // Update user balance
    const { error: userUpdateError } = await supabase
      .from('cards')
      .update({ balance: newUserBalance })
      .eq('id', userCard.id);

    if (userUpdateError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment processing failed' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update admin balance
    const { error: adminUpdateError } = await supabase
      .from('cards')
      .update({ balance: newAdminBalance })
      .eq('id', adminCard.id);

    if (adminUpdateError) {
      // Rollback user balance update
      await supabase
        .from('cards')
        .update({ balance: userCard.balance })
        .eq('id', userCard.id);

      return new Response(
        JSON.stringify({ success: false, message: 'Payment processing failed' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate transaction ID
    const transactionId = `ALG${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const response: PaymentResponse = {
      success: true,
      message: 'Payment processed successfully',
      transactionId,
      remainingBalance: newUserBalance
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});