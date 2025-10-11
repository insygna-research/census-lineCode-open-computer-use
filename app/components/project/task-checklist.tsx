"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  Circle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ListChecks,
  Sparkles,
  Activity,
  Target,
  Clock,
  CheckCheck
} from "lucide-react"
import { useState, useMemo } from "react"

interface SubTask {
  task_id: string
  description: string
  assigned_agent: string
  expected_output: string
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped" | "waiting_for_user"
  summary?: string
  error?: string
}

interface TaskPlan {
  main_objective: string
  subtasks: SubTask[]
  created_at: string
  completed_at?: string
}

interface TaskChecklistProps {
  taskPlan?: TaskPlan
  currentTaskId?: string
  className?: string
}

const statusIcons = {
  pending: <Circle className="h-2.5 w-2.5 text-gray-400 dark:text-gray-500" strokeWidth={1} />,
  in_progress: <motion.div className="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-500" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />,
  completed: <div className="h-2.5 w-2.5 rounded-full bg-green-500 dark:bg-green-500" />,
  failed: <div className="h-2.5 w-2.5 rounded-full bg-red-400 dark:bg-red-400" />,
  skipped: <Circle className="h-2.5 w-2.5 text-gray-300 dark:text-gray-600" strokeWidth={1} />,
  waiting_for_user: <motion.div className="h-2.5 w-2.5 rounded-full bg-yellow-400 dark:bg-yellow-400" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
}

export function TaskChecklist({ taskPlan, currentTaskId, className }: TaskChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Calculate progress
  const { completed, total, currentTask, allCompleted } = useMemo(() => {
    if (!taskPlan?.subtasks) return { completed: 0, total: 0, currentTask: null, allCompleted: false }
    
    const completedTasks = taskPlan.subtasks.filter(t => 
      t.status === "completed" || t.status === "skipped"
    ).length
    
    const current = taskPlan.subtasks.find(t => t.task_id === currentTaskId) || 
                   taskPlan.subtasks.find(t => t.status === "in_progress") ||
                   taskPlan.subtasks.find(t => t.status === "pending")
    
    return {
      completed: completedTasks,
      total: taskPlan.subtasks.length,
      currentTask: current,
      allCompleted: completedTasks === taskPlan.subtasks.length
    }
  }, [taskPlan, currentTaskId])

  if (!taskPlan) return null

  return (
    <div className={cn("relative", className)}>
      {/* Main Task Bar - Minimalistic */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
          "bg-white/80 hover:bg-white/90 border border-gray-200/80 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40 dark:border-zinc-800/50",
          isExpanded && "bg-white/95 shadow-sm dark:bg-zinc-900/50"
        )}
      >
        {/* Minimal Status Indicator */}
        <div className="flex items-center gap-1.5">
          {allCompleted ? (
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-500" />
          ) : currentTask?.status === "in_progress" ? (
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 dark:bg-muted-foreground/40" />
          )}
        </div>

        {/* Current Task - Minimal Text */}
        <div className="flex-1 text-left min-w-0">
          {allCompleted ? (
            <p className="text-xs text-gray-600 dark:text-zinc-400">
              All tasks completed
            </p>
          ) : currentTask ? (
            <p className="text-xs text-gray-700 dark:text-zinc-300 line-clamp-1">
              {currentTask.description}
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Ready
            </p>
          )}
        </div>

        {/* Minimal Progress */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {/* Progress dots instead of bar */}
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(5, total) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 w-1 rounded-full transition-all duration-300",
                    i < Math.floor((completed / total) * Math.min(5, total))
                      ? "bg-blue-500 dark:bg-blue-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono">
              {completed}/{total}
            </span>
          </div>
        </div>

        {/* Minimal Arrow */}
        <ChevronDown className={cn(
          "h-3 w-3 text-gray-400 dark:text-zinc-500 transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Popup Task List - positioned absolutely */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Invisible backdrop to close on click outside */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsExpanded(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute top-full mt-1.5 left-0 right-0 z-50"
            >
              <div className="p-2 rounded-md bg-white dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-gray-200 dark:border-zinc-800 space-y-0.5 max-h-[320px] overflow-y-auto">
              {taskPlan.subtasks.map((task, index) => {
                const isCurrent = task.task_id === currentTaskId || task.status === "in_progress"
                
                return (
                  <motion.div
                    key={task.task_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-150",
                      isCurrent && "bg-blue-50 dark:bg-blue-950/30",
                      task.status === "completed" && "opacity-50",
                      "hover:bg-gray-50 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    {/* Minimal Status */}
                    <div className="flex-shrink-0">
                      {statusIcons[task.status]}
                    </div>
                    
                    {/* Task Text - Super Minimal */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] text-gray-600 dark:text-zinc-400 line-clamp-1",
                        isCurrent && "text-gray-800 font-medium dark:text-zinc-200",
                        task.status === "completed" && "text-gray-400 dark:text-zinc-600"
                      )}>
                        <span className="font-mono text-gray-400 dark:text-zinc-600 mr-1">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {task.description}
                      </p>
                      
                      {/* Only show error for failed tasks */}
                      {task.error && task.status === "failed" && (
                        <p className="text-[10px] text-red-500 dark:text-zinc-500 mt-0.5 pl-6">
                          {task.error}
                        </p>
                      )}
                    </div>

                    {/* Current indicator - just a dot */}
                    {isCurrent && (
                      <div className="w-1 h-1 rounded-full bg-blue-500 dark:bg-zinc-400 animate-pulse" />
                    )}
                  </motion.div>
                )
              })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}