'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Upload, Lock, Globe, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Collection, Album, Privacy } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PhotoEntry {
  id: string
  file: File
  preview: string
  name: string
  privacy: Privacy
  collectionId: string | null
  albumId: string | null
  overridePrivacy: boolean
}

interface AddPhotoModalProps {
  onClose: () => void
  onBack: () => void
  preselectedCollection?: Collection
  preselectedAlbum?: Album
}

const privacyOptions: { value: Privacy; label: string; icon: React.ElementType }[] = [
  { value: 'private', label: 'Private', icon: Lock },
  { value: 'public', label: 'Public', icon: Globe },
]

const MAX_PHOTOS = 10

export default function AddPhotoModal({
  onClose,
  onBack,
  preselectedCollection,
  preselectedAlbum,
}: AddPhotoModalProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const [collections, setCollections] = useState<Collection[]>([])
  const [albumsMap, setAlbumsMap] = useState<Record<string, Album[]>>({})
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')
      setCollections(data ?? [])
      
      if (preselectedCollection?.id) {
        loadAlbums(preselectedCollection.id)
      }
    }
    load()
  }, [])

  async function loadAlbums(collectionId: string) {
    if (albumsMap[collectionId]) return
    
    const { data } = await supabase
      .from('albums')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order')
    
    setAlbumsMap((prev) => ({ ...prev, [collectionId]: data ?? [] }))
  }

  function addFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = imageFiles.slice(0, remaining)
    
    if (toAdd.length === 0) {
      if (photos.length >= MAX_PHOTOS) {
        setError(`Maximum ${MAX_PHOTOS} photos allowed`)
      }
      return
    }

    const defaultCollectionId = preselectedCollection?.id ?? null
    const defaultAlbumId = preselectedAlbum?.id ?? null
    
    let defaultPrivacy: Privacy = 'private'
    if (preselectedCollection) {
      defaultPrivacy = preselectedCollection.privacy
    } else if (defaultCollectionId) {
      const selectedCollection = collections.find(c => c.id === defaultCollectionId)
      if (selectedCollection) {
        defaultPrivacy = selectedCollection.privacy
      }
    }

    const newPhotos: PhotoEntry[] = toAdd.map((file, index) => ({
      id: `${Date.now()}_${index}_${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ''),
      collectionId: defaultCollectionId,
      albumId: defaultAlbumId,
      privacy: defaultPrivacy,
      overridePrivacy: false,
    }))

    setPhotos(prev => [...prev, ...newPhotos])
    setError(null)
    
    if (defaultCollectionId) loadAlbums(defaultCollectionId)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        addFiles(files)
      }
    },
    [collections, photos.length],
  )

  function updatePhoto(index: number, updates: Partial<PhotoEntry>) {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p))
    if (updates.collectionId) {
      loadAlbums(updates.collectionId)
      if (!photos[index]?.overridePrivacy) {
        const selectedCollection = collections.find(c => c.id === updates.collectionId)
        if (selectedCollection) {
          setPhotos(prev => prev.map((p, i) => i === index 
            ? { ...p, privacy: selectedCollection.privacy, overridePrivacy: false }
            : p
          ))
        }
      }
    }
  }

  function handlePrivacyChange(index: number, privacy: Privacy) {
    setPhotos(prev => prev.map((p, i) => i === index 
      ? { ...p, privacy, overridePrivacy: true }
      : p
    ))
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].preview)
    setPhotos(prev => prev.filter((_, i) => i !== index))
    if (currentPhotoIndex >= photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, photos.length - 2))
    }
  }

  function nextPhoto() {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1)
    }
  }

  function prevPhoto() {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (photos.length === 0) { 
      setError('Please select at least one photo to upload.'); 
      return 
    }
    
    // Проверяем все фото на наличие имени
    const invalidPhoto = photos.find(p => !p.name.trim())
    if (invalidPhoto) { 
      setError('Please enter a name for all photos.'); 
      return 
    }
    
    // Валидация: если выбрана коллекция, альбом обязателен для всех фото
    const hasCollection = photos.some(p => p.collectionId)
    const missingAlbum = photos.some(p => p.collectionId && !p.albumId)
    if (hasCollection && missingAlbum) {
      setError('Please select an album for all photos in the collection.');
      return
    }

    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    let uploaded = 0
    const total = photos.length

    try {
      for (const photo of photos) {
        const ext = photo.file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(path, photo.file, { upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
        
        const insertData: any = {
          album_id: photo.albumId || null,
          collection_id: photo.collectionId || null,
          user_id: user.id,
          name: photo.name.trim(),
          url: urlData.publicUrl,
          privacy: photo.privacy,
        }
        
        const { error: insertError } = await supabase.from('photos').insert(insertData)
        if (insertError) throw insertError
        
        uploaded++
        setUploadedCount(uploaded)
        setUploadProgress(Math.round((uploaded / total) * 100))
      }
      
      setUploadProgress(100)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 500)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const currentPhoto = photos[currentPhotoIndex]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-sm pb-1 z-10">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-base font-semibold text-foreground">
          Add Photos {photos.length > 0 && `(${photos.length}/${MAX_PHOTOS})`}
        </h2>
        <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Drop zone */}
      {photos.length < MAX_PHOTOS && (
        <div
          ref={dropZoneRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none',
            dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/40',
          )}
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Drop photos here or click to browse<br />
            <span className="text-xs text-primary">Up to {MAX_PHOTOS} photos • JPG, PNG, GIF</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
          />
        </div>
      )}

      {/* Photos carousel */}
      {photos.length > 0 && currentPhoto && (
        <div className="glass rounded-xl overflow-hidden">
          {/* Carousel navigation */}
          <div className="relative">
            <div className="relative h-64 bg-muted">
              <img
                src={currentPhoto.preview}
                alt={currentPhoto.name}
                className="w-full h-full object-contain bg-black/20"
              />
              
              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className={cn(
                      "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all",
                      currentPhotoIndex === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={currentPhotoIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all",
                      currentPhotoIndex === photos.length - 1 && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={currentPhotoIndex === photos.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Counter */}
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </div>
            
            {/* Remove button */}
            <button
              type="button"
              onClick={() => removePhoto(currentPhotoIndex)}
              className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="Remove photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Photo name"
              value={currentPhoto.name}
              onChange={(e) => updatePhoto(currentPhotoIndex, { name: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Collection (optional)</label>
                <select
                  value={currentPhoto.collectionId || ''}
                  onChange={(e) => updatePhoto(currentPhotoIndex, { collectionId: e.target.value || null, albumId: null })}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No collection (unsorted)</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Album {currentPhoto.collectionId && <span className="text-destructive">*</span>}
                </label>
                <select
                  value={currentPhoto.albumId || ''}
                  onChange={(e) => updatePhoto(currentPhotoIndex, { albumId: e.target.value || null })}
                  disabled={!currentPhoto.collectionId}
                  required={!!currentPhoto.collectionId}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">{currentPhoto.collectionId ? 'Select album' : 'No album (unsorted)'}</option>
                  {(albumsMap[currentPhoto.collectionId || ''] ?? []).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Privacy selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Privacy</label>
              <div className="flex gap-2">
                {privacyOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePrivacyChange(currentPhotoIndex, value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all',
                      currentPhoto.privacy === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
              
              {/* Privacy info */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                {currentPhoto.collectionId ? (
                  <>
                    {currentPhoto.overridePrivacy ? (
                      currentPhoto.privacy === 'public' ? (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>Overriding collection privacy. This photo will be <strong>public</strong></span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Overriding collection privacy. This photo will be <strong>private</strong></span>
                        </>
                      )
                    ) : (
                      currentPhoto.privacy === 'public' ? (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>Inherited from collection. This photo will be <strong>public</strong></span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Inherited from collection. This photo will be <strong>private</strong></span>
                        </>
                      )
                    )}
                  </>
                ) : (
                  <>
                    {currentPhoto.privacy === 'public' ? (
                      <>
                        <Globe className="w-3 h-3" />
                        <span>This photo will be visible to everyone</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>This photo will be visible only to you</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos preview strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setCurrentPhotoIndex(idx)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                idx === currentPhotoIndex ? "border-primary" : "border-transparent opacity-60"
              )}
            >
              <img src={photo.preview} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Uploading... {uploadedCount} of {photos.length} ({uploadProgress}%)
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 sticky bottom-0"
        >
          {loading ? `Uploading... ${uploadProgress}%` : `Upload ${photos.length} Photo${photos.length > 1 ? 's' : ''}`}
        </button>
      )}
    </form>
  )
}
