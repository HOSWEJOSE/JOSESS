import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/customer', { replace: true });
  }, [navigate]);

  return null;
}
