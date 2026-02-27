"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

function Bone({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
  );
}

export function ResultSkeleton() {
  return (
    <Card className="animate-in fade-in-0 duration-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bone className="size-5 rounded-full" />
          <Bone className="h-5 w-20" />
          <Bone className="h-5 w-24" />
          <div className="ml-auto flex gap-3">
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-12" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2 border-l-2 border-muted pl-3">
          <Bone className="h-3 w-10" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
        </div>
        <div className="space-y-2 rounded-md bg-muted/50 px-3 py-3">
          <Bone className="h-3 w-16" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
        </div>
        <div className="space-y-2">
          <Bone className="h-3 w-28" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {["field-1", "field-2", "field-3", "field-4", "field-5", "field-6"].map((id) => (
              <div key={id} className="space-y-1">
                <Bone className="h-3 w-16" />
                <Bone className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
