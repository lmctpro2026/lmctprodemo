"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X } from "lucide-react"

interface Props {
  images: string[]
  vehicleKey: string // vehicle.id when editing, otherwise a temp slug
  onChange: (next: string[]) => void
}

const BUCKET = "vehicle-images"

export function VehicleImageUploader({ images, vehicleKey, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Not signed in")
      return
    }

    setUploading(true)
    const uploaded: string[] = []
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`Skipped ${file.name}: not an image`)
          continue
        }
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`Skipped ${file.name}: over 8MB`)
          continue
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const path = `${user.id}/${vehicleKey}/${filename}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type,
          })
        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`)
          continue
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
        uploaded.push(pub.publicUrl)
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded])
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`)
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleRemove(url: string) {
    onChange(images.filter((u) => u !== url))
    // Best-effort cleanup. The path is everything after `/storage/v1/object/public/${BUCKET}/`.
    try {
      const idx = url.indexOf(`/${BUCKET}/`)
      if (idx === -1) return
      const path = url.slice(idx + BUCKET.length + 2)
      const supabase = createClient()
      await supabase.storage.from(BUCKET).remove([path])
    } catch {
      // Non-fatal — the URL was already dropped from the vehicle record.
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {images.map((url) => (
          <div
            key={url}
            className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Vehicle"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Add photos</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        Up to 8MB per image. JPG/PNG/WebP. The first photo is the listing thumbnail.
      </p>
      {images.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([images[0], ...images.slice(1)])}
          className="hidden"
        >
          Reorder
        </Button>
      )}
    </div>
  )
}
