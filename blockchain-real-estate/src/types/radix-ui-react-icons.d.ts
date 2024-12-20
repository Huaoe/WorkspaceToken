declare module '@radix-ui/react-icons' {
  import * as React from 'react'
  export interface IconProps extends React.SVGAttributes<SVGElement> {
    size?: number
  }
  export type Icon = React.ForwardRefExoticComponent<IconProps>
  
  // Export all icons as React components
  export const Cross1Icon: Icon
  export const CheckIcon: Icon
  export const ChevronRightIcon: Icon
  export const ChevronLeftIcon: Icon
  export const ChevronDownIcon: Icon
  export const PlusIcon: Icon
  export const MinusIcon: Icon
  // Add other icons as needed
}
