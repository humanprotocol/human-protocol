import { type MenuItem, type DrawerItem } from '../protected';

export function isDrawerItem(item: MenuItem): item is DrawerItem {
  return 'label' in item;
}
