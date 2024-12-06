'use client';

import { createContext } from 'react';

export type PropertyViewType = 'grid' | 'list';

export const PropertyViewContext = createContext<PropertyViewType>('grid');

export function PropertyViewProvider({
  children,
  view,
}: {
  children: React.ReactNode;
  view: PropertyViewType;
}) {
  return (
    <PropertyViewContext.Provider value={view}>
      {children}
    </PropertyViewContext.Provider>
  );
}
