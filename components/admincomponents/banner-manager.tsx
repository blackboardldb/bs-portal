"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useBlackSheepStore, useBanners } from "@/lib/blacksheep-store";
import { Banner } from "@/lib/types";
import { BannerCard } from "./banner-card";
import { BannerModal } from "./banner-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BannerManagerProps {
  className?: string;
}

export function BannerManager({ className }: BannerManagerProps) {
  const banners = useBanners();
  const { toggleBanner, deleteBanner, reorderBanners } = useBlackSheepStore();

  // Modal state
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Delete confirmation state
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Drag and drop state (for future implementation)
  const [draggedBanner, setDraggedBanner] = useState<Banner | null>(null);

  const activeBanners = banners.filter((banner) => banner.isActive);
  const inactiveBanners = banners.filter((banner) => !banner.isActive);

  const handleToggleBanner = useCallback(
    (bannerId: string) => {
      toggleBanner(bannerId);
    },
    [toggleBanner]
  );

  const handleCreateBanner = useCallback(() => {
    setSelectedBanner(null);
    setModalMode("create");
    setShowModal(true);
  }, []);

  const handleEditBanner = useCallback((banner: Banner) => {
    setSelectedBanner(banner);
    setModalMode("edit");
    setShowModal(true);
  }, []);

  const handleDeleteBanner = useCallback((banner: Banner) => {
    setBannerToDelete(banner);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (bannerToDelete) {
      deleteBanner(bannerToDelete.id);
      setBannerToDelete(null);
      setShowDeleteDialog(false);
    }
  }, [bannerToDelete, deleteBanner]);

  const handleReorderBanners = useCallback(
    (newOrder: Banner[]) => {
      reorderBanners(newOrder);
    },
    [reorderBanners]
  );

  // Simple drag and drop handlers (basic implementation)
  const handleDragStart = useCallback((banner: Banner) => {
    setDraggedBanner(banner);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBanner(null);
  }, []);

  const handleDrop = useCallback(
    (targetBanner: Banner) => {
      if (!draggedBanner || draggedBanner.id === targetBanner.id) return;

      const allBanners = [...banners];
      const draggedIndex = allBanners.findIndex(
        (b) => b.id === draggedBanner.id
      );
      const targetIndex = allBanners.findIndex((b) => b.id === targetBanner.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Remove dragged banner and insert at target position
      const [removed] = allBanners.splice(draggedIndex, 1);
      allBanners.splice(targetIndex, 0, removed);

      handleReorderBanners(allBanners);
    },
    [draggedBanner, banners, handleReorderBanners]
  );

  return (
    <div className={className}>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{banners.length}</div>
            <p className="text-sm text-muted-foreground">Total de Banners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {activeBanners.length}
            </div>
            <p className="text-sm text-muted-foreground">Banners Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">
              {7 - banners.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Espacios Disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Banner Limit Warning */}
      {banners.length >= 7 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                Límite Alcanzado
              </Badge>
              <span className="text-sm">
                Has alcanzado el límite máximo de 7 banners. Elimina uno
                existente para crear uno nuevo.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Banner Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Banners</h2>
          <p className="text-muted-foreground">
            Administra los banners que aparecen en la aplicación principal
          </p>
        </div>
        <Button
          onClick={handleCreateBanner}
          disabled={banners.length >= 7}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Banner
        </Button>
      </div>

      {/* Active Banners */}
      {activeBanners.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              Banners Activos ({activeBanners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBanners
                .sort((a, b) => a.order - b.order)
                .map((banner) => (
                  <div
                    key={banner.id}
                    draggable
                    onDragStart={() => handleDragStart(banner)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(banner)}
                    className="cursor-move"
                  >
                    <BannerCard
                      banner={banner}
                      onToggle={handleToggleBanner}
                      onEdit={handleEditBanner}
                      onDelete={() => handleDeleteBanner(banner)}
                      isDragging={draggedBanner?.id === banner.id}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Banners */}
      {inactiveBanners.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-500" />
              Banners Inactivos ({inactiveBanners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveBanners
                .sort((a, b) => a.order - b.order)
                .map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    onToggle={handleToggleBanner}
                    onEdit={handleEditBanner}
                    onDelete={() => handleDeleteBanner(banner)}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {banners.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                No hay banners creados
              </h3>
              <p>
                Crea tu primer banner para comenzar a mostrar contenido
                promocional.
              </p>
            </div>
            <Button onClick={handleCreateBanner}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Banner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner Modal */}
      <BannerModal
        open={showModal}
        onOpenChange={setShowModal}
        banner={selectedBanner}
        mode={modalMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El banner "
              {bannerToDelete?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
