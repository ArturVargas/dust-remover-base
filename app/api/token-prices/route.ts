import { NextRequest, NextResponse } from 'next/server';

// IDs de CoinGecko para nuestros tokens
const TOKEN_IDS = [
  'build-2',
  'apu-2', 
  'based-2',
  'vainguard',
  'noggles'
];

export async function GET(request: NextRequest) {
  try {
    // Construir la URL con todos los IDs de tokens
    const ids = TOKEN_IDS.join('%2C');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'x-cg-demo-api-key': process.env.COIN_GECKO_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transformar los datos para que sean más fáciles de usar
    const transformedData = Object.entries(data).map(([id, tokenData]: [string, any]) => ({
      id,
      price: tokenData.usd,
      priceChange24h: tokenData.usd_24h_change,
      marketCap: tokenData.usd_market_cap
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching token prices:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
