import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import paymentService from '../../services/paymentService'; // Assuming you have parse logic here

function VNPayCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse the VNPay response parameters from the URL
    // You might want to move the parsing logic into paymentService
    // const { orderId, success, message, transactionNo, responseCode } = paymentService.parseVNPayCallback(searchParams);

    // --- OR Parse directly here ---
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    const vnp_Message = searchParams.get('vnp_Message'); // Optional message from VNPay
    const orderId = vnp_TxnRef?.split('_')[0]; // Extract orderId assuming format orderId_timestamp
    const success = vnp_ResponseCode === '00';
    // Decode message if needed (Vietnamese characters)
    const message = vnp_Message ? decodeURIComponent(vnp_Message.replace(/\+/g, ' ')) : (success ? 'Payment successful' : 'Payment failed');
    // -----------------------------

    console.log("VNPay Callback Params:", Object.fromEntries(searchParams.entries())); // Log received params

    if (!orderId) {
       toast.error("Could not determine Order ID from VNPay response.");
       navigate('/profile?tab=orders'); // Redirect to orders history if orderId is missing
       return;
    }

    if (success) {
      // Payment successful
      toast.success(message || 'Payment completed successfully!');
      // Redirect to your order success page, passing the orderId
      navigate(`/order/success?orderId=${orderId}`);
    } else {
      // Payment failed or cancelled
      console.error("VNPay Payment Failed:", { orderId, responseCode: vnp_ResponseCode, message });
      toast.error(message || 'Payment failed or was cancelled.');
      // Redirect to your order failure page
      navigate(`/order/failure?orderId=${orderId}&message=${encodeURIComponent(message)}`);
    }

    // This component only handles the redirect, so the effect runs once
  }, [searchParams, navigate]);

  // Display a loading/processing message while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <h1 className="text-xl font-semibold text-gray-800">Processing VNPay Payment</h1>
      <p className="text-gray-600">Please wait while we confirm your transaction...</p>
    </div>
  );
}

export default VNPayCallbackPage;