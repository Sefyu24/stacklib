{
  /*
    This is how we will structure the data in our database. We have a stackSection that contains all information regarding a specific stack. It can then
    be broken down in multiple subsections to improve clarity and organize the stack better. 
    You can then have the Tools in a stack section or a substack. 

    Note that tools can directly be under a Stack section. We should also have a stack which representes the five different stack sections. 

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
  subsections?: Subsection[];
  tools?: Tool[];
  selectedTools: Tool[];
  pinned: Tool[];
}

export type SectionType = "frontend" | "backend" | "ide" | "ai" | "other";

export interface Subsection {
  id: string;
  name: string;
}

export interface Tool {
  id: string;
  name: string;
  url: string;
  subsectionId?: string;
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
