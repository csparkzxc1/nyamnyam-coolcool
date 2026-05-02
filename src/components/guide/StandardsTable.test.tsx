import { render, screen } from '@testing-library/react-native';

import { StandardsTable } from './StandardsTable';

interface FixtureRow {
  ageLabel: string;
  total: string;
}

const rows: FixtureRow[] = [
  { ageLabel: '0~1개월', total: '14~18시간' },
  { ageLabel: '1~3개월', total: '14~17시간' },
  { ageLabel: '4~6개월', total: '12~16시간' },
];

const columns = [
  { header: '월령', accessor: (r: FixtureRow) => r.ageLabel },
  { header: '1일 총 수면', accessor: (r: FixtureRow) => r.total },
];

describe('StandardsTable', () => {
  it('renders the title and eyebrow', () => {
    render(
      <StandardsTable
        title="월령별 수면 표준"
        eyebrow="수면"
        columns={columns}
        rows={rows}
        isHighlighted={() => false}
      />,
    );
    expect(screen.getByText('수면')).toBeTruthy();
    expect(screen.getByText('월령별 수면 표준')).toBeTruthy();
  });

  it('renders one row per data entry plus a header row', () => {
    render(
      <StandardsTable
        title="t"
        columns={columns}
        rows={rows}
        isHighlighted={() => false}
      />,
    );
    // body rows
    expect(screen.getByText('0~1개월')).toBeTruthy();
    expect(screen.getByText('1~3개월')).toBeTruthy();
    expect(screen.getByText('4~6개월')).toBeTruthy();
    // header
    expect(screen.getByText('월령')).toBeTruthy();
    expect(screen.getByText('1일 총 수면')).toBeTruthy();
  });

  it('uses accessor to render each cell', () => {
    render(
      <StandardsTable
        title="t"
        columns={columns}
        rows={rows}
        isHighlighted={() => false}
      />,
    );
    expect(screen.getByText('14~18시간')).toBeTruthy();
    expect(screen.getByText('14~17시간')).toBeTruthy();
    expect(screen.getByText('12~16시간')).toBeTruthy();
  });

  it('passes only the matching row to isHighlighted as highlighted', () => {
    const isHighlighted = jest.fn((r: FixtureRow) => r.ageLabel === '1~3개월');
    render(
      <StandardsTable
        title="t"
        columns={columns}
        rows={rows}
        isHighlighted={isHighlighted}
      />,
    );
    expect(isHighlighted).toHaveBeenCalledTimes(rows.length);
    expect(isHighlighted).toHaveBeenCalledWith(rows[1]);
  });
});
