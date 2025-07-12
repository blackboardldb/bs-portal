// src/components/ClassesHomeCard.tsx
"use client";

import { Clock3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ClassItem } from "@/lib/mock-data";

interface ClassesHomeCardProps {
  classes: ClassItem[];
  onClassClick?: (classItem: ClassItem) => void;
}

export function ClassesHomeCard({
  classes,
  onClassClick,
}: ClassesHomeCardProps) {
  const today = new Date();
  const todayClasses = classes.filter((classItem) => {
    const classDate = parseISO(classItem.dateTime);
    return (
      classDate.getDate() === today.getDate() &&
      classDate.getMonth() === today.getMonth() &&
      classDate.getFullYear() === today.getFullYear()
    );
  });

  const upcomingClasses = classes
    .filter((classItem) => {
      const classDate = parseISO(classItem.dateTime);
      return classDate > today;
    })
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Clases de Hoy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Clases de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <p className="text-muted-foreground">
              No hay clases programadas para hoy
            </p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onClassClick?.(classItem)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{classItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(classItem.dateTime), "HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {classItem.alumnRegistred}
                    </Badge>
                    <Badge variant="outline">{classItem.duration}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Clases */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Clases</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingClasses.length === 0 ? (
            <p className="text-muted-foreground">
              No hay clases programadas próximamente
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onClassClick?.(classItem)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{classItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          parseISO(classItem.dateTime),
                          "EEEE, d 'de' MMMM 'a las' HH:mm",
                          { locale: es }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {classItem.alumnRegistred}
                    </Badge>
                    <Badge variant="outline">{classItem.duration}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
