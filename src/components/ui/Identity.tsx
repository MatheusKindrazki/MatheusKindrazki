'use client'

import styles from './Identity.module.css'

type IdentityStatus = 'loading' | 'working' | 'robot' | 'rest'

interface IdentityProps {
  status?: IdentityStatus
  className?: string
}

export default function Identity({ status = 'rest', className = '' }: IdentityProps) {
  return (
    <div className={`${styles.identity} ${styles[status]} ${className}`}>
      <div />
      <div />
      <div />
      <div />
    </div>
  )
}
