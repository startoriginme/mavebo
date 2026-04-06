'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Collection, Album, Photo, Privacy } from '@/lib/types'
import { Lock, Globe, Pencil, Trash2, Check, X, Plus, FolderOpen, Image, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import PhotoGrid from '@/components/gallery/photo-grid'
import AddPhotoModal from '@/components/add-photo-modal'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const privacyOpts: { value: Privacy; icon: React.ElementType; label: string }[] = [
  { value: 'private', icon: Lock, label: 'Private' },
  { value: 'public', icon: Globe, label: 'Public' },
]

interface Props {
  collection: Collection | null
  initialAlbums: Album[]
  unsortedPhotos?: Photo[]
}

export default function CollectionClient({ collection, initialAlbums, unsortedPhotos = [] }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [activeAlbum, setActiveAlbum] = useState<string>(initialAlbums[0]?.id ?? '')
  const [editingAlbum, setEditingAlbum] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [addPhotoOpen, setAddPhotoOpen] = useState(false)
  const [deletingCollection, setDeletingCollection] = useState(false)
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'photo' | 'album' | 'collection'; id: string; name: string } | null>(null)
  const [allCollections, setAllCollections] = useState<Collection[]>([])
  
  // Для редактирования названия коллекции
  const [editingCollection, setEditingCollection] = useState(false)
  const [collectionName, setCollectionName] = useState(collection?.name || '')
  
  // Для перемещения фото (через модалку в PhotoGrid)
  const [movePhotoData, setMovePhotoData] = useState<{ photo: Photo | null; open: boolean }>({ photo: null, open: false })
  const [selectedMoveCollection, setSelectedMoveCollection] = useState('')
  const [selectedMoveAlbum, setSelectedMoveAlbum] = useState('')
  const [albumsForMove, setAlbumsForMove] = useState<Album[]>([])

  const activeAlbumData = albums.find((a) => a.id === activeAlbum)
  const isUnsorted = collection === null

  // Загружаем все коллекции для перемещения
  useEffect(() => {
    async function loadCollections() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')
      setAllCollections(data ?? [])
    }
    loadCollections()
  }, [supabase])

  // Обновляем collectionName при изменении коллекции
  useEffect(() => {
    if (collection) {
      setCollectionName(collection.name)
    }
  }, [collection])

  async function renameCollection() {
    if (!collectionName.trim() || !collection) return
    await supabase
      .from('collections')
      .update({ name: collectionName })
      .eq('id', collection.id)
    setEditingCollection(false)
    router.refresh()
  }

  async function createAlbum() {
    if (!newAlbumName.trim() || !collection) return
    
    try {
      const { data, error } = await supabase
        .from('albums')
        .insert({
          collection_id: collection.id,
          name: newAlbumName,
          privacy: collection.privacy,
          sort_order: albums.length
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating album:', error)
        alert('Failed to create album: ' + error.message)
        return
      }
      
      if (data) {
        // Добавляем новый альбом с пустым массивом фото
        const newAlbum = { ...data, photos: [] }
        setAlbums(prev => [...prev, newAlbum])
        setActiveAlbum(data.id)
        setCreatingAlbum(false)
        setNewAlbumName('')
      }
    } catch (err) {
      console.error('Error in createAlbum:', err)
      alert('Failed to create album')
    }
  }

  async function renameAlbum(albumId: string) {
    if (!editName.trim()) return
    const { error } = await supabase.from('albums').update({ name: editName }).eq('id', albumId)
    if (error) {
      console.error('Error renaming album:', error)
      alert('Failed to rename album')
      return
    }
    setAlbums((prev) => prev.map((a) => (a.id === albumId ? { ...a, name: editName } : a)))
    setEditingAlbum(null)
  }

  async function deleteAlbum(albumId: string) {
    const { error } = await supabase.from('albums').delete().eq('id', albumId)
    if (error) {
      console.error('Error deleting album:', error)
      alert('Failed to delete album')
      return
    }
    const next = albums.filter((a) => a.id !== albumId)
    setAlbums(next)
    if (activeAlbum === albumId) setActiveAlbum(next[0]?.id ?? '')
    setDeleteDialog(null)
  }

  async function changePrivacy(albumId: string, privacy: Privacy) {
    const { error } = await supabase.from('albums').update({ privacy }).eq('id', albumId)
    if (error) {
      console.error('Error changing privacy:', error)
      return
    }
    setAlbums((prev) => prev.map((a) => (a.id === albumId ? { ...a, privacy } : a)))
  }

  async function deletePhoto(photoId: string) {
    const { error } = await supabase.from('photos').delete().eq('id', photoId)
    if (error) {
      console.error('Error deleting photo:', error)
      return
    }
    setAlbums((prev) =>
      prev.map((a) => ({
        ...a,
        photos: (a.photos ?? []).filter((p: Photo) => p.id !== photoId),
      })),
    )
    setDeleteDialog(null)
  }

  async function deleteCollection() {
    if (!collection) return
    setDeletingCollection(true)
    const { error } = await supabase.from('collections').delete().eq('id', collection.id)
    if (error) {
      alert(error.message)
      setDeletingCollection(false)
      return
    }
    router.push('/gallery')
    router.refresh()
  }

  // Функция для изменения приватности фото в коллекции
  async function updatePhotoPrivacy(photoId: string, newPrivacy: Privacy) {
    const { error } = await supabase
      .from('photos')
      .update({ privacy: newPrivacy })
      .eq('id', photoId)
    
    if (error) {
      console.error('Error updating photo privacy:', error)
      return
    }
    
    // Обновляем локальное состояние
    setAlbums(prev =>
      prev.map(album => ({
        ...album,
        photos: (album.photos ?? []).map(photo =>
          photo.id === photoId ? { ...photo, privacy: newPrivacy } : photo
        )
      }))
    )
  }

  // Функция для перемещения фото из модалки
  async function handleMovePhoto() {
    if (!movePhotoData.photo || !selectedMoveCollection) return

    let albumId = selectedMoveAlbum
    if (!albumId && selectedMoveCollection) {
      const { data: existingAlbum } = await supabase
        .from('albums')
        .select('id')
        .eq('collection_id', selectedMoveCollection)
        .eq('name', 'Unsorted')
        .maybeSingle()

      if (existingAlbum) {
        albumId = existingAlbum.id
      } else {
        const { data: newAlbum } = await supabase
          .from('albums')
          .insert({
            collection_id: selectedMoveCollection,
            name: 'Unsorted',
            privacy: 'private',
            sort_order: 0
          })
          .select()
          .single()
        albumId = newAlbum.id
      }
    }

    const { error } = await supabase
      .from('photos')
      .update({
        collection_id: selectedMoveCollection,
        album_id: albumId
      })
      .eq('id', movePhotoData.photo.id)

    if (!error) {
      // Удаляем фото из текущего альбома
      setAlbums(prev =>
        prev.map(a => ({
          ...a,
          photos: (a.photos ?? []).filter((p: Photo) => p.id !== movePhotoData.photo.id)
        }))
      )
    }

    setMovePhotoData({ photo: null, open: false })
    setSelectedMoveCollection('')
    setSelectedMoveAlbum('')
    setAlbumsForMove([])
  }

  function handleMoveCollectionChange(collectionId: string) {
    setSelectedMoveCollection(collectionId)
    setSelectedMoveAlbum('')
    supabase
      .from('albums')
      .select('*')
      .eq('collection_id', collectionId)
      .then(({ data }) => setAlbumsForMove(data ?? []))
  }

  // Если нет коллекции (Unsorted) — показываем специальный UI
  if (isUnsorted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Unsorted Photos</h2>
          </div>
          <button
            onClick={() => setAddPhotoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Photo
          </button>
        </div>

        {unsortedPhotos.length > 0 ? (
          <PhotoGrid
            photos={unsortedPhotos}
            onDelete={async (id) => {
              await supabase.from('photos').delete().eq('id', id)
            }}
            onMove={(photo) => setMovePhotoData({ photo, open: true })}
            onRename={async (id, newName) => {
              await supabase.from('photos').update({ name: newName }).eq('id', id)
            }}
            onPrivacyChange={async (id, privacy) => {
              await supabase.from('photos').update({ privacy }).eq('id', id)
            }}
            collections={allCollections}
            albumsMap={{}}
            isOwn={true}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No unsorted photos yet.</p>
            <button
              onClick={() => setAddPhotoOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add your first photo
            </button>
          </div>
        )}

        {/* Add photo modal */}
        {addPhotoOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setAddPhotoOpen(false)}>
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm glass rounded-2xl p-6 z-10" onClick={(e) => e.stopPropagation()}>
              <AddPhotoModal
                onClose={() => setAddPhotoOpen(false)}
                onBack={() => setAddPhotoOpen(false)}
                preselectedCollection={undefined}
              />
            </div>
          </div>
        )}

        {/* Delete dialog */}
        <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this photo? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteDialog && deletePhoto(deleteDialog.id)} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Move dialog */}
        <AlertDialog open={movePhotoData.open} onOpenChange={() => setMovePhotoData({ photo: null, open: false })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Choose a collection for {movePhotoData.photo?.name ? `"${movePhotoData.photo.name}"` : 'this photo'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Collection</label>
                <select
                  value={selectedMoveCollection}
                  onChange={(e) => handleMoveCollectionChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-input border border-border text-sm"
                >
                  <option value="">Select collection</option>
                  {allCollections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedMoveCollection && albumsForMove.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Album (optional)</label>
                  <select
                    value={selectedMoveAlbum}
                    onChange={(e) => setSelectedMoveAlbum(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-input border border-border text-sm"
                  >
                    <option value="">No album (will go to Unsorted)</option>
                    {albumsForMove.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMovePhoto} disabled={!selectedMoveCollection}>
                Move
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Если коллекция не найдена
  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    )
  }

  // Обычная коллекция с альбомами
  return (
    <div className="flex flex-col gap-5">
      {/* Collection header with rename */}
      <div className="flex items-center justify-between">
        {editingCollection ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-input border border-border text-lg font-semibold"
              autoFocus
            />
            <button onClick={renameCollection} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingCollection(false)} className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{collection.name}</h1>
            <button
              onClick={() => {
                setEditingCollection(true)
                setCollectionName(collection.name)
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Delete collection button */}
        <button
          onClick={() => setDeleteDialog({ type: 'collection', id: collection.id, name: collection.name })}
          disabled={deletingCollection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium"
        >
          <Trash2 className="w-3 h-3" />
          {deletingCollection ? 'Deleting...' : 'Delete Collection'}
        </button>
      </div>

      {/* Album tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {albums.map((album) => (
          <div key={album.id} className="relative group">
            <button
              onClick={() => setActiveAlbum(album.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeAlbum === album.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {album.name}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="glass rounded-xl">
                <DropdownMenuItem onClick={() => { setEditingAlbum(album.id); setEditName(album.name) }}>
                  <Pencil className="w-4 h-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialog({ type: 'album', id: album.id, name: album.name })} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Album
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        
        {creatingAlbum ? (
          <div className="flex items-center gap-2">
            <input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name"
              className="px-3 py-2 rounded-xl bg-input border border-border text-sm"
              autoFocus
            />
            <button onClick={createAlbum} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setCreatingAlbum(false)} className="w-8 h-8 rounded-lg bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingAlbum(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New Album
          </button>
        )}
      </div>

      {/* Active album controls */}
      {activeAlbumData && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          {editingAlbum === activeAlbumData.id ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-input border border-border text-sm"
                autoFocus
              />
              <button onClick={() => renameAlbum(activeAlbumData.id)} className="w-7 h-7 rounded-lg bg-primary">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingAlbum(null)} className="w-7 h-7 rounded-lg bg-muted">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{activeAlbumData.name}</span>
              <button onClick={() => { setEditingAlbum(activeAlbumData.id); setEditName(activeAlbumData.name) }} className="p-1 text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Privacy toggle */}
            <div className="flex gap-1">
              {privacyOpts.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => changePrivacy(activeAlbumData.id, value)}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                    activeAlbumData.privacy === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setAddPhotoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
            >
              <Plus className="w-3 h-3" /> Add Photo
            </button>
          </div>
        </div>
      )}

      {/* Photos grid */}
      {activeAlbumData && activeAlbumData.photos && (
        <PhotoGrid
          photos={activeAlbumData.photos as Photo[]}
          onDelete={async (id) => {
            await supabase.from('photos').delete().eq('id', id)
            setAlbums(prev => prev.map(a => ({
              ...a,
              photos: (a.photos ?? []).filter((p: Photo) => p.id !== id)
            })))
          }}
          onMove={(photo) => setMovePhotoData({ photo, open: true })}
          onRename={async (id, newName) => {
            await supabase.from('photos').update({ name: newName }).eq('id', id)
            setAlbums(prev => prev.map(a => ({
              ...a,
              photos: (a.photos ?? []).map(p => p.id === id ? { ...p, name: newName } : p)
            })))
          }}
          onPrivacyChange={async (id, privacy) => {
            await updatePhotoPrivacy(id, privacy)
          }}
          collections={allCollections}
          albumsMap={{}}
          isOwn={true}
        />
      )}

      {/* Add photo modal */}
      {addPhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setAddPhotoOpen(false)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm glass rounded-2xl p-6 z-10" onClick={(e) => e.stopPropagation()}>
            <AddPhotoModal
              onClose={() => setAddPhotoOpen(false)}
              onBack={() => setAddPhotoOpen(false)}
              preselectedCollection={collection}
              preselectedAlbum={activeAlbumData}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === 'photo' 
                ? 'Are you sure you want to delete this photo? This action cannot be undone.'
                : deleteDialog?.type === 'album' && deleteDialog?.name
                ? `Are you sure you want to delete "${deleteDialog.name}" and all its photos?`
                : deleteDialog?.type === 'collection' && deleteDialog?.name
                ? `Are you sure you want to delete the collection "${deleteDialog.name}" and all its albums and photos?`
                : 'Are you sure you want to delete this?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog?.type === 'photo') deletePhoto(deleteDialog.id)
                if (deleteDialog?.type === 'album') deleteAlbum(deleteDialog.id)
                if (deleteDialog?.type === 'collection') deleteCollection()
              }}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move photo dialog */}
      <AlertDialog open={movePhotoData.open} onOpenChange={() => setMovePhotoData({ photo: null, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a collection for {movePhotoData.photo?.name ? `"${movePhotoData.photo.name}"` : 'this photo'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Collection</label>
              <select
                value={selectedMoveCollection}
                onChange={(e) => handleMoveCollectionChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-input border border-border text-sm"
              >
                <option value="">Select collection</option>
                {allCollections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {selectedMoveCollection && albumsForMove.length > 0 && (
              <div>
                <label className="text-sm font-medium">Album (optional)</label>
                <select
                  value={selectedMoveAlbum}
                  onChange={(e) => setSelectedMoveAlbum(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-input border border-border text-sm"
                >
                  <option value="">No album (will go to Unsorted)</option>
                  {albumsForMove.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMovePhoto} disabled={!selectedMoveCollection}>
              Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
