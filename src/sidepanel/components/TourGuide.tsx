import { useState, useEffect, useRef, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"
import { Progress } from "./ui/progress"

export type TourStep = {
  target: string
  title: string
  content: string
  position?: "top" | "right" | "bottom" | "left"
}

interface TourGuideProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onFinish: () => void
}

export function TourGuide({ steps, isOpen, onClose, onFinish }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})
  const [animation, setAnimation] = useState("")
  const tooltipRef = useRef<HTMLDivElement>(null)

  const calculatePosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return

    const targetElement = document.querySelector(steps[currentStep].target)
    if (!targetElement) return

    const targetRect = targetElement.getBoundingClientRect()
    const position = steps[currentStep].position || "bottom"

    setHighlightStyle({
      top: `${targetRect.top - 4}px`,
      left: `${targetRect.left - 4}px`,
      width: `${targetRect.width + 8}px`,
      height: `${targetRect.height + 8}px`,
    })

    const tooltipWidth = 260
    const tooltipHeight = tooltipRef.current?.getBoundingClientRect().height || 180
    const spacing = 16

    let top = 0
    let left = 0

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    switch (position) {
      case "top":
        top = targetRect.top - tooltipHeight - spacing
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case "bottom":
        top = targetRect.bottom + spacing
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.left - tooltipWidth - spacing
        break
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.right + spacing
        break
    }

    if (left < 12) left = 12
    if (left + tooltipWidth > viewportWidth - 12) left = viewportWidth - tooltipWidth - 12
    
    if (top < 12) {
      top = targetRect.bottom + spacing
    }
    if (top + tooltipHeight > viewportHeight - 12) {
      top = targetRect.top - tooltipHeight - spacing
      if (top < 12) {
        top = Math.max(12, (viewportHeight - tooltipHeight) / 2)
      }
    }

    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    })

    setAnimation("animate-fade-in")
  }, [isOpen, steps, currentStep])

  useEffect(() => {
    calculatePosition()
    window.addEventListener("resize", calculatePosition)
    return () => window.removeEventListener("resize", calculatePosition)
  }, [calculatePosition])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setAnimation("animate-fade-out")
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setAnimation("animate-fade-in")
      }, 150)
    } else {
      handleFinish()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setAnimation("animate-fade-out")
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setAnimation("animate-fade-in")
      }, 150)
    }
  }

  const handleFinish = () => {
    setCurrentStep(0)
    onFinish()
  }

  if (!isOpen || steps.length === 0) return null

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300"
        onClick={onClose}
      >
        <div
          className="absolute z-10 rounded-lg border-2 border-emerald-400 transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
          style={highlightStyle}
        />
      </div>

      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[110] rounded-xl bg-white dark:bg-slate-800 p-4 shadow-2xl border border-gray-200 dark:border-slate-700",
          animation
        )}
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white pr-6">
            {steps[currentStep].title}
          </h3>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {steps[currentStep].content}
        </p>

        <div className="space-y-3">
          <Progress value={progress} className="h-1.5" />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </>
                ) : (
                  "Finish 🎉"
                )}
              </button>
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
