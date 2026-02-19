'use client'

import { useState, type FormEvent } from 'react'
import { getColorValue } from '@/lib/colors'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')

    // Placeholder - integrate with Formspree/EmailJS later
    setTimeout(() => {
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 3000)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[500px]">
      <div className="group">
        <label className="block text-[#666] text-xs uppercase tracking-wider mb-2">
          Nome
        </label>
        <input
          type="text"
          name="name"
          required
          className="w-full bg-transparent border-b border-[#333] text-white pb-2 outline-none transition-all duration-700 focus:border-b-2"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
          }}
          onFocus={(e) => e.target.style.borderColor = getColorValue('red')}
          onBlur={(e) => e.target.style.borderColor = '#333'}
        />
      </div>

      <div className="group">
        <label className="block text-[#666] text-xs uppercase tracking-wider mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          className="w-full bg-transparent border-b border-[#333] text-white pb-2 outline-none transition-all duration-700 focus:border-b-2"
          style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
          onFocus={(e) => e.target.style.borderColor = getColorValue('yellow')}
          onBlur={(e) => e.target.style.borderColor = '#333'}
        />
      </div>

      <div className="group">
        <label className="block text-[#666] text-xs uppercase tracking-wider mb-2">
          Mensagem
        </label>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full bg-transparent border-b border-[#333] text-white pb-2 outline-none transition-all duration-700 focus:border-b-2 resize-none"
          style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
          onFocus={(e) => e.target.style.borderColor = getColorValue('blue')}
          onBlur={(e) => e.target.style.borderColor = '#333'}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="relative inline-block font-bold text-sm transition-all duration-700 group"
        style={{
          color: status === 'sent' ? getColorValue('green') : getColorValue('red'),
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        <span className="absolute left-0 bottom-0 h-[2px] w-[21px] group-hover:w-full transition-all duration-700"
          style={{
            backgroundColor: status === 'sent' ? getColorValue('green') : getColorValue('red'),
            transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        />
        {status === 'idle' && 'Enviar'}
        {status === 'sending' && 'Enviando...'}
        {status === 'sent' && 'Enviado!'}
        {status === 'error' && 'Erro. Tentar novamente.'}
      </button>
    </form>
  )
}
