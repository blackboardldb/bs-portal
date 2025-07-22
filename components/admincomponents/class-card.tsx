"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Users } from "lucide-react";

type TransformedClass = {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean;
  status: string;
  discipline: string;
  disciplineId: string;
  date: string;
  time: string;
  color: string;
  capacity: number;
  enrolled: number;
  type: "extra" | "regular";
  cancelled: boolean;
  registeredParticipantsIds: string[];
  waitlistParticipantsIds?: string[];
  isGenerated: boolean;
  isExtra: boolean;
  historicalData: {
    averageAttendance: number;
    noShowRate: number;
    waitlistFrequency: number;
    popularityTrend: "up" | "down" | "stable";
  };
  notes: string;
};

interface ClassCardProps {
  cls: TransformedClass;
  onViewDetails: (cls: TransformedClass) => void;
  onCancel: (classId: string) => void;
  isLoading?: boolean;
}

export default function ClassCard({
  cls,
  onViewDetails,
  onCancel,
  isLoading = false,
}: ClassCardProps) {
  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-lg">{cls.name}</h4>
            <p className="text-sm text-gray-600">{cls.instructor}</p>
          </div>
          <Badge
            variant={
              cls.isGenerated
                ? "secondary"
                : cls.isExtra
                ? "default"
                : "outline"
            }
            className="text-xs"
          >
            {cls.isGenerated
              ? "Sin inscritos"
              : cls.isExtra
              ? "Extra"
              : "Confirmada"}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          {cls.instructor && (
            <>
              <User className="w-4 h-4" />
              <span>{cls.instructor}</span>
            </>
          )}
          <Clock className="w-4 h-4" />
          <span>{cls.time}</span>
          <Clock className="w-4 h-4" />
          <span>{cls.duration}</span>
          <Users className="w-4 h-4" />
          <span>{cls.alumnRegistred}</span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(cls)}
          >
            Ver Detalles
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(cls.id)}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Cancelar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
