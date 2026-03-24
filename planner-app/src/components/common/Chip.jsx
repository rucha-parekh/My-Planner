import { categoryColor } from '../../utils/dateUtils';
import styles from './Chip.module.css';

export default function Chip({ category, label, style }) {
  const colors = categoryColor(category);
  return (
    <span
      className={styles.chip}
      style={{ background: colors.bg, color: colors.text, ...style }}
    >
      {label || category}
    </span>
  );
}
