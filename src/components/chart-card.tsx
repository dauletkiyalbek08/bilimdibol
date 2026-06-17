import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function ChartCard({ title, description, action, children, className, bodyClassName }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("pt-0", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}
