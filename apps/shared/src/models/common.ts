type Option<T extends string> = {
  label: string;
  value: T;
};

type Options<T extends string> = ReadonlyArray<Option<T>>;

export function formatOption<T extends string>(options: Options<T>, value: T) {
  return (
    options.find((option) => option.value === value)?.label || "Unknown value"
  );
}
