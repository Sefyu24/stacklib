{
  /*
    This is how we will structure the data in our database. We have a stackSection that contains all information regarding a specific stack. It can then
    be broken down in multiple subsections to improve clarity and organize the stack better. 
    You can then have the Tools in a stack section or a substack. 

    Note that tools can directly be under a Stack section. We should also have a stack which representes the five different stack sections. 

    TODO: Include other information on a stack like the user linked to this specific stack, date of creation etc... 
    
    */
}

export interface Section {
  id: SectionType;
  name: string;
  subsections?: Subsection[];
  tools?: Tool[];
  pinned: Tool[];
}

export type SectionType = "frontend" | "backend" | "ide" | "ai" | "other";

export interface Subsection {
  id: string;
  name: string;
  tools: Tool[];
}

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
