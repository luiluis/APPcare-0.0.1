import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, AlertOctagon } from 'lucide-react';

interface SecurityPinModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
  requiredPin?: string; // Default '1234'
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmação de Segurança",
  description = "Esta ação requer autorização. Insira seu PIN pessoal.",
  requiredPin = "1234"
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Apenas 1 digito
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-focus next
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
        handleConfirm();
    }
  };

  const handleConfirm = () => {
    if (pin.join('') === requiredPin) {
      onConfirm();
      onClose();
    } else {
      setError(true);
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative overflow-hidden">
        
        {/* Decorative Alert BG */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-orange-500"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 px-4">{description}</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              className={`w-12 h-14 border-2 rounded-xl text-center text-2xl font-bold outline-none transition-all
                ${error 
                  ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white text-gray-800'}
              `}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 font-bold text-center mb-4 flex items-center justify-center gap-1 animate-pulse">
            <AlertOctagon className="w-3 h-3" /> PIN Incorreto. Tente novamente.
          </p>
        )}

        <button 
          onClick={handleConfirm}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg shadow-gray-200 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Confirmar Identidade
        </button>
      </div>
    </div>
  );
};