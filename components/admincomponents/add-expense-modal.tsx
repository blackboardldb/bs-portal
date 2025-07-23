import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBlackSheepStore } from "@/lib/blacksheep-store";

export function AddExpenseModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const addEgreso = useBlackSheepStore((s) => s.addEgreso);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo || !fecha || !monto || isNaN(Number(monto))) return;
    setLoading(true);
    await addEgreso({ motivo, fecha, monto: Number(monto) });
    setLoading(false);
    setMotivo("");
    setFecha(new Date().toISOString().split("T")[0]);
    setMonto("");
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Agregar Egreso</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Egreso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Motivo</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Monto</Label>
            <Input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              min={0}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                loading || !motivo || !fecha || !monto || isNaN(Number(monto))
              }
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
