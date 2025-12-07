import React from 'react';
import ModernCheckoutModal from './ModernCheckoutModal';

export default function PremiumModal({ isOpen, onClose, user, onSuccess }) {
  return (
    <ModernCheckoutModal 
      isOpen={isOpen} 
      onClose={onClose} 
      user={user} 
      onSuccess={onSuccess}
      initialPlan="premium"
    />
  );
}