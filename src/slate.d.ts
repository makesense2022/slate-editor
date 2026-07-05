import type { BaseEditor, Descendant } from 'slate';
import type { HistoryEditor } from 'slate-history';
import type { ReactEditor } from 'slate-react';

type CustomText = {
  text: string;
  bold?: boolean;
  [key: string]: unknown;
};

type CustomElement = {
  type?: string;
  children: Descendant[];
  checked?: boolean;
  url?: string;
  latex?: string;
  language?: string;
  [key: string]: unknown;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
