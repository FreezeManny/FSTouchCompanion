export type ChecklistTuple = [string, string];

export type ChecklistBreak = { break: true };

export type ChecklistObject = {
  key: string;
  value?: string;
  subitems?: ChecklistTuple[];
};

export type ChecklistItem = ChecklistTuple | ChecklistObject | ChecklistBreak;

export type ChecklistSection = ChecklistItem[];

export type ChecklistData = {
  info: {
    name: string;
    codes: string[];
  };
  checklist: {
    [section: string]: ChecklistSection;
  };
};

