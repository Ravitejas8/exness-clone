
import { PriceDisplay } from './price-display';
import { CandleChartWrapper } from './candle-chart-wrapper'; // Import your new wrapper component

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-12 p-12">
      <PriceDisplay />
      
      {/* Use the wrapper component here */}
      <CandleChartWrapper />
    </main>
  );
}