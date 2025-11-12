"use client";

import { StackSection } from "@/lib/stack/structure";
import {
  CardAction,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

export default function StackSectionComponent({
  name,
  subsections,
  tools,
}: StackSection) {
  return (
    <div>
      <p> This is the Section of {name}</p>

      {subsections?.length == 0 ? (
        <div>no subsection defined</div>
      ) : (
        subsections?.map((subsection) => {
          return <div key={subsection.id}>subsection {subsection.name}</div>;
        })
      )}
    </div>
  );
}
