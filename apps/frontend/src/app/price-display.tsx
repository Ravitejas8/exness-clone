"use client";

import { useState, useEffect } from 'react';

export function PriceDisplay() {
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");

    ws.onopen = () => {
      console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
      console.log('Received data from WebSocket:', event.data); 
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data.price === 'number') {
          setPrice(data.price);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="text-center p-4">
      <h1 className="text-2xl font-bold">Current SOL Price</h1>
      <p className="text-4xl text-green-500">
        {price > 0 ? `$${price.toFixed(2)}` : 'Connecting...'}
      </p>
    </div>
  );
}