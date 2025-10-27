/// <reference types="chrome"/>
import { RuntimeLoader, useRive } from "@rive-app/react-webgl2"
import { useEffect, useState } from "react"

import { getTreeGrowthStage } from "../utils/tree"

interface TreeAnimationSectionProps {
  totalFocusTime: number // milliseconds
}

export function TreeAnimationSection({
  totalFocusTime
}: TreeAnimationSectionProps) {
  const baseGrowthStage = getTreeGrowthStage(totalFocusTime)
  const [runtimeLoaded, setRuntimeLoaded] = useState(false)
  const [animatedGrowthStage, setAnimatedGrowthStage] =
    useState(baseGrowthStage)

  // Configure Rive to use local WASM files from extension
  useEffect(() => {
    RuntimeLoader.setWasmUrl("/assets/rive.wasm")
    // RuntimeLoader.setWasmUrl("rive-wasm/rive_fallback.wasm");

    RuntimeLoader.getInstance(() => {
      console.log("Rive runtime loaded successfully")
      setRuntimeLoaded(true)
    })
  }, [])

  // Oscillate growth stage to make tree appear moving
  useEffect(() => {
    let animationFrame: number
    let startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      // Oscillate slowly over 8 seconds
      const offset = Math.sin((elapsed / 8000) * Math.PI * 2) * 0.5
      const newStage = Math.max(0, baseGrowthStage + offset)
      setAnimatedGrowthStage(newStage)

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [baseGrowthStage])

  const { RiveComponent, rive } = useRive({
    src: "/assets/8178-15744-focusforest.riv",
    autoplay: true,
    stateMachines: ["State Machine 1"]
  })

  // Update animation state based on animated growth stage
  useEffect(() => {
    if (!rive) return

    try {
      const stateMachineNames = rive.stateMachineNames

      if (stateMachineNames && stateMachineNames.length > 0) {
        const inputs = rive.stateMachineInputs(stateMachineNames[0])

        if (inputs && inputs.length > 0) {
          // Find the input named "input"
          const inputControl = inputs.find((input) => input.name === "input")

          if (inputControl) {
            // Map growth stage (0-1) to integer value (0-3 for seed/sapling/growing/mature)
            inputControl.value = animatedGrowthStage
          }
        }
      }
    } catch (error) {
      console.error("Error updating Rive animation:", error)
    }
  }, [rive, animatedGrowthStage])

  if (!runtimeLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/50">
        Loading...
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          animation: "sway 8s ease-in-out infinite"
        }}>
        <div
          className="w-full h-full scale-150 -translate-x-[15%] bottom-0 opacity-20"
          style={{ filter: "hue-rotate(120deg)" }}>
          <RiveComponent className="w-full h-full" />
        </div>
      </div>
      <style>{`
        @keyframes sway {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-3px) rotate(-0.5deg);
          }
          75% {
            transform: translateX(3px) rotate(0.5deg);
          }
        }
      `}</style>
    </div>
  )
}
