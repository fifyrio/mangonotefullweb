'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProcessingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  
  const steps = [
    {
      id: 1,
      title: 'Note is creating',
      description: '',
      status: 'completed' as const
    },
    {
      id: 2,
      title: 'PDF is uploading',
      description: '00:01:99',
      status: 'progress' as const
    },
    {
      id: 3,
      title: 'AI is generating note',
      description: 'This process may take few seconds to few minutes',
      status: 'pending' as const
    },
    {
      id: 4,
      title: 'Note is ready',
      description: '',
      status: 'pending' as const
    }
  ]

  const [processSteps, setProcessSteps] = useState(steps)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < 4) {
        const newSteps = [...processSteps]
        if (currentStep === 2) {
          newSteps[1].status = 'completed'
          newSteps[2].status = 'progress'
        } else if (currentStep === 3) {
          newSteps[2].status = 'completed'
          newSteps[3].status = 'progress'
        }
        setProcessSteps(newSteps)
        setCurrentStep(currentStep + 1)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentStep])

  const getStepIcon = (step: typeof steps[0], index: number) => {
    if (step.status === 'completed') {
      return (
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    } else if (step.status === 'progress') {
      return (
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )
    } else {
      return (
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
          <span className="text-white font-bold">{step.id}</span>
        </div>
      )
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">Completed</span>
        </div>
      )
    } else if (status === 'progress') {
      return (
        <div className="flex items-center gap-2 text-purple-400">
          <div className="w-4 h-4">
            <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-sm font-medium">Progress</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span className="text-sm font-medium">Pending</span>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Close button */}
      <button 
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        onClick={() => router.back()}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="max-w-2xl mx-auto pt-20 px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-black mb-4">Note is generating</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Don't close this page until the note is ready</p>
          </div>
        </div>

        <div className="space-y-8">
          {processSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-6">
              {getStepIcon(step, index)}
              
              <div className="flex-1 min-h-[48px] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-black mb-1">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                  )}
                </div>
                
                <div>
                  {getStatusBadge(step.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View note button - only show when all steps are completed */}
        {currentStep >= 4 && (
          <div className="mt-12 text-center">
            <button 
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-medium flex items-center gap-3 mx-auto transition-colors"
              onClick={() => router.push('/notes/1')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View note now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}