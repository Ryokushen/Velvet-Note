import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function makeIcon(name: React.ComponentProps<typeof Feather>['name']) {
  return function Icon(props: IconProps) {
    const size = props.size ?? 20;
    const color = props.color ?? colors.text;
    return <Feather name={name} size={size} color={color} />;
  };
}

export const IconSearch = makeIcon('search');
export const IconPlus = makeIcon('plus');
export const IconX = makeIcon('x');
export const IconChevronLeft = makeIcon('chevron-left');
export const IconChevronRight = makeIcon('chevron-right');
export const IconEdit = makeIcon('edit-2');
export const IconTrash = makeIcon('trash-2');
export const IconLogOut = makeIcon('log-out');
export const IconBook = makeIcon('book-open');
export const IconCalendar = makeIcon('calendar');
export const IconCamera = makeIcon('camera');
export const IconBarChart = makeIcon('bar-chart-2');
export const IconZap = makeIcon('zap');
