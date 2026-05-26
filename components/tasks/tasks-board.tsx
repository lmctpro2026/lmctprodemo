"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { Plus, ListTodo, Clock, CheckCircle, Loader2, Trash2 } from "lucide-react"

interface TasksBoardProps {
  initialTasks: Task[]
  userId: string
}

async function fetchTasks(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("tasks")
    .select("*, vehicles(*), customers(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return data || []
}

export function TasksBoard({ initialTasks, userId }: TasksBoardProps) {
  const { data: tasks, mutate } = useSWR(
    ["tasks", userId],
    () => fetchTasks(userId),
    { fallbackData: initialTasks }
  )

  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  })

  const todoTasks = tasks?.filter(t => t.status === "todo") || []
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || []
  const doneTasks = tasks?.filter(t => t.status === "done") || []

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("tasks").insert({
      user_id: userId,
      title: formData.title,
      description: formData.description || "",
      due_date: formData.due_date || null,
      priority: formData.priority as Task["priority"],
      status: "todo",
    })

    setLoading(false)
    if (error) {
      toast.error(`Failed to add task: ${error.message}`)
      return
    }

    toast.success("Task added")
    setFormData({ title: "", description: "", due_date: "", priority: "medium" })
    setAddOpen(false)
    mutate()
  }

  async function updateTaskStatus(taskId: string, status: Task["status"]) {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId)
    if (error) {
      toast.error(`Failed to update task: ${error.message}`)
      return
    }
    mutate()
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)
    if (error) {
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success("Task deleted")
    mutate()
  }

  function TaskCard({ task }: { task: Task }) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border group">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteTask(task.id)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={
            task.priority === "high" ? "destructive" :
            task.priority === "medium" ? "warning" : "secondary"
          } className="text-xs">
            {task.priority}
          </Badge>
          {task.due_date && (
            <span className="text-xs text-muted-foreground">
              Due: {formatDate(task.due_date)}
            </span>
          )}
        </div>
        <div className="flex gap-1 mt-2">
          {task.status !== "todo" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateTaskStatus(task.id, "todo")}
            >
              To Do
            </Button>
          )}
          {task.status !== "in_progress" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateTaskStatus(task.id, "in_progress")}
            >
              In Progress
            </Button>
          )}
          {task.status !== "done" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => updateTaskStatus(task.id, "done")}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* To Do Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              To Do
              <Badge variant="secondary" className="ml-auto">{todoTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todoTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
            ) : (
              todoTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>

        {/* In Progress Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
              <Badge variant="secondary" className="ml-auto">{inProgressTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
            ) : (
              inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>

        {/* Done Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Done
              <Badge variant="secondary" className="ml-auto">{doneTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {doneTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
            ) : (
              doneTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task for your to-do list</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData(p => ({ ...p, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
