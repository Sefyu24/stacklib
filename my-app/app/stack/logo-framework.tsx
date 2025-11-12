"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LogoFramework({
  url,
  name,
}: {
  url: string;
  name: string;
}) {
  const clientId = process.env.BRANDFETCH_CLIENT_ID;

  // Construct the Brandfetch URL
  const imageUrl = clientId
    ? `https://cdn.brandfetch.io/${url}/icon/theme/light/h/80/w/80?c=${clientId}`
    : `https://cdn.brandfetch.io/${url}/icon/theme/dark/h/80/w/80`;

  return (
    <Avatar className="h-5 w-5 shrink-0">
      <AvatarImage
        src={imageUrl}
        alt={`${name} logo`}
        className="object-contain"
      />
      <AvatarFallback className="text-xs">{name[0]}</AvatarFallback>
    </Avatar>
  );
}
