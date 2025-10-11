"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  Play,
  Pause,
  Terminal,
  Globe,
  Monitor,
  Brain,
  Target,
  Zap,
  FileText,
  User
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SubTask {
  task_id: string
  description: string
  assigned_agent: string
  expected_output: string
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped" | "waiting_for_user"
  summary?: string
  error?: string
  start_time?: string
  end_time?: string
  retry_count?: number
}

interface TaskPlan {
  main_objective: string
  subtasks: SubTask[]
  created_at: string
  completed_at?: string
}

interface TaskExecutionDisplayProps {
  taskPlan?: TaskPlan
  currentTaskId?: string
  isStreaming?: boolean
  className?: string
}

const agentIcons: Record<string, React.ReactNode> = {
  browser_agent: <Globe className="h-4 w-4" />,
  terminal_agent: <Terminal className="h-4 w-4" />,
  desktop_agent: <Monitor className="h-4 w-4" />,
  task_planner: <Brain className="h-4 w-4" />
}

const statusColors = {
  pending: "text-gray-500 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800",
  in_progress: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  completed: "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  failed: "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  skipped: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  waiting_for_user: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
}

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4" />,
  failed: <AlertCircle className="h-4 w-4" />,
  skipped: <ChevronRight className="h-4 w-4" />,
  waiting_for_user: <User className="h-4 w-4 animate-pulse" />
}

export function TaskExecutionDisplay({ 
  taskPlan, 
  currentTaskId,
  isStreaming = false,
  className 
}: TaskExecutionDisplayProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [autoExpand, setAutoExpand] = useState(true)
  
  // Auto-expand current task
  useEffect(() => {
    if (currentTaskId && autoExpand) {
      setExpandedTasks(prev => {
        const newSet = new Set(prev)
        newSet.add(currentTaskId)
        return newSet
      })
    }
  }, [currentTaskId, autoExpand])

  // Calculate progress
  const progress = useMemo(() => {
    if (!taskPlan?.subtasks.length) return 0
    const completed = taskPlan.subtasks.filter(t => 
      t.status === "completed" || t.status === "skipped"
    ).length
    return (completed / taskPlan.subtasks.length) * 100
  }, [taskPlan])

  const activeTasks = useMemo(() => 
    taskPlan?.subtasks.filter(t => t.status === "in_progress").length || 0,
    [taskPlan]
  )

  const completedTasks = useMemo(() => 
    taskPlan?.subtasks.filter(t => t.status === "completed").length || 0,
    [taskPlan]
  )

  const failedTasks = useMemo(() => 
    taskPlan?.subtasks.filter(t => t.status === "failed").length || 0,
    [taskPlan]
  )

  if (!taskPlan) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-muted p-3">
            <Zap className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Ready to Execute</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Task plan will appear here when execution begins
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
    setAutoExpand(false) // Disable auto-expand when user manually toggles
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Card */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Task Execution Plan</h3>
              {isStreaming && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Streaming
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {taskPlan.main_objective}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Progress: {completedTasks}/{taskPlan.subtasks.length} tasks
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3">
          {activeTasks > 0 && (
            <Badge variant="default" className="text-xs bg-blue-500">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {activeTasks} Active
            </Badge>
          )}
          {completedTasks > 0 && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {completedTasks} Done
            </Badge>
          )}
          {failedTasks > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {failedTasks} Failed
            </Badge>
          )}
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {taskPlan.subtasks.map((task, index) => {
            const isExpanded = expandedTasks.has(task.task_id)
            const isCurrent = task.task_id === currentTaskId
            const isActive = task.status === "in_progress"
            
            return (
              <motion.div
                key={task.task_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05
                }}
              >
                <Card 
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    statusColors[task.status],
                    isCurrent && "ring-2 ring-primary ring-offset-2",
                    isActive && "shadow-lg shadow-blue-500/10"
                  )}
                >
                  <button
                    onClick={() => toggleTask(task.task_id)}
                    className="w-full p-4 text-left hover:bg-muted/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className={cn(
                        "rounded-full p-1.5 mt-0.5",
                        task.status === "completed" && "bg-green-100 dark:bg-green-900/50",
                        task.status === "in_progress" && "bg-blue-100 dark:bg-blue-900/50",
                        task.status === "failed" && "bg-red-100 dark:bg-red-900/50",
                        task.status === "pending" && "bg-gray-100 dark:bg-gray-900/50",
                        task.status === "waiting_for_user" && "bg-purple-100 dark:bg-purple-900/50"
                      )}>
                        {statusIcons[task.status]}
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {task.task_id}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50">
                            {agentIcons[task.assigned_agent] || <Brain className="h-3 w-3" />}
                            <span className="ml-1">{task.assigned_agent.replace('_', ' ')}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium line-clamp-2">
                          {task.description}
                        </p>

                        {task.status === "in_progress" && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" 
                                style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" 
                                style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" 
                                style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Executing...
                            </span>
                          </div>
                        )}

                        {task.summary && !isExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.summary}
                          </p>
                        )}
                      </div>

                      {/* Expand Icon */}
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t"
                      >
                        <div className="p-4 space-y-3 bg-background/50">
                          {/* Expected Output */}
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">
                              Expected Output
                            </h4>
                            <p className="text-sm">{task.expected_output}</p>
                          </div>

                          {/* Summary/Result */}
                          {task.summary && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                                {task.status === "completed" ? "Result" : "Current Status"}
                              </h4>
                              <p className="text-sm">{task.summary}</p>
                            </div>
                          )}

                          {/* Error Message */}
                          {task.error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                              <h4 className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                                Error Details
                              </h4>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {task.error}
                              </p>
                              {task.retry_count && task.retry_count > 0 && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Retried {task.retry_count} time{task.retry_count > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Timing Info */}
                          {(task.start_time || task.end_time) && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {task.start_time && (
                                <span>Started: {new Date(task.start_time).toLocaleTimeString()}</span>
                              )}
                              {task.end_time && (
                                <span>Ended: {new Date(task.end_time).toLocaleTimeString()}</span>
                              )}
                              {task.start_time && task.end_time && (
                                <span>
                                  Duration: {Math.round((new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 1000)}s
                                </span>
                              )}
                            </div>
                          )}

                          {/* User Input Required */}
                          {task.status === "waiting_for_user" && (
                            <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                  User input required
                                </span>
                              </div>
                              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                                Please provide the necessary information to continue
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}