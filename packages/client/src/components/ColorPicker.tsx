import { PLAYER_COLORS } from '@fodinha/shared';

export default function ColorPicker({
  value,
  onChange,
  takenColors = [],
}: {
  value: string;
  onChange: (color: string) => void;
  takenColors?: string[];
}) {
  return (
    <div className="color-picker">
      {PLAYER_COLORS.map((color) => {
        const taken = takenColors.includes(color) && color !== value;
        return (
          <button
            key={color}
            type="button"
            className={`color-swatch ${value === color ? 'active' : ''} ${taken ? 'taken' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => !taken && onChange(color)}
            disabled={taken}
            title={taken ? 'Cor em uso' : undefined}
          />
        );
      })}
    </div>
  );
}
