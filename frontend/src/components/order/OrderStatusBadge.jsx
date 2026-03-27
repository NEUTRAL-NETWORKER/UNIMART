import Badge from '../common/Badge';
import { ORDER_STATUS_LABELS } from '../../constants';

export default function OrderStatusBadge({ status }) {
  const config = ORDER_STATUS_LABELS[status];
  if (!config) return null;

  return (
    <Badge color={config.color} dot>
      {config.label}
    </Badge>
  );
}
