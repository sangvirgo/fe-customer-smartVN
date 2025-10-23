import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import paymentService from '../../services/paymentService';

export default function VNPayCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    handleVNPayCallback();
  }, []);

const handleVNPayCallback = async () => {
  try {
    // ✅ Parse callback info first
    const callbackInfo = paymentService.parseVNPayCallback(searchParams);
    
    if (!callbackInfo.orderId) {
      navigate('/order/failure?message=' + encodeURIComponent('Invalid payment'));
      return;
    }

    // ✅ Call backend to verify & update
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/payment/vnpay-callback?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Backend verification failed');
    }

    const result = await response.json();

    // ✅ Redirect based on result
    if (result.success) {
      navigate(`/order/success?orderId=${callbackInfo.orderId}`);
    } else {
      const errorMsg = result.message || 'Payment failed';
      navigate(`/order/failure?orderId=${callbackInfo.orderId}&message=${encodeURIComponent(errorMsg)}`);
    }
    
  } catch (error) {
    console.error('Error processing VNPay callback:', error);
    navigate('/order/failure?message=' + encodeURIComponent('Processing error'));
  } finally {
    setProcessing(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Processing Payment...</h2>
        <p className="text-gray-500 mt-2">Please wait while we verify your payment</p>
      </div>
    </div>
  );
}