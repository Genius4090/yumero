import type { CSSProperties, ReactNode } from "react"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"
import { cn } from "@/lib/utils"

interface Item {
  id: number | string
}

interface SortableListProps<T extends Item> {
  items: T[]
  /** Called with the full new order after a drop */
  onReorder: (items: T[]) => void
  /** "list" = vertical rows (tables), "grid" = cards in a grid */
  layout?: "list" | "grid"
  disabled?: boolean
  /** Renders one item; `handle` must be placed where the user grabs it */
  children: (item: T, handle: ReactNode) => ReactNode
  className?: string
}

const SortableItem = <T extends Item>({ item, disabled, children }: { item: T; disabled?: boolean; children: SortableListProps<T>["children"] }) => {
  const { t } = useI18n()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled })
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, position: "relative", zIndex: isDragging ? 10 : undefined }

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t("admin.common.dragToReorder")}
      title={t("admin.common.dragToReorder")}
      disabled={disabled}
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
    >
      <GripVertical className="size-4" />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "rounded-2xl ring-2 ring-[#ff0099]/60")}>
      {children(item, handle)}
    </div>
  )
}

/** Drag-and-drop ordering built on dnd-kit; keyboard: focus the handle, Space, arrows, Space. */
const SortableList = <T extends Item>({ items, onReorder, layout = "list", disabled, children, className }: SortableListProps<T>) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} item={item} disabled={disabled}>
              {children}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default SortableList
