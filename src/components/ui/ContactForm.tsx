'use client'

import { useState, type FormEvent, useId } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { getColorValue } from '@/lib/colors'

type Status = 'idle' | 'sending' | 'sent' | 'error'

interface FieldProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'textarea'
  name: string
  required?: boolean
  rows?: number
}

function FloatingField({ id, label, type = 'text', name, required, rows = 4 }: FieldProps) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  const labelFloated = focused || hasValue
  const accent = getColorValue('red')

  const sharedInputProps = {
    id,
    name,
    required,
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(false)
      setHasValue(e.target.value.length > 0)
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setHasValue(e.target.value.length > 0),
    className:
      'peer w-full bg-transparent text-white text-[14px] leading-[22px] pt-5 pb-2 outline-none resize-none',
    style: {
      fontFamily: 'var(--font-body)',
    } as React.CSSProperties,
  }

  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 uppercase tracking-[0.25em] transition-all duration-500"
        style={{
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
          top: labelFloated ? '0px' : '22px',
          fontSize: labelFloated ? '9.5px' : '11px',
          color: labelFloated ? (focused ? accent : '#888') : 'var(--color-kindra-meta-low)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.25em',
        }}
      >
        {label}
      </label>

      {type === 'textarea' ? (
        <textarea rows={rows} {...sharedInputProps} />
      ) : (
        <input type={type} {...sharedInputProps} />
      )}

      {/* Underline */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 bottom-0 h-px w-full bg-[#333]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 bottom-0 h-[2px] w-0 transition-all duration-700 peer-focus:w-full"
        style={{
          backgroundColor: accent,
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      />
    </div>
  )
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const nameId = useId()
  const emailId = useId()
  const messageId = useId()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')

    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean }
        | null

      if (res.ok && json?.ok) {
        setStatus('sent')
        form.reset()
        setTimeout(() => setStatus('idle'), 4000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const red = getColorValue('red')
  const green = getColorValue('green')

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[520px] flex-col gap-8">
      <FloatingField id={nameId} label="Name" name="name" required />
      <FloatingField id={emailId} label="Email" type="email" name="email" required />
      <FloatingField id={messageId} label="Message" type="textarea" name="message" required rows={4} />

      <button
        type="submit"
        disabled={status === 'sending'}
        className="group/submit relative mt-2 inline-flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-[0.28em] transition-all duration-700"
        style={{
          color: status === 'sent' ? green : red,
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span className="relative">
          {status === 'idle' && 'Send message'}
          {status === 'sending' && 'Sending...'}
          {status === 'sent' && 'Sent — thanks'}
          {status === 'error' && 'Error. Try again.'}
          <span
            className="absolute -bottom-1 left-0 h-[2px] w-[20px] transition-all duration-700 group-hover/submit:w-full"
            style={{
              backgroundColor: status === 'sent' ? green : red,
              transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
            }}
          />
        </span>
        <FiArrowRight className="-translate-x-1 transition-transform duration-700 group-hover/submit:translate-x-0" />
      </button>
    </form>
  )
}
