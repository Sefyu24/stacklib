{
  /*
    This is how we will structure the data in our database. We have a stackSection that contains all information regarding a specific stack.
    Each section can have tools directly associated with it.

    Note that tools are directly under a Stack section. We have a stack which represents the five different stack sections. 

    TODO: Include other information on a stack like the user linked to this specific stack, date of creation etc... 
    
    */
}

import { frontendTools } from "./frontend-tools";
import { backendTools } from "./backend-tools";
import { ideTools } from "./ide-tools";
import { aiTools } from "./ai-tools";
import { otherTools } from "./other-tools";

export interface Section {
  id: SectionType;
  name: string;
  tools?: Tool[];
  selectedTools: Tool[];
  pinned: Tool[];
}

export type SectionType = "frontend" | "backend" | "ide" | "ai" | "other";

export interface Tool {
  id: string;
  name: string;
  url: string;
}

export interface Stack {
  id: string;
  name: string;
  stackSections: Section[];
}

export const sections: Section[] = [
  {
    id: "frontend",
    name: "Frontend",
    tools: frontendTools,
    selectedTools: [],
    pinned: [],
  },
  {
    id: "backend",
    name: "Backend",
    tools: backendTools,
    selectedTools: [],
    pinned: [],
  },
  {
    id: "ide",
    name: "IDE",
    tools: ideTools,
    selectedTools: [],
    pinned: [],
  },
  {
    id: "ai",
    name: "AI",
    tools: aiTools,
    selectedTools: [],
    pinned: [],
  },
  {
    id: "other",
    name: "Other",
    tools: otherTools,
    selectedTools: [],
    pinned: [],
  },
];
