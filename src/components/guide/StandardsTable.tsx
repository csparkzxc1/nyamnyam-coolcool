import { Text, View } from 'react-native';

export interface StandardsTableColumn<Row> {
  /** Header label for the column. */
  header: string;
  /** Cell text extractor. */
  accessor: (row: Row) => string;
  /** Optional flex weight; defaults to 1. The label column is usually 1.2. */
  flex?: number;
}

export interface StandardsTableProps<Row extends { ageLabel: string }> {
  title: string;
  /** Optional small caption above the title (e.g. "수면"). */
  eyebrow?: string;
  columns: readonly StandardsTableColumn<Row>[];
  rows: readonly Row[];
  /** Predicate identifying the baby's current band; that row is highlighted. */
  isHighlighted: (row: Row) => boolean;
}

const HIGHLIGHT_BG = 'rgba(214, 142, 47, 0.10)';
const HIGHLIGHT_INK = '#B85428'; // accent-sienna

/**
 * Generic month-banded reference table for the Guide tab. The current age
 * band is highlighted with a sienna-tinted row to anchor the eye to "this
 * is your baby right now" without forcing the user to scan all rows.
 *
 * RN doesn't ship with a real <table>, so we render a flex grid: each
 * column shares a flex weight, and rows clip to a uniform 36pt height.
 */
export function StandardsTable<Row extends { ageLabel: string }>({
  title,
  eyebrow,
  columns,
  rows,
  isHighlighted,
}: StandardsTableProps<Row>) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <View>
        {eyebrow ? (
          <Text
            className="font-body text-[11px] uppercase tracking-[2px]"
            style={{ color: '#8A7A63' }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          className="font-display text-[16px] font-medium"
          style={{ color: '#2A1D12', marginTop: eyebrow ? 4 : 0 }}
        >
          {title}
        </Text>
      </View>

      <View>
        {/* Header row */}
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(42, 29, 18, 0.08)',
          }}
        >
          {columns.map((col, i) => (
            <Text
              key={`h-${i}`}
              className="font-body text-[11px] font-medium uppercase tracking-wide"
              style={{
                color: '#8A7A63',
                flex: col.flex ?? 1,
                paddingHorizontal: 4,
              }}
            >
              {col.header}
            </Text>
          ))}
        </View>

        {/* Body rows */}
        {rows.map((row, rowIdx) => {
          const highlighted = isHighlighted(row);
          return (
            <View
              key={`r-${row.ageLabel}-${rowIdx}`}
              style={{
                flexDirection: 'row',
                paddingVertical: 10,
                paddingHorizontal: 4,
                marginHorizontal: -4,
                borderRadius: 8,
                backgroundColor: highlighted ? HIGHLIGHT_BG : 'transparent',
              }}
            >
              {columns.map((col, colIdx) => {
                const isFirst = colIdx === 0;
                return (
                  <Text
                    key={`c-${rowIdx}-${colIdx}`}
                    className="font-body text-[12px]"
                    style={{
                      color: highlighted && isFirst ? HIGHLIGHT_INK : '#2A1D12',
                      fontWeight: highlighted && isFirst ? '600' : '400',
                      flex: col.flex ?? 1,
                      paddingHorizontal: 4,
                    }}
                  >
                    {col.accessor(row)}
                  </Text>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}
